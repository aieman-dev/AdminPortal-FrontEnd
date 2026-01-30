// services/dashboard-service.ts
import { apiClient } from "@/lib/api-client";
import { DashboardSummary, KioskStatus } from "@/type/dashboard";
import { packageService } from "./package-services"; // Import peer service

const ENDPOINTS = {
    DASHBOARD_SUMMARY: "Package/dashboard-summary",
    KIOSK_STATUS: "support/kiosk/status",
    UNSYNCED_PACKAGES: "Package/unsynced", 
};

const getData = <T>(data: any): T => data?.content || data?.data || data || {};
const getList = <T>(data: any): T[] => {
    if (!data) return [];
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
};

export const dashboardService = {
    /** Main Summary Data */
    getSummary: async (filter: string = "ThisWeek"): Promise<DashboardSummary | null> => {
        const response = await apiClient.get<any>(`${ENDPOINTS.DASHBOARD_SUMMARY}?filter=${filter}`);
        if (!response.success) throw new Error(response.error);
        return getData<DashboardSummary>(response.data);
    },

    /** Kiosk Status */
    getKioskStatus: async (): Promise<KioskStatus[]> => {
        const response = await apiClient.get<any>(ENDPOINTS.KIOSK_STATUS);
        return response.success ? getList<KioskStatus>(response.data) : [];
    },

    /** Unsynced Count (IT Admin) */
    getUnsyncedCount: async (): Promise<number> => {
        try {
            const response = await apiClient.post<any>(ENDPOINTS.UNSYNCED_PACKAGES, {});
            return response.success && response.data ? getList(response.data).length : 0;
        } catch { return 0; }
    },

    /** * Unified wrapper to get recent packages.
     * Dashboard uses this so it doesn't need to import packageService directly.
     */
    getRecentPendingPackages: async () => {
        try {
            const { packages } = await packageService.getPackages("Pending", undefined, undefined, 1, "", "All");
            return packages.slice(0, 8); // Limit to 8 for dashboard
        } catch (error) {
            console.error("Failed to fetch recent packages", error);
            return [];
        }
    }
};