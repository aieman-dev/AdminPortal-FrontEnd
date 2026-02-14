"use client";

import { LoginForm } from "@/components/auth/login-form"
import { Building2 } from "lucide-react"
import { APP_VERSION } from "@/lib/constants"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import Image from "next/image"

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background text-foreground transition-colors duration-500">
      
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
          <Image 
            src="/bg/bg-2.png" 
            alt="Theme Park Sketch" 
            fill 
            className={cn(
                "object-cover object-bottom transition-all duration-700",
                resolvedTheme === 'dark' 
                    ? "opacity-20 invert hue-rotate-180 contrast-125" 
                    : "opacity-40 mix-blend-multiply sepia-[.25] contrast-125" 
            )}
            priority
          />
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80",
            resolvedTheme === 'dark' ? "dark:from-background dark:via-background/20" : ""
          )} />
      </div>

      {/* CARD CONTAINER */}
      <div className={cn(
        "relative z-10 w-full max-w-[400px] p-4 transition-opacity duration-500",
        mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        
        {/* Glow Underlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-[80px] rounded-full -z-10" />

        {/* Card*/}
        <div className="bg-card/85 dark:bg-card/75 backdrop-blur-xl rounded-3xl border border-border/60 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] p-6 relative overflow-hidden ring-1 ring-border/5">
            
            {/* Header */}
            <div className="flex flex-col items-center space-y-2 mb-6">
                 <div className="relative group">
                    <div className="absolute inset-0 bg-primary blur-lg opacity-20 group-hover:opacity-30 transition-opacity rounded-xl" />
                    <div className="relative inline-flex h-12 w-12 rounded-xl bg-primary items-center justify-center shadow-lg ring-1 ring-white/10 mb-2">
                        <Building2 className="h-6 w-6 text-primary-foreground" />
                    </div>
                 </div>
                 
                 <div className="text-center space-y-0.5">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Theme Park Portal</h1>
                    <p className="text-muted-foreground text-xs font-medium">Secure Operational Access</p>
                 </div>
            </div>

            <LoginForm />

            {/* Footer: Reduced margin (mt-8 -> mt-6) and padding (pt-6 -> pt-4) */}
            <div className="mt-6 pt-4 border-t border-border/50 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-1">
                    Authorized Personnel Only
                </p>
                <p className="text-[10px] text-muted-foreground/50 font-mono">
                    v{APP_VERSION}
                </p>
            </div>
        </div>
      </div>

    </div>
  )
}