// config/navigation.ts
import { LayoutDashboard, Ticket, ServerCog, Users, Settings, Car } from "lucide-react"

export const SIDEBAR_NAVIGATION = [
  {
    name: "Dashboard",
    href: "/portal",
    icon: LayoutDashboard,
  },
  {
    name: "Package Management",
    href: "/portal/packages",
    icon: Ticket,
  },
  {
    name: "Themepark Support",
    icon: ServerCog,
    children: [
      {
        name: "Transaction Master",
        href: "/portal/themepark-support/transaction-master",
      },
      {
        name: "Attraction Master",
        href: "/portal/themepark-support/attraction-master",
      },
      {
        name: "Ticket Master",
        href: "/portal/themepark-support/ticket-master",
      },
      {
        name: "Account Master",
        href: "/portal/themepark-support/account-master",
      },
    ],
  },
  {
    name: "Car Park Management",
    icon: Car,
    children: [
      {
        name: "New Registration",
        href: "/portal/car-park/registration",
      },
      {
        name: "Season Parking",
        href: "/portal/car-park/season-parking",
      },
      {
        name: "SuperApp Visitor ",
        href: "/portal/car-park/superapp-visitor",
      },
      {
        name: "Reports",
        href: "/portal/car-park/reports",
      },
      {
        name: "App New SuperApp",
        href: "/portal/car-park/application",
      },
      {
        name: "Whitelist / Blacklist",
        href: "/portal/car-park/access-control",
      },
    ],
  },
  {
    name: "Staff Management",
    href: "/portal/staff-management",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/portal/setting",
    icon: Settings,
  },
  // FUTURE: Add "Software A" here easily!
]