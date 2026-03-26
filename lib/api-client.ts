// lib/api-client.ts
import { AppError, ErrorType, STATUS_MESSAGES } from "@/lib/errors"
import { USER_DATA_KEY } from "@/lib/constants"
import { logger } from "@/lib/logger";

// --- NEW: Helper to auto-transform camelCase to PascalCase ---
const transformKeysToPascalCase = (obj: any): any => {
    if (obj === null || obj instanceof Date || obj instanceof File || obj instanceof Blob) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(v => transformKeysToPascalCase(v));
    } 
    
    if (typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            // Capitalize the first letter
            const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
            result[pascalKey] = transformKeysToPascalCase(obj[key]);
            return result;
        }, {} as Record<string, any>);
    }
    
    // Return primitive values (strings, numbers, booleans) as is
    return obj;
};

const resolveErrorMessage = (status: number, backendMessage?: string) => {
    // 1. If backend provides a specific readable message, use it.
    //    (Filter out generic tech messages like "One or more errors occurred.")
    if (backendMessage && !backendMessage.includes("One or more errors")) {
        return backendMessage;
    }
    // 2. Otherwise, return our friendly default
    return STATUS_MESSAGES[status] || `An unexpected error occurred (Code: ${status})`;
};

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

    if (options.body && typeof options.body === 'string' && !headers.has("Content-Type")) {
        try {
            JSON.parse(options.body as string);
            headers.set("Content-Type", "application/json");
        } catch (e) {
            // Not JSON, ignore
        }
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
          // 1. Extract raw backend message
          let rawMessage = data?.content?.error || data?.content?.message || data?.message || data?.error;
          
          if (!rawMessage && data?.errorMessage) {
             rawMessage = data.errorMessage.replace("{ message = ", "").replace(" }", "");
          }

          // 2. IMPROVEMENT: Use the resolver
          const finalMessage = resolveErrorMessage(response.status, rawMessage);

          // --- Special Handlers ---
          
          // 401: Force Logout
          if (response.status === 401) {
            if (typeof window !== "undefined") {
               localStorage.removeItem(USER_DATA_KEY);
               try { await fetch("/api/auth/logout", { method: "POST" }); } catch (e) {}
               window.location.href = "/login?error=session_expired";
            }
            return { success: false, error: finalMessage };
          }

          // 403: Security Lockout vs Simple Permission
          if (response.status === 403) {
             logger.warn("Access Denied [403]", { endpoint: cleanEndpoint });
             if (finalMessage.toLowerCase().includes("expired")) {
                 triggerGlobalError(finalMessage, data); 
             }
          }

          // 503: Maintenance Mode
          if (response.status === 503) {
             // Optional: triggerOfflineState();
          }
          
          // Throw processed error to be caught below
          throw AppError.fromStatusCode(response.status, finalMessage, data);
        }

        return { success: true, data: data };

      } catch (error) {
        // Network Errors (Server down / Offline)
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          logger.warn("Backend disconnected / Network failure", { error });
          return { success: false, error: "Unable to connect to the server. Please check your internet." };
        }
        
        // Pass through AppErrors
        if (error instanceof AppError) {
            return { success: false, error: error.message, data: error.data }; 
        }
        
        return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" };
      }
  }

  async get<T>(endpoint: string,options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", ...options })
  }
  
  async post<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    const finalBody = (!isFormData && body) ? transformKeysToPascalCase(body) : body;
    return this.request<T>(endpoint, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(finalBody),
      ...options,
    })
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    const finalBody = (!isFormData && body) ? transformKeysToPascalCase(body) : body;
    return this.request<T>(endpoint, {
      method: "PUT",
      body: isFormData ? body : JSON.stringify(finalBody),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new ApiClient()


export function getContent<T>(data: any): T[] {
    if (!data) return [];
    
    // 1. Handle double-nesting (Specific to some search endpoints)
    if (data.content?.content && Array.isArray(data.content.content)) {
        return data.content.content;
    }
    
    // 2. Handle standard wrappers
    if (data.content && Array.isArray(data.content)) return data.content;
    if (data.data && Array.isArray(data.data)) return data.data; 
    
    // 3. Handle raw array
    if (Array.isArray(data)) return data;
    return [];
}

/**
 * Safely extracts an object from the backend wrapper.
 */
export function getDataObject<T>(data: any): T {
    return data?.content || data?.data || data || ({} as T);
}

// Add a unified error getter
export function getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    return error?.message || error?.error || "An unexpected error occurred.";
}