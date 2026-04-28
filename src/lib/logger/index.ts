type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  time: string;
  service: string;
  [key: string]: unknown;
}

function log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    msg,
    time: new Date().toISOString(),
    service: "elearn-api",
    ...meta,
  };

  if (process.env.NODE_ENV === "production") {
    // JSON structured output for log aggregators (Datadog, Loki, CloudWatch)
    process.stdout.write(JSON.stringify(entry) + "\n");
  } else {
    const color = { debug: "\x1b[36m", info: "\x1b[32m", warn: "\x1b[33m", error: "\x1b[31m" }[level];
    console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${entry.time} — ${msg}`, meta ?? "");
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info:  (msg: string, meta?: Record<string, unknown>) => log("info",  msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => log("warn",  msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
