"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Search, Monitor, Ticket, Users, 
    PlusCircle, ScrollText, ArrowRight, Briefcase, History,
    RefreshCw, ShoppingBag, XCircle, Calendar, Key, Wallet
} from "lucide-react"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === "Escape") {
        e.preventDefault() // Optional, but good practice
        setOpen(false)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (path: string, searchParam?: string) => {
    setOpen(false)
    if (searchParam) {
        // Appends search param, handling existing '?' if present
        const separator = path.includes('?') ? '&' : '?';
        router.push(`${path}${separator}search=${encodeURIComponent(searchParam)}`)
    } else {
        router.push(path)
    }
  }

  // --- SMART DETECTION LOGIC ---
  const getDynamicActions = () => {
      if (!query) return []
      
      const rawQ = query.trim();
      const lowerQ = rawQ.toLowerCase();
      const actions = [];

      // --- 1. PATTERN RECOGNITION (REGEX) ---

      // Email: Contains '@'
      const isEmail = lowerQ.includes("@");

      // Phone: Starts with + or 0, mostly numbers, > 8 chars (e.g. 012-3456789)
      const isPhone = /^[+0][0-9\s-]{8,}$/.test(rawQ);

      // Numeric ID: Pure numbers (e.g. 29174, 23)
      const isNumericID = /^\d+$/.test(rawQ);

      // Ticket: Starts with 'T' followed by numbers (e.g. T004759)
      const isTicket = /^t\d+$/i.test(rawQ);

      // Invoice: 2-4 letters, dash, then numbers (e.g. SYS-2025..., CP-2023...)
      const isInvoice = /^[a-z]{2,10}-+\d*$/i.test(rawQ);

      // Name: Letters/Spaces only, no numbers, > 2 chars
      const isName = !isEmail && !isInvoice && !isTicket && /^[a-zA-Z\s]{3,}$/.test(rawQ);


      // --- 2. GENERATE ACTIONS BASED ON TYPE ---

      // SCENARIO A: OPERATIONS (Invoice or Ticket)
      if (isInvoice || isTicket) {
          actions.push({ 
              id: "void-trx", 
              label: `Void Transaction: "${rawQ}"`, 
              icon: XCircle, 
              path: "/portal/themepark-support/transaction-master?tab=void-transaction",
              priority: 1 
          });
          actions.push({ 
              id: "deactivate", 
              label: `Deactivate Ticket: "${rawQ}"`, 
              icon: Ticket, 
              path: "/portal/themepark-support/ticket-master?tab=deactivate-ticket",
              priority: 1 
          });
          actions.push({ 
              id: "extend", 
              label: `Extend Expiry: "${rawQ}"`, 
              icon: Calendar, 
              path: "/portal/themepark-support/ticket-master?tab=extend-expiry",
              priority: 2 
          });
          actions.push({ 
              id: "security", 
              label: `Update Security No: "${rawQ}"`, 
              icon: Key, 
              path: "/portal/themepark-support/ticket-master?tab=update-qr-password",
              priority: 2 
          });
          // History Search (Usually works with Invoice)
          if (isInvoice) {
              actions.push({
                  id: "hist-inv",
                  label: `View History Record: "${rawQ}"`,
                  icon: History,
                  path: "/portal/themepark-support/account-master?tab=search-history-record",
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
              path: "/portal/themepark-support/transaction-master?tab=resync-transaction",
              priority: 1 
          });
          actions.push({ 
              id: "shopify", 
              label: `Search Shopify Order: #${rawQ}`, 
              icon: ShoppingBag, 
              path: "/portal/themepark-support/transaction-master?tab=shopify-order",
              priority: 1 
          });
          // Edge case: Numeric Ticket ID? (Some systems use pure numbers for tickets)
          actions.push({ 
              id: "deactivate-num", 
              label: `Deactivate Ticket ID: ${rawQ}`, 
              icon: Ticket, 
              path: "/portal/themepark-support/ticket-master?tab=deactivate-ticket",
              priority: 3 
          });
      }

      // SCENARIO C: PEOPLE (Email, Phone, Name)
      if (isEmail || isPhone || isName) {
          actions.push({ 
              id: "find-acct", 
              label: `Find Customer Account: "${rawQ}"`, 
              icon: Users, 
              path: "/portal/themepark-support/account-master?tab=account-management",
              priority: 1
          });
          
          if (isEmail || isName) {
              actions.push({ 
                  id: "find-staff", 
                  label: `Find Staff Member: "${rawQ}"`, 
                  icon: Briefcase, 
                  path: "/portal/staff-management",
                  priority: 2
              });
          }

          if (isEmail || isPhone) {
               actions.push({
                  id: "hist-ppl",
                  label: `View History Records: "${rawQ}"`,
                  icon: History,
                  path: "/portal/themepark-support/account-master?tab=search-history-record",
                  priority: 2
              });
          }
          if (isName) {
              actions.push({ 
                  id: "find-terminal", 
                  label: `Update Terminal: "${rawQ}"`, 
                  icon: Monitor, 
                  // This path matches your UpdateTerminalTab URL logic
                  path: "/portal/themepark-support/attraction-master?tab=update-terminal",
                  priority: 2
              });
          }
      }

      return actions.sort((a, b) => a.priority - b.priority);
  }

  // Define static actions (Dashboard links)
  const staticActions = [
      { id: "home", label: "Dashboard", icon: Monitor, path: "/portal" },
      { id: "new-pkg", label: "Create Package", icon: PlusCircle, path: "/portal/packages/form" },
  ]

  const filteredStatic = staticActions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  )
  
  const displayedActions = [...getDynamicActions(), ...filteredStatic]

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
                placeholder="Enter search"
                className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground text-foreground"
                autoFocus
              />
              <div className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded bg-muted">ESC</div>
            </div>

            <div className="py-2 max-h-[350px] overflow-y-auto">
                {displayedActions.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No results found.</p>
                ) : (
                    displayedActions.map((action) => (
                        <button
                            key={action.id}
                            // @ts-ignore
                            onClick={() => runCommand(action.path, query)} // Pass 'query' as search param
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors text-left group"
                        >
                            <div className="p-2 rounded-md bg-muted group-hover:bg-background border border-transparent group-hover:border-border transition-colors">
                                {/* @ts-ignore */}
                                <action.icon size={16} />
                            </div>
                            <span className="flex-1">
                                {action.label}
                            </span>
                            <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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