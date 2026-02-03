"use client"

import { Ban } from "lucide-react"

export function BlockedOverlay() {
    return (
        <div className="absolute inset-0 z-40 flex items-start justify-center pt-32 md:pt-48 bg-background/60 backdrop-blur-md transition-all duration-500">
            {/* Modern Floating Card */}
            <div className="relative bg-white dark:bg-zinc-950 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-w-sm mx-4">
                
                {/* Pulse Effect behind Icon */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-500/10 rounded-full animate-ping opacity-75" />
                
                {/* Icon */}
                <div className="relative h-16 w-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-5 text-red-600 dark:text-red-400 shadow-sm ring-1 ring-red-100 dark:ring-red-900/40">
                    <Ban className="h-8 w-8" strokeWidth={2.5} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Season Pass Suspended</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    This season pass is currently blocked. <br/>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Unblock</span> to edit details or manage access.
                </p>
            </div>
        </div>
    )
}