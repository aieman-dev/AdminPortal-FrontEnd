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

      // 2. REALITY CHECK (Background)
      // We ping the server to ensure the HttpOnly cookie is actually valid.
      try {
        await staffService.getMe();
      } catch (error) {
        console.warn("Session invalid or expired. Logging out.");
        
        // 3. CORRECTION
        // If server rejects us (401), we must clear the client state immediately.
        authLogout(); 
        setUser(null);
        router.push("/login?error=session_expired");
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const logout = () => {
    authLogout()
    setUser(null)
    router.push("/login")
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
