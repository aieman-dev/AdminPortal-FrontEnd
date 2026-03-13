// services/dashboard-service.ts
import { apiClient, ApiResponse, getContent, getDataObject } from "@/lib/api-client";
import { DashboardSummary, KioskStatus } from "@/type/dashboard";
import { packageService } from "./package-services"; 
import { logger } from "@/lib/logger";

const ENDPOINTS = {
    DASHBOARD_SUMMARY: "Package/dashboard-summary",
    KIOSK_STATUS: "support/kiosk/status",
    UNSYNCED_PACKAGES: "Package/unsynced", 
};


export const dashboardService = {
    /** Main Summary Data */
    getSummary: async (filter: string = "ThisWeek"): Promise<DashboardSummary | null> => {
        const response = await apiClient.get<any>(`${ENDPOINTS.DASHBOARD_SUMMARY}?filter=${filter}`);
        if (!response.success) throw new Error(response.error || "Failed to retrieve dashboard summary.");
        return getDataObject<DashboardSummary>(response.data);
    },

    /** Kiosk Status */
    getKioskStatus: async (): Promise<KioskStatus[]> => {
        const response = await apiClient.get<any>(ENDPOINTS.KIOSK_STATUS);
        if (!response.success) throw new Error(response.error || "Failed to retrieve kiosk status.");
        return getContent<KioskStatus>(response.data);
    },

    /** Unsynced Count (IT Admin) */
    getUnsyncedCount: async (): Promise<number> => {
        const response = await apiClient.post<any>(ENDPOINTS.UNSYNCED_PACKAGES, {});
        if (!response.success || !response.data) throw new Error(response.error || "Failed to fetch unsynced packages.");
        return getContent(response.data).length
    },

    /** * Unified wrapper to get recent packages.
     * Dashboard uses this so it doesn't need to import packageService directly.
     */
    getRecentPendingPackages: async () => {
        try {
            const { packages } = await packageService.getPackages("Pending", undefined, undefined, 1, "", "All");
            return packages.slice(0, 8); // Limit to 8 for dashboard
        } catch (error) {
            logger.error("Failed to fetch recent packages", error);
            throw error;
        }
    }
};