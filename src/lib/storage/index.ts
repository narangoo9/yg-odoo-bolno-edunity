import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * File storage abstraction.
 * Uses Cloudinary when configured, with a local public/uploads fallback for
 * development and offline installs.
 */

export interface UploadResult {
  url: string;
  publicId: string;
  size: number;
  format: string;
}

export interface StorageAdapter {
  upload(file: Buffer, options: { folder: string; filename?: string; contentType?: string }): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
  getSignedUrl(publicId: string, expiresIn?: number): Promise<string>;
}

// ─── CLOUDINARY ADAPTER ─────────────────────────────────────────────────────
class CloudinaryAdapter implements StorageAdapter {
  private apiUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}`;

  async upload(file: Buffer, { folder, filename }: { folder: string; filename?: string }) {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(file)]));
    form.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET ?? "ml_default");
    form.append("folder", folder);
    if (filename) form.append("public_id", filename);

    const res = await fetch(`${this.apiUrl}/auto/upload`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) throw new Error("Cloudinary upload failed");

    const data = await res.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      size: data.bytes,
      format: data.format,
    };
  }

  async delete(publicId: string): Promise<void> {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiKey || !apiSecret) {
      console.warn("Cloudinary credentials not configured, skipping delete");
      return;
    }

    const timestamp = Math.round(Date.now() / 1000);
    const { createHash } = await import("crypto");
    const signature = createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    await fetch(`${this.apiUrl}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId, api_key: apiKey, timestamp, signature }),
    });
  }

  async getSignedUrl(publicId: string): Promise<string> {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
  }
}

class LocalPublicStorageAdapter implements StorageAdapter {
  async upload(
    file: Buffer,
    {
      folder,
      filename,
      contentType,
    }: { folder: string; filename?: string; contentType?: string },
  ) {
    const safeFolder = sanitizePath(folder);
    const safeFilename = sanitizeFilename(filename ?? `upload-${Date.now()}`);
    const extension = getExtension(safeFilename, contentType);
    const finalFilename = path.extname(safeFilename) ? safeFilename : `${safeFilename}${extension}`;
    const publicId = path.posix.join("uploads", safeFolder, finalFilename);
    const uploadDir = path.join(process.cwd(), "public", "uploads", ...safeFolder.split("/"));

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, finalFilename), file);

    return {
      url: `/${publicId}`,
      publicId,
      size: file.byteLength,
      format: extension.replace(".", "") || "bin",
    };
  }

  async delete(publicId: string): Promise<void> {
    void publicId;
  }

  async getSignedUrl(publicId: string): Promise<string> {
    return publicId.startsWith("/") ? publicId : `/${publicId}`;
  }
}

class FallbackStorageAdapter implements StorageAdapter {
  private cloudinary = new CloudinaryAdapter();
  private local = new LocalPublicStorageAdapter();

  async upload(file: Buffer, options: { folder: string; filename?: string; contentType?: string }) {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET) {
      try {
        return await this.cloudinary.upload(file, options);
      } catch (error) {
        console.warn("Cloudinary upload failed, falling back to local public storage", error);
      }
    }

    return this.local.upload(file, options);
  }

  async delete(publicId: string): Promise<void> {
    if (publicId.startsWith("uploads/") || publicId.startsWith("/uploads/")) return;
    return this.cloudinary.delete(publicId);
  }

  async getSignedUrl(publicId: string): Promise<string> {
    if (publicId.startsWith("uploads/") || publicId.startsWith("/uploads/")) {
      return this.local.getSignedUrl(publicId);
    }
    return this.cloudinary.getSignedUrl(publicId);
  }
}

function sanitizePath(value: string) {
  return value
    .split(/[\\/]+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9-_]/g, "-"))
    .join("/");
}

function sanitizeFilename(value: string) {
  const parsed = path.parse(value);
  const name = parsed.name.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return `${name || "upload"}${ext}`;
}

function getExtension(filename: string, contentType?: string) {
  const existing = path.extname(filename);
  if (existing) return existing.toLowerCase();

  switch (contentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "application/pdf":
      return ".pdf";
    case "video/mp4":
      return ".mp4";
    case "video/quicktime":
      return ".mov";
    default:
      return "";
  }
}

export const storage: StorageAdapter = new FallbackStorageAdapter();

// ─── VALIDATION ─────────────────────────────────────────────────────────────

export const FILE_LIMITS = {
  IMAGE: { maxSize: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  VIDEO: { maxSize: 500 * 1024 * 1024, types: ["video/mp4", "video/quicktime"] },
  DOCUMENT: { maxSize: 20 * 1024 * 1024, types: ["application/pdf"] },
  AVATAR: { maxSize: 2 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
};

export function validateFile(
  file: { size: number; type: string },
  category: keyof typeof FILE_LIMITS
): { valid: true } | { valid: false; error: string } {
  const limit = FILE_LIMITS[category];
  if (file.size > limit.maxSize) {
    return { valid: false, error: `Файлын хэмжээ ${limit.maxSize / 1024 / 1024}MB-аас хэтрэхгүй байх ёстой` };
  }
  if (!limit.types.includes(file.type)) {
    return { valid: false, error: `Зөвшөөрөгдөх формат: ${limit.types.join(", ")}` };
  }
  return { valid: true };
}
