// config/system-tips.ts

export interface SystemTip {
    id: number;
    title: string;
    content: string;
    category: string;
}

export interface ModuleGuide {
    triggerLabel: string;
    tips: SystemTip[];
}

export const MODULE_GUIDES: Record<string, ModuleGuide> = {
    "/portal/packages": {
        triggerLabel: "Package Guide",
        tips: [
            { id: 1, title: "Draft Packages", content: "Packages saved as 'Draft' are not visible to Finance. You must click 'Submit for Approval' when you are ready.", category: "Packages" },
            { id: 2, title: "Approval Lock", content: "Once a package is approved by Finance, it becomes 'Live' and can no longer be edited.", category: "Finance" },
            { id: 3, title: "Default Image", content: "Any package that doesn't have an image will automatically use a system default image.", category: "Packages" },
            { id: 4, title: "Validation Warnings", content: "The system will warn you if you attempt to approve a package expiring in less than 7 days to prevent sales of expired items.", category: "Finance" },
        ]
    },
    "/portal/car-park/season-parking": {
        triggerLabel: "Season Parking Guide",
        tips: [
            { id: 1, title: "Force Exit Logic", content: "If a vehicle is showing as 'Parked' but has physically left, use 'Force Exit' in the History tab to reset their parking session.", category: "Car Park" },
        ]
    },
    "/portal/car-park/superapp-visitor": {
        triggerLabel: "Visitor Guide",
        tips: [
            { id: 1, title: "Visitor to Season Redirect", content: "If the visitor already has an active season pass, a redirect button will appear to help you manage them instantly.", category: "Car Park" },
        ]
    },
    "portal/car-park/registration": {
        triggerLabel: "Registration Guide",
        tips: [
            { id: 1, title: "Car Park Registration", content: "Use the 'Verify' button in the registration form to auto-fill user details from their Email or QR code.", category: "Car Park" },
        ]
    },
    "default": {
        triggerLabel: "System Guide",
        tips: [
            { id: 1, title: "Quick Navigation", content: "Press 'Ctrl + K' (or Cmd + K) anywhere to open the Command Menu.", category: "General" },
            { id: 2, title: "Diagnostics Tool", content: "Encountering a slow connection? Use the 'System Health' widget on the dashboard to run a real-time integrity check.", category: "General" },
            { id: 3, title: "Dark Mode", content: "Prefer a darker interface? Toggle the theme icon in the top right corner of the header.", category: "General" },
            { id: 4, title: "Kiosk Monitoring", content: "On the Dashboard, click the 'Online/Offline' status card to open the detailed Kiosk Status Monitor.", category: "General" },
        ]
    }
};

