import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { getAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { revalidateUserNotifications } from "@/lib/dashboard-cache";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL must be configured before starting background workers");
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue("email", { connection });
export const certificateQueue = new Queue("certificate", { connection });
export const reminderQueue = new Queue("reminder", { connection });
export const analyticsQueue = new Queue("analytics", { connection });

export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface CertificateJob {
  certificateId: string;
}

export interface ReminderJob {
  userId: string;
  type: "course_inactivity" | "live_class" | "subscription_expiry";
  data: Record<string, unknown>;
}

export async function queueEmail(job: EmailJob) {
  return emailQueue.add("send", job, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  });
}

export async function queueCertificateGeneration(certificateId: string) {
  return certificateQueue.add(
    "generate",
    { certificateId },
    {
      attempts: 3,
      removeOnComplete: true,
    }
  );
}

export async function scheduleReminder(job: ReminderJob, delayMs: number) {
  return reminderQueue.add("send", job, { delay: delayMs });
}

export function startEmailWorker() {
  const worker = new Worker<EmailJob>(
    "email",
    async (job) => {
      await sendEmail(job.data);
    },
    { connection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[email-worker] Job ${job?.id} failed:`, err);
  });
  worker.on("error", (err) => {
    console.error("[email-worker] Worker error:", err);
  });

  return worker;
}

export function startCertificateWorker() {
  const appUrl = getAppUrl();

  const worker = new Worker<CertificateJob>(
    "certificate",
    async (job) => {
      const cert = await db.certificate.findUnique({
        where: { id: job.data.certificateId },
        include: {
          student: true,
          course: true,
          program: { select: { title: true, certificateTitle: true } },
        },
      });
      if (!cert) return;

      await queueEmail({
        to: cert.student.email,
        subject: "Сертификат бэлэн болсон! 🎉",
        template: "certificate-ready",
        data: {
          courseTitle:
            cert.course?.title ??
            cert.program?.certificateTitle ??
            cert.program?.title ??
            "Сургалтын программ",
          certUrl: `${appUrl}/student/settings#certificates`,
          viewUrl: `${appUrl}/student/certificates/${cert.id}/share`,
          downloadUrl: `${appUrl}/api/v1/certificates/${cert.id}/download`,
          verifyUrl: `${appUrl}/verify/${cert.verificationCode}`,
        },
      });
    },
    { connection, concurrency: 3 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[certificate-worker] Job ${job?.id} failed:`, err);
  });
  worker.on("error", (err) => {
    console.error("[certificate-worker] Worker error:", err);
  });

  return worker;
}

export function startReminderWorker() {
  const worker = new Worker<ReminderJob>(
    "reminder",
    async (job) => {
      const { userId, type } = job.data;
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return;

      if (type === "course_inactivity") {
        await db.notification.create({
          data: {
            userId,
            type: "COURSE_REMINDER",
            title: "Сургалтаа үргэлжлүүлээрэй",
            body: "Та курсээсээ хойшлоод сурчээгүй байна. Өнөөдрөөс дахин эхэл!",
          },
        });
        revalidateUserNotifications(userId);
      }
    },
    { connection, concurrency: 3 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[reminder-worker] Job ${job?.id} failed:`, err);
  });
  worker.on("error", (err) => {
    console.error("[reminder-worker] Worker error:", err);
  });

  return worker;
}

export async function closeQueues() {
  await Promise.all([
    emailQueue.close(),
    certificateQueue.close(),
    reminderQueue.close(),
    analyticsQueue.close(),
    connection.quit(),
  ]);
}
