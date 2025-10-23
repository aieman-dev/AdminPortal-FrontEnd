/**
 * Application-wide constants
 */

export const APP_NAME = "Enterprise Portal"
export const APP_VERSION = "1.0.0"

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
export const API_TIMEOUT = 30000 // 30 seconds

// Authentication
export const AUTH_TOKEN_KEY = "auth_token"
export const USER_DATA_KEY = "user_data"
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf"]

// Rate Limiting
export const MAX_LOGIN_ATTEMPTS = 5
export const LOGIN_RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes

// Feature Flags (for future use)
export const FEATURES = {
  DARK_MODE: true,
  NOTIFICATIONS: true,
  ANALYTICS: true,
  MULTI_LANGUAGE: false,
} as const
