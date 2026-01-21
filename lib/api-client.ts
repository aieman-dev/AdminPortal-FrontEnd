// lib/api-client.ts
import { getAuthToken } from "./auth"
import { AppError, ErrorType } from "@/lib/errors"
import { USER_DATA_KEY } from "@/lib/constants"

// --- NEW: Helper to trigger global lock screen ---
export const triggerGlobalError = (message: string, debugInfo?: any) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sys:global-error", { 
        detail: { message, debugInfo } 
    }));
  }
};

export const triggerOfflineState = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sys:offline"));
  }
};

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api/proxy/") {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

    try {
      const response = await fetch(`${this.baseUrl}${cleanEndpoint}`, { ...options, headers });
        
        let data;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          let errorMessage = data?.content?.message || data?.message || data?.error;
          
          if (!errorMessage && data?.errorMessage) {
             errorMessage = data.errorMessage.replace("{ message = ", "").replace(" }", "");
          }
          
          const finalMessage = errorMessage || response.statusText;

          // --- A. Handle 401 (Session Expired) -> Force Logout ---
          if (response.status === 401) {
            if (typeof window !== "undefined") {
               localStorage.removeItem(USER_DATA_KEY);
               try {
                   await fetch("/api/auth/logout", { method: "POST" });
               } catch (e) {
                   console.error("Logout cleanup failed", e);
               }
               window.location.href = "/login?error=session_expired";
            }
            return { success: false, error: "Session expired. Redirecting..." };
          }

          // --- B. Handle 403 (Forbidden / Expired) -> Trigger Global Screen ---
          if (response.status === 403) {
             console.warn(`Access Denied [403] for ${cleanEndpoint}`);
             
             // Check if it's specifically an expiry issue
             if (finalMessage.toLowerCase().includes("expired")) {
                 triggerGlobalError(finalMessage, data); 
             } 
             throw AppError.fromStatusCode(403, finalMessage, data);
          }

          if (response.status === 503 || response.status === 502) {
             // triggerOfflineState(); 
          }
          
          throw AppError.fromStatusCode(response.status, finalMessage, data);
        }

        return { success: true, data: data };

      } catch (error) {
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          console.warn("Backend disconnected.");
          return { success: false, error: "Unable to connect to server." };
        }
        if (error instanceof AppError) {
            return { success: false, error: error.message }; 
        }
        return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" };
      }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", headers })
  }
  
  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
      headers, 
    })
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new ApiClient()