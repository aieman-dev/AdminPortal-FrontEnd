"use client"

import { ArrowRight, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
    qrId: string | number | null;
    onRedirect: () => void;
}

export function SeasonPassConflictOverlay({ qrId, onRedirect }: Props) {
    return (
        <div className="absolute inset-0 z-40 flex items-start justify-center pt-32 md:pt-48 bg-background/60 backdrop-blur-md transition-all duration-500 rounded-xl">
            <div className="relative bg-white dark:bg-zinc-950 p-8 rounded-3xl shadow-2xl border border-amber-200 dark:border-amber-900/50 flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-w-md mx-4">
                
                {/* Pulse Effect */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-500/10 rounded-full animate-ping opacity-75" />
                
                {/* Icon */}
                <div className="relative h-16 w-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mb-5 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-amber-100 dark:ring-amber-900/40">
                    <Ticket className="h-8 w-8" strokeWidth={2.5} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Active Season Pass Detected</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed mb-6">
                    This user already has an Active Season Pass <strong>(ID: {qrId})</strong>.<br/>
                    Please manage their access via the Season Parking module.
                </p>

                <Button 
                    onClick={onRedirect} 
                    className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/10 font-semibold"
                >
                    Go to Season Pass <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}