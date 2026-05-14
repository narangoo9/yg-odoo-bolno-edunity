import https from "node:https";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const videos = [
  { id: "LDB4uaJ87e0", slug: "youtube-react-crash-course-traversy", level: "INTERMEDIATE", tags: ["react", "frontend"] },
  { id: "mTz0GXj8NN0", slug: "youtube-nextjs-crash-course-traversy", level: "INTERMEDIATE", tags: ["nextjs", "react"] },
  { id: "BCg4U1FzODs", slug: "youtube-typescript-crash-course-traversy", level: "BEGINNER", tags: ["typescript", "javascript"] },
  { id: "dFgzHOX84xQ", slug: "youtube-tailwind-crash-course-traversy", level: "BEGINNER", tags: ["tailwind", "css"] },
  { id: "MFh0Fd7BsjE", slug: "youtube-laravel-crash-course-traversy", level: "INTERMEDIATE", tags: ["laravel", "php"] },
  { id: "BUCiSSyIGGU", slug: "youtube-php-for-beginners-traversy", level: "BEGINNER", tags: ["php", "backend"] },
  { id: "PtQiiknWUcI", slug: "youtube-python-django-seven-hour-course-traversy", level: "INTERMEDIATE", tags: ["python", "django"] },
  { id: "3dHNOWTI7H8", slug: "youtube-angular-crash-course-traversy", level: "INTERMEDIATE", tags: ["angular", "frontend"] },
  { id: "a_iQb1lnAEQ", slug: "youtube-html-css-full-course-freecodecamp", level: "BEGINNER", tags: ["html", "css"] },
  { id: "pTFZFxd4hOI", slug: "youtube-docker-tutorial-mosh", level: "BEGINNER", tags: ["docker", "devops"] },
];

const timestampPattern = /^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*(?:[-|:—–•]\s*)?(.*?)\s*$/;

function requestText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function decodeJsonString(value = "") {
  return decodeHtml(
    value
      .replace(/\\n/g, "\n")
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/")
      .replace(/\\"/g, '"'),
  );
}

function parseTimeToSeconds(input) {
  const parts = input.trim().split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((part) => /^\d+$/.test(part))) return null;
  const nums = parts.map(Number);

  if (nums.length === 2) {
    const [minutes, seconds] = nums;
    if (seconds > 59) return null;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = nums;
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function parseSections(description, durationSeconds) {
  const rows = description
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(timestampPattern);
      if (!match) return null;
      const startSeconds = parseTimeToSeconds(match[1]);
      if (startSeconds == null) return null;
      return { startSeconds, title: match[2]?.trim() || "" };
    })
    .filter(Boolean)
    .sort((a, b) => a.startSeconds - b.startSeconds);

  const unique = rows.filter((row, index, arr) => index === 0 || row.startSeconds !== arr[index - 1].startSeconds);

  return unique.map((row, index) => ({
    title: row.title || `Section ${index + 1}`,
    order: index + 1,
    startSeconds: row.startSeconds,
    endSeconds: unique[index + 1]?.startSeconds ?? durationSeconds,
  }));
}

function safeSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchYouTubeMeta(videoId) {
  const html = await requestText(`https://www.youtube.com/watch?v=${videoId}`);
  const title = decodeHtml(html.match(/<title>(.*?)<\/title>/)?.[1] ?? "").replace(/\s+- YouTube$/, "");
  const author = decodeJsonString(html.match(/"author":"([^"]+)"/)?.[1] ?? "");
  const channelId = html.match(/"channelId":"([^"]+)"/)?.[1] ?? videoId;
  const avatarUrl = decodeJsonString(html.match(/"avatar".*?"url":"(https:[^"]+)/)?.[1] ?? "");
  const durationSeconds = Number(html.match(/"lengthSeconds":"(\d+)"/)?.[1] ?? 0);
  const rawDescription = html.match(/shortDescription":"([\s\S]*?)","isCrawlable/)?.[1] ?? "";
  const description = decodeJsonString(rawDescription);

  if (!title || !author || !durationSeconds || !description) {
    throw new Error(`Could not read complete YouTube metadata for ${videoId}`);
  }

  return {
    videoId,
    title,
    author,
    channelId,
    avatarUrl,
    durationSeconds,
    description,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    coverImage: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  };
}

