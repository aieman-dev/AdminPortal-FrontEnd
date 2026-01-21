export interface ReportDefinition {
    id: number;
    code: string;
    name: string;
    description: string;
    path: string; // The path on the Report Server
}

export const CAR_PARK_REPORTS: ReportDefinition[] = [
    { id: 1, code: "CP_RptQRCodeTrackingByEmail", name: "QR Code Tracking By Email", description: "Provide the list of entry history by user email account and entry date range", path: "/CarPark/CP_RptQRCodeTrackingByEmail" },
    { id: 2, code: "CP_RptQRCodeTrackingByCarPlate", name: "QR Code Tracking By Car Plate", description: "Provide the list of entry history by car plate and entry date range", path: "/CarPark/CP_RptQRCodeTrackingByCarPlate" },
    { id: 3, code: "CP_RptQRCodeParkingList", name: "QR Code Parking List", description: "Provide the list of all user", path: "/CarPark/CP_RptQRCodeParkingList" },
    { id: 4, code: "CP_RptVisaTransaction", name: "Visa Transaction", description: "Provide Visa Paywave history", path: "/CarPark/CP_RptVisaTransaction" },
    { id: 5, code: "CP_RptQRCodeRenewal", name: "QR Code Renewal", description: "Provide the list of season pass renewal by user email account", path: "/CarPark/CP_RptQRCodeRenewal" },
    { id: 6, code: "CP_RptAudit", name: "Audit Report", description: "Provide the audit table by user email account", path: "/CarPark/CP_RptAudit" },
    { id: 7, code: "CP_RptQRCodeStaffListing", name: "QR Code Staff Listing", description: "Provide the list of staff using QR Season Pass", path: "/CarPark/CP_RptQRCodeStaffListing" },
    { id: 8, code: "i-City_PayWaveDailyTransactionByMonthYear", name: "PayWave Daily Transaction", description: "Provide the list of daily PayWave transaction for i-City by month and year", path: "/CarPark/i-City_PayWaveDailyTransactionByMonthYear" },
];