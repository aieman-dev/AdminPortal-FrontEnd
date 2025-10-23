export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

// Mock user database - Replace with real backend API
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@company.com",
    password: "admin123",
    name: "Admin User",
    role: "Administrator",
  },
  {
    id: "2",
    email: "user@company.com",
    password: "user123",
    name: "Regular User",
    role: "User",
  },
]

// Storage keys
const AUTH_TOKEN_KEY = "auth_token"
const USER_DATA_KEY = "user_data"

/**
 * Mock login function - Replace with real API call
 * Example backend integration:
 * const response = await fetch('/api/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email, password })
 * });
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const user = MOCK_USERS.find((u) => u.email === email && u.password === password)

  if (!user) {
    return {
      success: false,
      error: "Invalid email or password",
    }
  }

  // Generate mock token (in production, this comes from backend)
  const token = btoa(`${user.id}:${Date.now()}`)

  // Store auth data
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(
      USER_DATA_KEY,
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }),
    )
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

/**
 * Logout function - Clear local storage and optionally call backend
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_DATA_KEY)
    // In production, also call: await fetch('/api/auth/logout', { method: 'POST' });
  }
}

/**
 * Get current authenticated user from storage
 */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const userData = localStorage.getItem(USER_DATA_KEY)

  if (!token || !userData) return null

  try {
    return JSON.parse(userData)
  } catch {
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * Get auth token for API requests
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}
