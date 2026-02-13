/**
 * Logging Utility
 *
 * Structured logging for the application with context and timestamps.
 * Provides consistent logging across all modules with different log levels.
 */

// ============================================================================
// LOG LEVELS
// ============================================================================

/**
 * Log level enum
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Log level names
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SILENT]: 'SILENT',
};

/**
 * Log level colors for console output
 */
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m', // Green
  [LogLevel.WARN]: '\x1b[33m', // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.SILENT]: '\x1b[0m', // Reset
};

/**
 * Reset color code
 */
const RESET_COLOR = '\x1b[0m';

// ============================================================================
// LOG ENTRY INTERFACE
// ============================================================================

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  levelName: string;
  timestamp: string;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  requestId?: string;
  module?: string;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

/**
 * Logger class for structured logging
 */
class Logger {
  private currentLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // Set log level based on environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.currentLevel = this.parseLogLevel(envLevel);
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Parses a log level string to LogLevel enum
   */
  private parseLogLevel(level?: string): LogLevel {
    switch (level) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      case 'SILENT':
        return LogLevel.SILENT;
      default:
        return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  /**
   * Checks if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  /**
   * Formats a timestamp
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Formats a log entry for console output
   */
  private formatLogEntry(entry: LogEntry): string {
    const color = LOG_LEVEL_COLORS[entry.level];
    const reset = RESET_COLOR;
    const prefix = `${color}[${entry.levelName}]${reset} ${entry.timestamp}`;

    let message = `${prefix} ${entry.message}`;

    if (entry.module) {
      message += ` [${entry.module}]`;
    }

    if (entry.userId) {
      message += ` (user: ${entry.userId})`;
    }

    if (entry.requestId) {
      message += ` (req: ${entry.requestId})`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      message += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack && this.isDevelopment) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return message;
  }

  /**
   * Creates a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      levelName: LOG_LEVEL_NAMES[level],
      timestamp: this.getTimestamp(),
      message,
      context,
      error,
    };
  }

  /**
   * Outputs a log entry to the console
   */
  private output(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  /**
   * Logs a debug message
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.output(entry);
  }

  /**
   * Logs an info message
   */
  public info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.output(entry);
  }

  /**
   * Logs a warning message
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.output(entry);
  }

  /**
   * Logs an error message
   */
  public error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.output(entry);
  }

  /**
   * Sets the current log level
   */
  public setLevel(level: LogLevel | string): void {
    if (typeof level === 'string') {
      this.currentLevel = this.parseLogLevel(level);
    } else {
      this.currentLevel = level;
    }
  }

  /**
   * Gets the current log level
   */
  public getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Creates a child logger with additional context
   */
  public child(defaultContext: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

/**
 * Child logger with pre-configured context
 */
class ChildLogger {
  private parent: Logger;
  private defaultContext: Record<string, unknown>;

  constructor(parent: Logger, defaultContext: Record<string, unknown>) {
    this.parent = parent;
    this.defaultContext = defaultContext;
  }

  /**
   * Merges default context with provided context
   */
  private mergeContext(context?: Record<string, unknown>): Record<string, unknown> {
    return { ...this.defaultContext, ...context };
  }

  /**
   * Logs a debug message with default context
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  /**
   * Logs an info message with default context
   */
  public info(message: string, context?: Record<string, unknown>): void {
    this.parent.info(message, this.mergeContext(context));
  }

  /**
   * Logs a warning message with default context
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  /**
   * Logs an error message with default context
   */
  public error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.parent.error(message, error, this.mergeContext(context));
  }
}

// ============================================================================
// GLOBAL LOGGER INSTANCE
// ============================================================================

/**
 * Global logger instance
 */
export const logger = new Logger();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Logs a debug message
 */
export function logDebug(message: string, context?: Record<string, unknown>): void {
  logger.debug(message, context);
}

/**
 * Logs an info message
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  logger.info(message, context);
}

/**
 * Logs a warning message
 */
export function logWarn(message: string, context?: Record<string, unknown>): void {
  logger.warn(message, context);
}

/**
 * Logs an error message
 */
export function logError(message: string, error?: Error, context?: Record<string, unknown>): void {
  logger.error(message, error, context);
}

/**
 * Creates a child logger with module context
 */
export function createModuleLogger(moduleName: string): ChildLogger {
  return logger.child({ module: moduleName });
}

// ============================================================================
// REQUEST LOGGER
// ============================================================================

/**
 * Request logger for tracking HTTP requests
 */
export class RequestLogger {
  private requestId: string;
  private userId?: string;
  private startTime: number;
  private childLogger: ChildLogger;

  constructor(requestId: string, userId?: string) {
    this.requestId = requestId;
    this.userId = userId;
    this.startTime = Date.now();
    this.childLogger = logger.child({
      requestId: this.requestId,
      userId: this.userId,
    });
  }

  /**
   * Logs request start
   */
  public start(method: string, path: string): void {
    this.childLogger.info('Request started', {
      method,
      path,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logs request completion
   */
  public complete(statusCode: number, responseTime?: number): void {
    const duration = responseTime || Date.now() - this.startTime;
    this.childLogger.info('Request completed', {
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logs request error
   */
  public error(error: Error, statusCode?: number): void {
    const duration = Date.now() - this.startTime;
    this.childLogger.error('Request failed', error, {
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logs a debug message for this request
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    this.childLogger.debug(message, context);
  }

  /**
   * Logs an info message for this request
   */
  public info(message: string, context?: Record<string, unknown>): void {
    this.childLogger.info(message, context);
  }

  /**
   * Logs a warning message for this request
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    this.childLogger.warn(message, context);
  }
}

/**
 * Creates a request logger
 */
export function createRequestLogger(requestId: string, userId?: string): RequestLogger {
  return new RequestLogger(requestId, userId);
}

// ============================================================================
// PERFORMANCE LOGGER
// ============================================================================

/**
 * Performance logger for measuring operation duration
 */
export class PerformanceLogger {
  private operation: string;
  private startTime: number;
  private childLogger: ChildLogger;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
    this.childLogger = logger.child({ operation });
  }

  /**
   * Logs the operation completion with duration
   */
  public end(context?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;
    this.childLogger.info('Operation completed', {
      duration,
      ...context,
    });
  }

  /**
   * Logs the operation as slow if it exceeds threshold
   */
  public endWithThreshold(thresholdMs: number, context?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;
    if (duration > thresholdMs) {
      this.childLogger.warn('Slow operation detected', {
        duration,
        threshold: thresholdMs,
        ...context,
      });
    } else {
      this.childLogger.info('Operation completed', {
        duration,
        ...context,
      });
    }
  }
}

/**
 * Creates a performance logger
 */
export function createPerformanceLogger(operation: string): PerformanceLogger {
  return new PerformanceLogger(operation);
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Logs an error with additional context
 */
export function logException(error: Error, context?: Record<string, unknown>): void {
  logger.error('Exception occurred', error, {
    ...context,
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
  });
}

/**
 * Logs an unhandled error
 */
export function logUnhandledError(error: Error): void {
  logger.error('Unhandled error', error, {
    unhandled: true,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Logs an unhandled promise rejection
 */
export function logUnhandledRejection(reason: unknown): void {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('Unhandled promise rejection', error, {
    unhandled: true,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

/**
 * Sets up global error handlers
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logUnhandledError(error);
    // Give time for logging before exiting
    setTimeout(() => process.exit(1), 100);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logUnhandledRejection(reason);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default logger;
