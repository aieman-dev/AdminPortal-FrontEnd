// type/dashboard.ts

export interface KioskStatus {
    kioskName: string;
    ip: string;
    status: string;
    isActive: boolean;
}

export interface DashboardChartData {
    date: string;
    dayName: string;
    totalAmount: number;
    isForecast?: boolean;
}

export interface BestSellingPackage {
    packageName: string;
    totalSold: number;
    totalRevenue?: number;
}

export interface DashboardSummary {
    ticketConsumption: number;
    pendingPackages: number;
    draftPackages: number;
    activeTerminals: number;
    totalTerminals: number;
    salesAmount: number;
    salesCount: number;
    consumeAmount: number;
    consumeCount: number;
    bestSellingPackages: BestSellingPackage[];
    weeklySalesChart: DashboardChartData[];
}