import DOMPurify from "isomorphic-dompurify"
/**
 * Security utilities for production-ready applications
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input).trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
 const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isStrongPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  const randomValues = new Uint8Array(length)

  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(randomValues)
  } else {
    // Fallback for server-side
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256)
    }
  }

  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length]
  }

  return token
}

/**
 * Rate limiting helper (client-side)
 * For production, implement server-side rate limiting
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  constructor(
    private maxAttempts = 5,
    private windowMs: number = 15 * 60 * 1000,
  ) {} // 15 minutes

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(identifier) || []

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < this.windowMs)

    if (recentAttempts.length >= this.maxAttempts) {
      return false
    }

    recentAttempts.push(now)
    this.attempts.set(identifier, recentAttempts)
    return true
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

/**
 * CSRF token management
 * For production, implement server-side CSRF protection
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken && token.length === 32
}
