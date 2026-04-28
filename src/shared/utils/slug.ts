import { db } from "@/lib/db";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateSlug(
  title: string,
  table: "courses" | "organizations"
): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let counter = 1;

  while (true) {
    let existing: unknown;
    if (table === "courses") {
      existing = await db.course.findUnique({ where: { slug } });
    } else {
      existing = await db.organization.findUnique({ where: { slug } });
    }
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
}
