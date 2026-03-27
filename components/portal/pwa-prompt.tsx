"use client"

import { useState, useEffect } from "react"
import { X, Share, PlusSquare } from "lucide-react"
import { logger } from "@/lib/logger"

export function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // --- SERVICE WORKER (For Offline Support) ---
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          () => {
            logger.info('Service Worker registered successfully.');
          },
          (err) => {
            logger.error('Service Worker registration failed:', { error: err });
          }
        );
      });
    }

    // --- PWA PROMPT LOGIC ---
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      ('standalone' in navigator && (navigator as any).standalone);
    
    const handleForceShow = () => {
      if (isStandalone) return; 
      localStorage.removeItem('pwa-prompt-dismissed');
      setShowPrompt(true);
    };

    window.addEventListener('show-pwa-prompt', handleForceShow);

    // --- Initial Auto-show logic ---
    if (!isStandalone) {
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const hasDismissed = localStorage.getItem('pwa-prompt-dismissed')
      
      if (isIOS && !hasDismissed) {
         setShowPrompt(true)
      }
    }

    //  Cleanup listener (This must ALWAYS be reached at the end of the hook)
    return () => window.removeEventListener('show-pwa-prompt', handleForceShow);
  }, [])

  const dismissPrompt = () => {
    setShowPrompt(false)
    // Save to local storage so we don't annoy them on every visit
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-safe sm:hidden animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-card border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-2xl p-5 pb-6 relative ring-1 ring-black/5 dark:ring-white/10">
        
        <button 
          onClick={dismissPrompt} 
          className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground tracking-tight">Install TP Portal</h3>
            <p className="text-xs text-muted-foreground leading-relaxed pr-6">
              Install this application on your home screen for quick, full-screen access without opening Safari.
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-3 flex flex-col gap-2.5 mt-1 border border-border/50">
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background border shadow-sm text-xs shrink-0">1</span>
              <span>Tap the <Share className="inline w-4 h-4 mx-1 text-blue-500" /> Share icon below</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background border shadow-sm text-xs shrink-0">2</span>
              <span>Select <span className="inline-flex items-center gap-1 bg-background px-1.5 py-0.5 rounded border text-xs mx-1"><PlusSquare className="w-3 h-3" /> Add to Home Screen</span></span>
            </div>
          </div>
        </div>

        {/* Triangle pointer pointing down towards the Safari share button */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-b border-r border-black/5 dark:border-white/10 rotate-45" />
      </div>
    </div>
  )
}