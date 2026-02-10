"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Search, PlusCircle, ArrowRight, Briefcase, History,
    RefreshCw, ShoppingBag, XCircle, Calendar, Key, Users,
    LogOut, Moon, Sun, Ticket, Monitor, Car, FileText, UserPlus, ClipboardList, Ban
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth" 
import { 
    canViewThemeParkSupport, 
    canViewCarParkSupport,
    canCreatePackage,
    canViewHRSupport
} from "@/lib/auth"
import { ROLES } from "@/lib/constants";
import { useTheme } from "next-themes"

type CommandItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    path?: string;
    action?: () => void;
    priority?: number;
    keywords?: string[]; 
}

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()
  const { logout, user } = useAuth()
  const { setTheme } = useTheme()

  // Permissions mapping
  const dept = user?.department;
  const permissions = {
    ITSupport: canViewThemeParkSupport(dept),
    packages: canCreatePackage(dept),
    carPark: canViewCarParkSupport(dept),
    HR: canViewHRSupport(dept),
    MIS: dept === ROLES.MIS_SUPER
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === "Escape") {
        e.preventDefault() 
        setOpen(false)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (item: CommandItem) => {
    setOpen(false)
    setQuery("") // Reset query on selection for next time
    
    if (item.action) {
        item.action();
    } else if (item.path) {
        router.push(item.path)
    }
  }

  // --- STATIC SYSTEM ACTIONS ---
  const systemActions: CommandItem[] = [
      { id: "logout", label: "Log Out", icon: LogOut, action: () => logout(), keywords: ["sign out", "exit"] },
      { id: "theme-dark", label: "Switch to Dark Mode", icon: Moon, action: () => setTheme("dark"), keywords: ["dark theme", "night mode"] },
      { id: "theme-light", label: "Switch to Light Mode", icon: Sun, action: () => setTheme("light"), keywords: ["light theme", "day mode"] }
  ];

  const SEARCH_PATTERNS = [
    {
        id: "cp-qrid",
        regex: /^\d+$/, 
        label: (q: string) => `View Season Detail: QrID ${q}`,
        path: (q: string) => `/portal/car-park/season-parking/${q}`,
        icon: Ticket,
        priority: 1
    },
    {
        id: "cp-plate",
        regex: /^[A-Z0-9\s]{1,8}$/i, 
        label: (q: string) => `Search Car Plate: "${q.toUpperCase()}"`,
        path: (q: string) => `/portal/car-park/season-parking?search=${encodeURIComponent(q)}`,
        icon: Car,
        priority: 2
    },
    {
        id : "report-direct",
        regex: /^report[_\-\s]?([a-z0-9_]+)$/i,
        label: (q: string) => { const match = q.match(/^report[_\-\s]?([a-z0-9_]+)$/i); return `Open Report: "${match?.[1] || q}"`; },
        path: (q: string) => {const match = q.match(/^report[_\-\s]?([a-z0-9_]+)$/i);return `/portal/car-park/reports/viewer?report=${encodeURIComponent(match?.[1] || q)}`;},
        icon: FileText,
        priority: 1
    },
    {
        id: "op-invoice-pattern",
        regex: /^[a-z]{2,10}-+\d*$/i,
        label: (q: string) => `Analyze Invoice Pattern: "${q}"`,
        path: (q: string) => `/portal/themepark-support/transaction-master?tab=void-transaction&search=${encodeURIComponent(q)}`,
        icon: XCircle,
        priority: 2
    }
  ];

  const getDynamicActions = (): CommandItem[] => {
    if (!query) return [];
    
    const rawQ = query.trim();
    const lowerQ = rawQ.toLowerCase();
    const actions: CommandItem[] = [];

    const flags = {
        // System Keywords (Navigation)
        isRegister: lowerQ.startsWith("new") || lowerQ.startsWith("reg"),
        isPackage:  lowerQ.startsWith("pack") || lowerQ.startsWith("crea"),
        isReport:   lowerQ.startsWith("rep"),

        // Data Types (Search)
        isName:      /^[a-zA-Z\s]{3,}$/.test(rawQ),
        isPhone:   /^[+0][0-9\s-]{8,}$/.test(rawQ),
        isEmail:     lowerQ.includes("@"),
        isNumericID: /^\d+$/.test(rawQ),
        isTicket:    /^t\d+$/i.test(rawQ),
        isInvoice:   /^[a-z]{2,10}-+\d*$/i.test(rawQ),
    };

    const isStrictSystemAction = flags.isRegister || flags.isPackage || flags.isReport;

    // --- CAR PARK MODULE (CP & MIS) ---
    if (permissions.carPark) {
        if (flags.isRegister || flags.isReport) {
            actions.push({ id: "nav-new-reg", label: "New Registration", icon: UserPlus, path: "/portal/car-park/registration", priority: 1 });
            actions.push({ id: "nav-reports", label: "Open Reports Center", icon: FileText, path: "/portal/car-park/reports", priority: 1 });
        }

        if (!isStrictSystemAction) {
            SEARCH_PATTERNS.forEach(pattern => {
                if (pattern.regex.test(rawQ)) {
                    actions.push({ id: `pattern-${pattern.id}-${rawQ}`, label: pattern.label(rawQ), icon: pattern.icon, path: pattern.path(rawQ), priority: pattern.priority });
                }
            });

            if (flags.isEmail || flags.isName) {
                actions.push({ id: `cp-pkg-${rawQ}`, label: `Season Pass Search: ${rawQ}`, icon: Car, path: `/portal/car-park/season-parking?search=${encodeURIComponent(rawQ)}`, priority: 3 });
                actions.push({ id: `cp-visitor-${rawQ}`, label: `Visitor Search: ${rawQ}`, icon: Users, path: `/portal/car-park/superapp-visitor?search=${encodeURIComponent(rawQ)}`, priority: 3 });
                actions.push({ id: `email-app-${rawQ}`, label: `Car Park Application: ${rawQ}`, icon: ClipboardList, path: `/portal/car-park/application?search=${encodeURIComponent(rawQ)}`, priority: 3 });
                actions.push({ id: `email-blacklist-${rawQ}`, label: `Access Control search: ${rawQ}`, icon: Ban, path: `/portal/car-park/access-control?search=${encodeURIComponent(rawQ)}`, priority: 3 });
            }
            if (flags.isNumericID) {
                    if (permissions.carPark) {
                        actions.push({ id: `cp-acc-${rawQ}`, label: `Visitor AccID Detail: ${rawQ}`, icon: Users, path: `/portal/car-park/superapp-visitor/${rawQ}`, priority: 1 });
                    }
                  }
        }
    }

    // --- PACKAGE MANAGEMENT (TP & MIS) ---
    if (permissions.packages) {
        if (flags.isPackage) {
            actions.push({ id: "nav-create-pkg", label: "Create New Package", icon: PlusCircle, path: "/portal/packages/form", priority: 1 });
        }
        if (flags.isName && !isStrictSystemAction) {
            actions.push({ id: "nav-list-pkg", label: `Search Packages: "${rawQ}"`, icon: Ticket, path: `/portal/packages?search=${encodeURIComponent(rawQ)}`, priority: 3 });
        }
    }

    // --- THEME PARK SUPPORT (ITTP & MIS) ---
    if (permissions.ITSupport && !isStrictSystemAction) {
        if (flags.isInvoice || flags.isTicket) {
            actions.push({ id: `void-${rawQ}`, label: `Void Transaction: "${rawQ}"`, icon: XCircle, path: `/portal/themepark-support/transaction-master?tab=void-transaction&search=${encodeURIComponent(rawQ)}`, priority: 2 });
            actions.push({ id: `deact-${rawQ}`, label: `Deactivate Ticket: "${rawQ}"`, icon: Ticket, path: `/portal/themepark-support/ticket-master?tab=deactivate-ticket&search=${encodeURIComponent(rawQ)}`, priority: 2 });
            actions.push({ id: `extend-${rawQ}`, label: `Extend Expiry: "${rawQ}"`, icon: Calendar, path: `/portal/themepark-support/ticket-master?tab=extend-expiry&search=${encodeURIComponent(rawQ)}`, priority: 2 });
            actions.push({ id: `security-${rawQ}`, label: `Update Security No: "${rawQ}"`, icon: Key, path: `/portal/themepark-support/ticket-master?tab=update-qr-password&search=${encodeURIComponent(rawQ)}`, priority: 2 });
        }
        if(flags.isInvoice){
            actions.push({ id: `hist-inv-${rawQ}`, label: `View History Record: "${rawQ}"`, icon: History, path: `/portal/themepark-support/account-master?tab=search-history-record&search=${encodeURIComponent(rawQ)}`, priority: 3 });
        }
        if (flags.isNumericID) {
            actions.push({ id: `resync-${rawQ}`, label: `Resync Transaction ID: ${rawQ}`, icon: RefreshCw, path: `/portal/themepark-support/transaction-master?tab=resync-transaction&search=${encodeURIComponent(rawQ)}`, priority: 2 });
            actions.push({ id: `shopify-${rawQ}`, label: `Search Shopify Order: #${rawQ}`, icon: ShoppingBag, path: `/portal/themepark-support/transaction-master?tab=shopify-order&search=${encodeURIComponent(rawQ)}`, priority: 1 });
        }
        if (flags.isEmail || flags.isName) {
            actions.push({ id: `find-acct-${rawQ}`, label: `Find Customer Account: "${rawQ}"`, icon: Users, path: `/portal/themepark-support/account-master?tab=account-management&search=${encodeURIComponent(rawQ)}`, priority: 4 });
        }
        if (flags.isEmail || flags.isPhone) {
            actions.push({ id: `hist-ppl-${rawQ}`, label: `View History Records: "${rawQ}"`, icon: History, path: `/portal/themepark-support/account-master?tab=search-history-record&search=${encodeURIComponent(rawQ)}`, priority: 2 });
        }
        if (flags.isName) {
            actions.push({ id: `find-terminal-${rawQ}`, label: `Update Terminal: "${rawQ}"`, icon: Monitor, path: `/portal/themepark-support/attraction-master?tab=update-terminal&search=${encodeURIComponent(rawQ)}`, priority: 2 });
        }
    }

    // HR Management  
    if (permissions.HR) { 
        if (flags.isEmail || flags.isName) {
            actions.push({ id: `find-staff-${rawQ}`, label: `Find Staff Member: "${rawQ}"`, icon: Briefcase, path: "/portal/hr/staff-listing", priority: 5 });
        }
    }

    // --- STAFF MANAGEMENT (MIS ONLY) ---
    if (permissions.MIS && (flags.isEmail || flags.isName) && !isStrictSystemAction) {
        actions.push({ id: `find-staff-${rawQ}`, label: `Find Staff Member: "${rawQ}"`, icon: Briefcase, path: "/portal/staff-management", priority: 5 });
    }

    return actions.sort((a, b) => (a.priority || 99) - (b.priority || 99));
};


  const lowerQ = query.toLowerCase();
  const filteredSystemActions = systemActions.filter(item => 
      item.label.toLowerCase().includes(lowerQ) || 
      item.keywords?.some(k => k.includes(lowerQ))
  );

  const displayedItems = [...getDynamicActions(), ...filteredSystemActions];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-lg bg-popover rounded-xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="flex items-center border-b border-border px-4 h-14">
              <Search className="mr-3 h-5 w-5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type 'report', AccID, Plate or Email..."
                className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground text-foreground"
                autoFocus
              />
              <div className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded bg-muted">ESC</div>
            </div>

            <div className="py-2 max-h-[350px] overflow-y-auto">
                {displayedItems.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No results found.</p>
                ) : (
                    displayedItems.map((item) => (
                        <button
                            key={item.id} // Guaranteed Unique Keys
                            onClick={() => handleSelect(item)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors text-left group"
                        >
                            <div className="p-2 rounded-md bg-muted group-hover:bg-background border border-transparent group-hover:border-border transition-colors">
                                <item.icon size={16} />
                            </div>
                            <span className="flex-1 font-medium">{item.label}</span>
                            {item.action ? (
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground border px-1.5 rounded">Action</span>
                            ) : (
                                <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                    ))
                )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}