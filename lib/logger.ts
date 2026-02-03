/**
 * Logging utility for development and production
 */

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }
  }

  info(message: string, data?: any): void {
    const entry = this.formatMessage("info", message, data)
    if (this.isDevelopment) {
      console.log(`[INFO] ${entry.timestamp} - ${message}`, data || "")
    }
    // In production, send to logging service
  }

  warn(message: string, data?: any): void {
    const entry = this.formatMessage("warn", message, data)
    console.warn(`[WARN] ${entry.timestamp} - ${message}`, data || "")
    // In production, send to logging service
  }

  error(message: string, error?: any): void {
    const entry = this.formatMessage("error", message, error)
    console.error(`[ERROR] ${entry.timestamp} - ${message}`, error || "")
    // In production, send to error tracking service (e.g., Sentry)
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      const entry = this.formatMessage("debug", message, data)
      console.debug(`[DEBUG] ${entry.timestamp} - ${message}`, data || "")
    }
  }
  

}

export const logger = new Logger()
