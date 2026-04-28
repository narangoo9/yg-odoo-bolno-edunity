import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { storage, validateFile, FILE_LIMITS } from "@/lib/storage";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";
import { rateLimit } from "@/lib/cache";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    // Rate limit: 20 uploads per hour per user
    const { success } = await rateLimit(`upload:${session.user.id}`, 20, 3600);
    if (!success) return badRequest("Хүсэлт хэт олон. Дараа дахин оролдоно уу.");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as keyof typeof FILE_LIMITS) ?? "IMAGE";
    const folder = (formData.get("folder") as string) ?? "uploads";

    if (!file) return badRequest("Файл олдсонгүй");

    const validation = validateFile({ size: file.size, type: file.type }, category);
    if (!validation.valid) return badRequest(validation.error);

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await storage.upload(buffer, {
      folder: `${folder}/${session.user.id}`,
      filename: `${Date.now()}-${file.name.replace(/\s+/g, "-")}`,
      contentType: file.type,
    });

    return ok(result);
  } catch (err) {
    console.error("Upload error:", err);
    return serverError("Файл оруулахад алдаа гарлаа");
  }
}
