type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private maxLocalLogs = 100;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: import.meta.env.MODE === "production" ? "info" : "debug",
      enableConsole: true,
      enableRemote: import.meta.env.MODE === "production",
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.context) {
      parts.push(JSON.stringify(entry.context));
    }

    return parts.join(" ");
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };
  }

  private storeEntry(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLocalLogs) {
      this.logs.shift();
    }
  }

  private outputToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formatted = this.formatEntry(entry);

    switch (entry.level) {
      case "debug":
        console.debug(formatted, entry.error || "");
        break;
      case "info":
        console.info(formatted, entry.error || "");
        break;
      case "warn":
        console.warn(formatted, entry.error || "");
        break;
      case "error":
        console.error(formatted, entry.error || "");
        break;
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createEntry(level, message, context, error);
    this.storeEntry(entry);
    this.outputToConsole(entry);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): void {
    const err = error instanceof Error ? error : undefined;
    const ctx = error instanceof Error ? context : (error as Record<string, unknown>);
    this.log("error", message, ctx, err);
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count = 20): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Create a child logger with preset context
   */
  child(defaultContext: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: Record<string, unknown>
  ) {}

  private mergeContext(context?: Record<string, unknown>): Record<string, unknown> {
    return { ...this.defaultContext, ...context };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): void {
    this.parent.error(message, error, this.mergeContext(context));
  }
}

// Singleton logger instance
export const logger = new Logger();

// Export types
export type { LogLevel, LogEntry, LoggerConfig };
