/**
 * Worker process entry point
 * Run with: tsx src/workers/index.ts
 *
 * In production: pm2 start worker.config.js
 */

import {
  startEmailWorker,
  startCertificateWorker,
  startReminderWorker,
  closeQueues,
} from "@/lib/queue";

console.log("🚀 Worker process эхэлж байна...");

const workers = [
  startEmailWorker(),
  startCertificateWorker(),
  startReminderWorker(),
];

workers.forEach((w) => {
  w.on("completed", (job) => {
    console.log(`✅ [${w.name}] Job ${job.id} дууссан`);
  });
  w.on("failed", (job, err) => {
    console.error(`❌ [${w.name}] Job ${job?.id} failed:`, err.message);
  });
});

// Graceful shutdown
async function shutdown() {
  console.log("\n🛑 Worker унтарч байна...");
  await Promise.all(workers.map((w) => w.close()));
  await closeQueues();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
