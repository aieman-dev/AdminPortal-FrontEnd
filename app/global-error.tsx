"use client"

import { useEffect, useState } from "react"
import { Inter } from "next/font/google"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  RotateCcw, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Terminal 
} from "lucide-react"
import "./globals.css"

// Configure font
const inter = Inter({ subsets: ["latin"] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // State for ID
  const [errorId, setErrorId] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  
  // State for Dev Mode Details
  const [showStack, setShowStack] = useState(false)

  // Is this running in Dev mode?
  const isDev = process.env.NODE_ENV === "development"

  useEffect(() => {
    // 1. Generate ID
    const newId = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setErrorId(newId)

    // 2. Log to Console
    console.error(`[${newId}] Global Error Caught:`, error)

    // 3. Safety Cleanup
    try {
      sessionStorage.clear()
    } catch (e) {
      // Ignore storage errors
    }
  }, [error])

  const copyToClipboard = () => {
    if (errorId) {
      navigator.clipboard.writeText(errorId)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-background text-foreground animate-in fade-in duration-500">
          
          {/* --- ICON SECTION --- */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-red-100 rounded-full scale-150 opacity-20 animate-pulse" />
            <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center relative z-10 border border-red-100">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </div>

          {/* --- TEXT CONTENT --- */}
          <div className="space-y-3 max-w-md w-full">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              System Critical Error
            </h1>
            <p className="text-muted-foreground">
              The application encountered an unexpected crash. <br />
              Please try reloading the page.
            </p>

            {/* --- ERROR ID BOX --- */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between group">
              <div className="text-xs text-muted-foreground font-mono text-left">
                <span className="block opacity-70 mb-1">Reference ID:</span>
                <span className="text-sm font-bold text-foreground select-all">
                  {errorId || "Generating..."}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={copyToClipboard}
              >
                {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </Button>
            </div>
            
            {/* --- ACTION BUTTONS --- */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full gap-2 h-11"
              >
                <RotateCcw size={16} />
                Reload
              </Button>
              <Button 
                onClick={() => reset()}
                className="w-full gap-2 h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Try Again
              </Button>
            </div>
          </div>

          {/* --- DEV ONLY: STACK TRACE --- */}
          {isDev && (
            <div className="mt-12 w-full max-w-2xl border border-red-200 rounded-lg overflow-hidden text-left bg-red-50/50">
              <button 
                onClick={() => setShowStack(!showStack)}
                className="w-full px-4 py-2 flex items-center justify-between text-xs font-mono text-red-700 hover:bg-red-100/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Terminal size={14} /> DEV MODE: Error Details
                </span>
                {showStack ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              {showStack && (
                <div className="p-4 bg-black/90 text-red-400 text-[11px] font-mono overflow-auto max-h-[300px] border-t border-red-200">
                  <p className="font-bold text-red-300 mb-2">{error.message}</p>
                  <pre className="whitespace-pre-wrap leading-relaxed opacity-80">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground/40 mt-12 uppercase tracking-widest">
            System Integrity Protection
          </div>

        </div>
      </body>
    </html>
  )
}