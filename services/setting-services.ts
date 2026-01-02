import { apiClient } from "@/lib/api-client";

const ENDPOINTS = {
  BROADCAST : "account/create-broadcast",
  ALERTS: "account/dashboard-alerts",
  TOGGLE_NOTIFICATIONS: "account/toggle-notifications",
  MARK_ALL_READ : "account/markRead"
};

export interface BroadcastPayload {
  title: string;
  message: string;
  type: "info" | "warning" | "critical";
  expirydate: string; 
}

export interface BroadcastItem {
    id: number;
    title: string;
    message: string;
    type: string; 
    isRead: boolean;
    createdDate: string;
    expiryDate: string;
}

export interface DashboardAlertsDTO {
    broadcasts: BroadcastItem[];
    personalNotifications: any[];
    unreadCount: number;
}

const getDataObject = <T>(data: any): T => {
    return data?.content || data?.data || data || {};
};

export const settingService = {
  getSetting: async <T>(key: string): Promise<T | null> => {
    if (typeof window !== "undefined") {
        const saved = localStorage.getItem(`app_pref_${key}`);
        if (saved !== null) {
            try {
                return JSON.parse(saved) as T;
            } catch {
                return saved as unknown as T;
            }
        }
    }
    return null;
  },

  toggleGlobalNotifications: async (value: boolean) => {
    const response = await apiClient.post(ENDPOINTS.TOGGLE_NOTIFICATIONS, value);
    
    if (!response.success) {
        throw new Error(response.error || "Failed to update notification settings");
    }
    return response.data;
  },

  createBroadcast: async (payload: BroadcastPayload) => {
    const response = await apiClient.post(ENDPOINTS.BROADCAST, payload);
    if (!response.success) {
        throw new Error(response.error || "Failed to post broadcast");
    }
    return response.data;
  },

  getDashboardAlerts: async (): Promise<DashboardAlertsDTO> => {
      const response = await apiClient.get<any>(ENDPOINTS.ALERTS); 
      
      if (!response.success) {
          return { broadcasts: [], personalNotifications: [], unreadCount: 0 };
      }
      return getDataObject<DashboardAlertsDTO>(response.data);
  },

  markAllNotificationsAsRead: async () => {
    const response = await apiClient.post(ENDPOINTS.MARK_ALL_READ, {});
    
    if (!response.success) {
        throw new Error(response.error || "Failed to mark notifications as read");
    }
    return response.data;
  }

};