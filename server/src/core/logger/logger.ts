type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";

const shouldLog = (level: LogLevel): boolean => levels[level] >= levels[currentLevel];

const write = (level: LogLevel, message: string, meta?: Record<string, unknown>): void => {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ?? {}),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>): void => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>): void => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>): void => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>): void => write("error", message, meta),
};
