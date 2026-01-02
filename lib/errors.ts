// lib/errors.ts

export enum ErrorType {
  NETWORK = "NETWORK_ERROR",
  AUTHENTICATION = "AUTH_ERROR", // 401, 403
  VALIDATION = "VALIDATION_ERROR", // 400, 422
  SERVER = "SERVER_ERROR", // 500+
  UNKNOWN = "UNKNOWN_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR" // 404
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode?: number;
  public readonly originalError?: any;

  constructor(message: string, type: ErrorType, statusCode?: number, originalError?: any) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }

  // Helper to determine type from Status Code
  static fromStatusCode(status: number, message?: string): AppError {
    if (status === 401 || status === 403) {
      return new AppError(message || "Unauthorized access", ErrorType.AUTHENTICATION, status);
    }
    if (status === 404) {
      return new AppError(message || "Resource not found", ErrorType.NOT_FOUND, status);
    }
    if (status >= 400 && status < 500) {
      return new AppError(message || "Invalid request", ErrorType.VALIDATION, status);
    }
    if (status >= 500) {
      return new AppError(message || "Server error", ErrorType.SERVER, status);
    }
    return new AppError(message || "Unknown error", ErrorType.UNKNOWN, status);
  }
}