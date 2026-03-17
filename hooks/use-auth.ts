"use client"

import { useState, useEffect } from "react"
import { type User, getCurrentUser, logout as authLogout } from "@/lib/auth"
import { useRouter, usePathname } from "next/navigation"
import { staffService} from "@/services/staff-services"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const verifySession = async () => {
      // 1. OPTIMISTIC CHECK (Instant UI)
      // We load from local storage first so the user sees the dashboard immediately.
      const storedUser = getCurrentUser();
      
      if (!storedUser) {
        setLoading(false);
        if (pathname?.startsWith("/portal")) {
             router.push("/login");
        }
        return;
      }
      
      // Set initial state from storage
      setUser(storedUser);

      // Unlock the UI immediately! Do not wait for the server ping.
      setLoading(false);

      // 2. REALITY CHECK (Background)
      // Ping the server to ensure the HttpOnly cookie is actually valid without a strict timeout.
      try {
        await staffService.getMe();
      } catch (error: any) {
        // Check if the error is specifically an Authentication failure
        const isAuthError = error?.status === 401 || error?.statusCode === 401;

        if (isAuthError) {
          // ONLY logout if the server specifically told us the token is invalid
          console.warn("Session expired. Logging out.");
          authLogout(); 
          setUser(null);
          window.location.href = "/login?error=session_expired";
        } else {
          // If the server is offline (502, 504, or Connection Refused), 
          // DO NOT log out. Just log a warning.
          // This allows the user to stay on the page until the backend comes back up.
          console.error("Backend unreachable. Keeping session alive for now.", error);
        }
      }
    };

    verifySession();
  }, [pathname, router]);

  const logout = () => {
    authLogout()
    setUser(null)
  }

  const refreshUser = () => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  }
}
