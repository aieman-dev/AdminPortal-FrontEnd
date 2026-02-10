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
  public readonly data?: any;

  constructor(message: string, type: ErrorType, statusCode?: number, originalError?: any, data?: any) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.data = data;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }

  // Helper to determine type from Status Code
  static fromStatusCode(status: number, message?: string, data?: any): AppError {
    if (status === 401 || status === 403) {
      return new AppError(message || "Unauthorized access", ErrorType.AUTHENTICATION, status, null, data);
    }
    if (status === 404) {
      return new AppError(message || "Resource not found", ErrorType.NOT_FOUND, status, null, data);
    }
    if (status >= 400 && status < 500) {
      return new AppError(message || "Invalid request", ErrorType.VALIDATION, status, null, data);
    }
    if (status >= 500) {
      return new AppError(message || "Server error", ErrorType.SERVER, status, null, data);
    }
    return new AppError(message || "Unknown error", ErrorType.UNKNOWN, status, null, data);
  }
}

export const STATUS_MESSAGES: Record<number, string> = {
    400: "The request data is invalid. Please check your input.",
    401: "Your session has expired. Please log in again.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource could not be found.",
    408: "The server took too long to respond. Please try again.",
    429: "Too many requests. Please wait a moment before trying again.",
    500: "Internal server error. Our team has been notified.",
    502: "System is currently unavailable. Please try again later.",
    503: "Service is under maintenance. Please check back soon.",
    504: "Gateway timeout. The server is not responding."
};