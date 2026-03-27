import { apiClient, getDataObject } from "@/lib/api-client";

const ENDPOINTS = {
  BROADCAST : "account/create-broadcast",
  ALERTS: "account/dashboard-alerts",
  TOGGLE_NOTIFICATIONS: "account/toggle-notifications",
  MARK_ALL_READ : "account/notifications/markRead"
};

export interface BroadcastPayload {
  title: string;
  message: string;
  type: "info" | "warning" | "critical";
  expirydate: string; 
}

export interface NotificationItem {
    id: number;
    targetUserId: string | null;
    title: string;
    message: string;
    type: string; 
    relatedId: string | null;
    isRead: boolean;
    createdDate: string;
    expiryDate: string | null;
}


export interface DashboardAlertsDTO {
    broadcasts: NotificationItem[];
    personalNotifications: NotificationItem[];
    unreadCount: number;
}

export interface ToggleNotificationResponse {
    message?: string;
}

export interface MarkReadResponse {
    success?: boolean;
    message?: string;
}

export interface BroadcastResponse {
    message?: string; 
}


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

  toggleGlobalNotifications: async (value: boolean) : Promise< ToggleNotificationResponse > => {
    const response = await apiClient.post<{ content: ToggleNotificationResponse }>(ENDPOINTS.TOGGLE_NOTIFICATIONS, value);
    
    if (!response.success) {
        throw new Error(response.error || "Failed to update notification settings");
    }
    return getDataObject<ToggleNotificationResponse>(response.data);
  },

  createBroadcast: async (payload: BroadcastPayload) : Promise<BroadcastResponse> => {
    const response = await apiClient.post<{ content: BroadcastResponse }>(ENDPOINTS.BROADCAST, payload);
    if (!response.success) {
        throw new Error(response.error || "Failed to post broadcast");
    }
    return getDataObject<BroadcastResponse>(response.data);
  },

  getDashboardAlerts: async (): Promise<DashboardAlertsDTO> => {
      const response = await apiClient.get<{ content: DashboardAlertsDTO }>(ENDPOINTS.ALERTS); 
      
      if (!response.success) {
          return { broadcasts: [], personalNotifications: [], unreadCount: 0 };
      }
      return getDataObject<DashboardAlertsDTO>(response.data);
  },

  markAllNotificationsAsRead: async () : Promise<MarkReadResponse> => {
    const response = await apiClient.post<{ content: MarkReadResponse }>(ENDPOINTS.MARK_ALL_READ, {});
    
    if (!response.success) {
        throw new Error(response.error || "Failed to mark notifications as read");
    }
    return getDataObject<MarkReadResponse>(response.data);
  }

};