async function upsertYouTubeInstructor(meta) {
  const email = `${safeSlug(meta.author)}-${meta.channelId.toLowerCase()}@youtube.local`;
  return prisma.user.upsert({
    where: { email },
    update: {
      name: meta.author,
      avatarUrl: meta.avatarUrl || null,
      bio: `Official YouTube channel: ${meta.author}`,
      role: "INSTRUCTOR",
      status: "ACTIVE",
    },
    create: {
      name: meta.author,
      email,
      avatarUrl: meta.avatarUrl || null,
      bio: `Official YouTube channel: ${meta.author}`,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });
}

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "programming" },
    update: { name: "Programming" },
    create: { name: "Programming", slug: "programming", description: "Real YouTube programming courses" },
  });

  for (const video of videos) {
    const meta = await fetchYouTubeMeta(video.id);
    const sections = parseSections(meta.description, meta.durationSeconds);
    if (sections.length === 0) {
      throw new Error(`No timestamp sections found for ${meta.title} (${meta.videoId})`);
    }

    const instructor = await upsertYouTubeInstructor(meta);

    const course = await prisma.course.upsert({
      where: { slug: video.slug },
      update: {
        title: meta.title,
        description: `Official YouTube course from ${meta.author}: ${meta.url}`,
        shortDescription: `Official ${meta.author} video split by real YouTube timestamps.`,
        thumbnailUrl: meta.coverImage,
        coverImage: meta.coverImage,
        previewVideoUrl: meta.url,
        sourceType: "YOUTUBE",
        sourceYoutubeId: meta.videoId,
        sourceYoutubeUrl: meta.url,
        durationSeconds: meta.durationSeconds,
        duration: Math.ceil(meta.durationSeconds / 60),
        level: video.level,
        language: "en",
        price: 0,
        currency: "MNT",
        status: "PUBLISHED",
        tags: ["youtube", ...video.tags],
        prerequisites: [],
        learningOutcomes: [`Learn from the official ${meta.author} YouTube video`],
        isFeatured: true,
        publishedAt: new Date(),
        instructorId: instructor.id,
        categoryId: category.id,
      },
      create: {
        slug: video.slug,
        title: meta.title,
        description: `Official YouTube course from ${meta.author}: ${meta.url}`,
        shortDescription: `Official ${meta.author} video split by real YouTube timestamps.`,
        thumbnailUrl: meta.coverImage,
        coverImage: meta.coverImage,
        previewVideoUrl: meta.url,
        sourceType: "YOUTUBE",
        sourceYoutubeId: meta.videoId,
        sourceYoutubeUrl: meta.url,
        durationSeconds: meta.durationSeconds,
        duration: Math.ceil(meta.durationSeconds / 60),
        level: video.level,
        language: "en",
        price: 0,
        currency: "MNT",
        status: "PUBLISHED",
        tags: ["youtube", ...video.tags],
        prerequisites: [],
        learningOutcomes: [`Learn from the official ${meta.author} YouTube video`],
        isFeatured: true,
        publishedAt: new Date(),
        instructorId: instructor.id,
        categoryId: category.id,
      },
    });

    await prisma.courseSection.deleteMany({ where: { courseId: course.id } });
    await prisma.courseSection.createMany({
      data: sections.map((section) => ({
        courseId: course.id,
        title: section.title,
        order: section.order,
        startSeconds: section.startSeconds,
        endSeconds: section.endSeconds,
      })),
    });

    console.log(`${meta.title}: ${sections.length} sections, video ${meta.videoId}, channel ${meta.author}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
