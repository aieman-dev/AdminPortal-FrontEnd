// lib/api-client.ts
import { getAuthToken } from "./auth"
import { AppError, ErrorType } from "@/lib/errors"

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

    // 1. Handle Content-Type (Skip for FormData so browser sets boundary)
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

    try {
      const response = await fetch(`${this.baseUrl}${cleanEndpoint}`, { ...options, headers });
        
        // 1. Network / Parsing Errors handled by catch block below
        let data;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        // 2. "How to know": Check Response.ok and Status Code
          if (!response.ok) {
          // A. Handle 403/401 (Session Expired) -> Stop the loop by redirecting
          if (response.status === 403 || response.status === 401) {
            if (typeof window !== "undefined") {
               // Optional: clear storage if you store user data there
               // localStorage.removeItem("user_data"); 
               window.location.href = "/login?error=session_expired";
            }
            return { success: false, error: "Session expired. Redirecting..." };
          }

          if (response.status === 503 || response.status === 502) {
             //triggerOfflineState();  //--- TRIGGER OFFLINE UI, comment for disable
          }

          let errorMessage = data?.content?.message || data?.message || data?.error;
          
          // Fallback: If errorMessage is that weird string format "{ message = ... }"
          if (!errorMessage && data?.errorMessage) {
             errorMessage = data.errorMessage.replace("{ message = ", "").replace(" }", "");
          }

          const finalMessage = errorMessage || response.statusText;
          
          // Throw an AppError so the Service knows EXACTLY what happened
          throw AppError.fromStatusCode(response.status, finalMessage);
        }

        return { success: true, data: data };

      } catch (error) {
        // 3. Handle Network Failures (Fetch failed to connect)
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          //triggerOfflineState(); //--- TRIGGER OFFLINE UI, comment for disable
          console.warn("Backend disconnected. Suppressing offline screen for UI development.");
          return { 
            success: false, 
            error: "Unable to connect to server. Please check your internet connection." 
          };
        }

        // 4. Pass through our custom AppError messages
        if (error instanceof AppError) {
            return { success: false, error: error.message }; 
            // OR, if you want services to handle specific codes:
            // throw error; 
        }

        return { 
          success: false, 
          error: error instanceof Error ? error.message : "An unexpected error occurred" 
        };
      }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
       method: "GET" ,
      headers: headers,
    })
  }

  //  UPDATED: Checks for FormData
  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
      headers: headers, 
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