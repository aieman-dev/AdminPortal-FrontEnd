"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Search, PlusCircle, ArrowRight, Briefcase, History,
    RefreshCw, ShoppingBag, XCircle, Calendar, Key, Users,
    LogOut, Moon, Sun, Ticket, Monitor
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth" 
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
  const { logout } = useAuth()
  const { setTheme } = useTheme()

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
    
    if (item.action) {
        item.action(); // Execute function (e.g. Logout)
    } else if (item.path) {
        // If the path contains a search query param placeholder, we might need logic here,
        // but typically your regex logic below constructs the full path with query params included.
        router.push(item.path)
    }
  }

  // --- SYSTEM ACTIONS ---
  const systemActions: CommandItem[] = [
      { 
          id: "logout", 
          label: "Log Out", 
          icon: LogOut, 
          action: () => logout(),
          keywords: ["sign out", "exit"]
      },
      { 
          id: "theme-dark", 
          label: "Switch to Dark Mode", 
          icon: Moon, 
          action: () => setTheme("dark"),
          keywords: ["dark theme", "night mode"]
      },
      { 
          id: "theme-light", 
          label: "Switch to Light Mode", 
          icon: Sun, 
          action: () => setTheme("light"),
          keywords: ["light theme", "day mode"]
      },
      {
          id: "create-pkg",
          label: "Create New Package", 
          icon: PlusCircle,
          path: "/portal/packages/form",
          keywords: ["new package", "add package"]
      }
  ];

  // --- SMART DETECTION LOGIC ---
  const getDynamicActions = (): CommandItem[] => {
      if (!query) return []
      
      const rawQ = query.trim();
      const lowerQ = rawQ.toLowerCase();
      const actions: CommandItem[] = [];

      // Regex Patterns
      const isEmail = lowerQ.includes("@");
      const isPhone = /^[+0][0-9\s-]{8,}$/.test(rawQ);
      const isNumericID = /^\d+$/.test(rawQ);
      const isTicket = /^t\d+$/i.test(rawQ);
      const isInvoice = /^[a-z]{2,10}-+\d*$/i.test(rawQ);
      const isName = !isEmail && !isInvoice && !isTicket && /^[a-zA-Z\s]{3,}$/.test(rawQ);

      // --- GENERATE ACTIONS BASED ON TYPE ---

      // SCENARIO A: OPERATIONS (Invoice or Ticket)
      if (isInvoice || isTicket) {
          actions.push({ 
              id: "void-trx", 
              label: `Void Transaction: "${rawQ}"`, 
              icon: XCircle, 
              path: `/portal/themepark-support/transaction-master?tab=void-transaction&search=${encodeURIComponent(rawQ)}`,
              priority: 1 
          });
          actions.push({ 
              id: "deactivate", 
              label: `Deactivate Ticket: "${rawQ}"`, 
              icon: Ticket, 
              path: `/portal/themepark-support/ticket-master?tab=deactivate-ticket&search=${encodeURIComponent(rawQ)}`,
              priority: 1 
          });
          actions.push({ 
              id: "extend", 
              label: `Extend Expiry: "${rawQ}"`, 
              icon: Calendar, 
              path: `/portal/themepark-support/ticket-master?tab=extend-expiry&search=${encodeURIComponent(rawQ)}`,
              priority: 2 
          });
          actions.push({ 
              id: "security", 
              label: `Update Security No: "${rawQ}"`, 
              icon: Key, 
              path: `/portal/themepark-support/ticket-master?tab=update-qr-password&search=${encodeURIComponent(rawQ)}`,
              priority: 2 
          });
          if (isInvoice) {
              actions.push({
                  id: "hist-inv",
                  label: `View History Record: "${rawQ}"`,
                  icon: History,
                  path: `/portal/themepark-support/account-master?tab=search-history-record&search=${encodeURIComponent(rawQ)}`,
                  priority: 3
              });
          }
      }

      // SCENARIO B: TECHNICAL IDS (Pure Numbers)
      if (isNumericID) {
          actions.push({ 
              id: "resync", 
              label: `Resync Transaction ID: ${rawQ}`, 
              icon: RefreshCw, 
              path: `/portal/themepark-support/transaction-master?tab=resync-transaction&search=${encodeURIComponent(rawQ)}`,
              priority: 1 
          });
          actions.push({ 
              id: "shopify", 
              label: `Search Shopify Order: #${rawQ}`, 
              icon: ShoppingBag, 
              path: `/portal/themepark-support/transaction-master?tab=shopify-order&search=${encodeURIComponent(rawQ)}`,
              priority: 1 
          });
      }

      // SCENARIO C: PEOPLE (Email, Phone, Name)
      if (isEmail || isPhone || isName) {
          actions.push({ 
              id: "find-acct", 
              label: `Find Customer Account: "${rawQ}"`, 
              icon: Users, 
              path: `/portal/themepark-support/account-master?tab=account-management&search=${encodeURIComponent(rawQ)}`,
              priority: 1
          });
          
          if (isEmail || isName) {
              actions.push({ 
                  id: "find-staff", 
                  label: `Find Staff Member: "${rawQ}"`, 
                  icon: Briefcase, 
                  path: `/portal/staff-management?search=${encodeURIComponent(rawQ)}`,
                  priority: 2
              });
          }

          if (isEmail || isPhone) {
               actions.push({
                  id: "hist-ppl",
                  label: `View History Records: "${rawQ}"`,
                  icon: History,
                  path: `/portal/themepark-support/account-master?tab=search-history-record&search=${encodeURIComponent(rawQ)}`,
                  priority: 2
              });
          }
          if (isName) {
              actions.push({ 
                  id: "find-terminal", 
                  label: `Update Terminal: "${rawQ}"`, 
                  icon: Monitor, 
                  path: `/portal/themepark-support/attraction-master?tab=update-terminal&search=${encodeURIComponent(rawQ)}`,
                  priority: 2
              });
          }
      }

      return actions.sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }

  // --- FILTERING LOGIC ---
  const lowerQ = query.toLowerCase();
  
  const filteredSystemActions = systemActions.filter(item => 
      item.label.toLowerCase().includes(lowerQ) || 
      item.keywords?.some(k => k.includes(lowerQ))
  );

  // Combine Results: Dynamic Regex Matches FIRST, then System Actions
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
                placeholder="Type a command or search..."
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
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors text-left group"
                        >
                            <div className="p-2 rounded-md bg-muted group-hover:bg-background border border-transparent group-hover:border-border transition-colors">
                                <item.icon size={16} />
                            </div>
                            <span className="flex-1 font-medium">
                                {item.label}
                            </span>
                            {/* Visual indicator for Actions vs Links */}
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