"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Search, X, Monitor, Ticket, Users, 
    PlusCircle, ScrollText, ArrowRight, Server
} from "lucide-react"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()

  // 1. Listen for Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // 2. Navigation Logic
  const runCommand = (path: string, searchParam?: string) => {
    setOpen(false)
    if (searchParam) {
        // Redirects with ?search=VALUE so the next page can read it
        router.push(`${path}?search=${encodeURIComponent(searchParam)}`)
    } else {
        router.push(path)
    }
  }

  // 3. Define your Actions
  const staticActions = [
      { id: "home", label: "Dashboard", icon: Monitor, path: "/portal" },
      { id: "new-pkg", label: "Create Package", icon: PlusCircle, path: "/portal/packages/form" },
      { id: "tickets", label: "Ticket Master", icon: Ticket, path: "/portal/themepark-support/ticket-master" },
      { id: "void", label: "Void Transaction", icon: X, path: "/portal/themepark-support/transaction-master" },
      { id: "terminals", label: "Terminal Status", icon: Server, path: "/portal/themepark-support/attraction-master" },
  ]

  // 4. Dynamic "Search" Actions (Only show if user types)
  const getDynamicActions = () => {
      if (!query) return []
      return [
          { 
              id: "search-trx", 
              label: `Search Transactions for "${query}"`, 
              icon: ScrollText, 
              path: "/portal/themepark-support/transaction-master",
              param: query 
          },
          { 
              id: "search-acct", 
              label: `Find Account/Staff "${query}"`, 
              icon: Users, 
              path: "/portal/themepark-support/account-master",
              param: query 
          }
      ]
  }

  const filteredStatic = staticActions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  )
  
  const displayedActions = [...getDynamicActions(), ...filteredStatic]

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]">
            
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
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
                {displayedActions.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No results found.</p>
                ) : (
                    displayedActions.map((action) => (
                        <button
                            key={action.id}
                            // @ts-ignore
                            onClick={() => runCommand(action.path, action.param)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors text-left group"
                        >
                            <div className="p-2 rounded-md bg-muted group-hover:bg-background border border-transparent group-hover:border-border transition-colors">
                                <action.icon size={16} />
                            </div>
                            <span className="flex-1">{action.label}</span>
                            {/* Arrow icon only shows on hover */}
                            <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))
                )}
            </div>
            
            <div className="bg-muted/30 p-2 border-t border-border flex items-center justify-between px-4">
                <span className="text-xs text-muted-foreground">
                    <span className="font-mono">Ctrl</span> + <span className="font-mono">K</span>
                </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}