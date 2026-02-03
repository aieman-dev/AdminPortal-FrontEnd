import { apiClient } from "@/lib/api-client";

/**
 * Standardizes currency string cleaning across the portal.
 */
export function parseAmount(val: string | number): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = val.toString().replace(/[^0-9.-]+/g, "");
    return parseFloat(clean) || 0;
}

/**
 * Reusable logic to check a user's wallet balance.
 */
export async function fetchUserBalance(email: string): Promise<number> {
    if (!email || email === "N/A") return 0;
    try {
        const response = await apiClient.post<any>("support/balance/check", { email });
        if (response.success && response.data) {
            const content = response.data.content || response.data;
            return content.balance || 0;
        }
        return 0;
    } catch (error) {
        console.error("Balance Check Error:", error);
        return 0;
    }
}