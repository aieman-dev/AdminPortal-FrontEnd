// config/system-tips.ts

export interface SystemTip {
    id: number;
    title: string;
    content: string;
    category: "General" | "Car Park" | "Packages" | "Finance";
}

export const SYSTEM_TIPS = [
    {
        id: 1,
        title: "Quick Navigation",
        content: "Press 'Ctrl + K' (or Cmd + K) anywhere to open the Command Menu. You can jump to pages or search for specific records instantly.",
        category: "General"
    },
    {
        id: 2,
        title: "Kiosk Monitoring",
        content: "On the Dashboard, click the 'Online/Offline' status card to open the detailed Kiosk Status Monitor.",
        category: "General"
    },
    {
        id: 3,
        title: "Draft Packages",
        content: "Packages saved as 'Draft' are not visible to Finance. You must click 'Submit for Approval' when you are ready.",
        category: "Packages"
    },
    {
        id: 4,
        title: "Approval Lock",
        content: "Once a package is approved by Finance, it becomes 'Live' and can no longer be edited. Ensure all details are final before confirming approval.",
        category: "Packages"
    },
    {
        id: 5,
        title: "Default Image",
        content: "Any package that dont have image will use a default image.",
        category: "Packages"
    },
    {
        id: 6,
        title: "Validation Warnings",
        content: "The system will warn you if you attempt to approve a package expiring in less than 7 days to prevent sales of expired items.",
        category: "Finance"
    },
    {
        id: 7,
        title: "Car Park Registration",
        content: "Use the 'Verify' button in the registration form to auto-fill user details from their Email or QR code.",
        category: "Car Park"
    },
    {
        id: 8,
        title: "Force Exit Logic",
        content: "If a vehicle is showing as 'Parked' but has physically left, use 'Force Exit' in the History tab to reset their parking session.",
        category: "Car Park"
    },
    {
        id: 9,
        title: "Visitor to Season Redirect",
        content: "Viewing a Visitor account? If they already have an active season pass, a redirect button will appear to help you manage them instantly.",
        category: "Car Park"
    },
    {
        id: 10,
        title: "Dark Mode",
        content: "Prefer a darker interface? Toggle the theme icon in the top right corner of the header.",
        category: "General"
    },
    {
        id: 11,
        title: "Diagnostics Tool",
        content: "Encountering a slow connection? Use the 'System Health' widget on the dashboard to run a real-time integrity check on core API services.",
        category: "General"
    }
];