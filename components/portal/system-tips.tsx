"use client"

import { useState } from "react"
import { Lightbulb, X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatePresence, motion } from "framer-motion"
import { SYSTEM_TIPS } from "@/config/system-tips-data"

export function SystemTips() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentTip = SYSTEM_TIPS[currentIndex];

    const nextTip = () => setCurrentIndex((prev) => (prev + 1) % SYSTEM_TIPS.length);
    const prevTip = () => setCurrentIndex((prev) => (prev - 1 + SYSTEM_TIPS.length) % SYSTEM_TIPS.length);

    // Prevent crashing if config is empty
    if (!currentTip) return null;

    return (
        <div className="fixed right-0 top-24 z-40 flex items-start h-auto pointer-events-none">
            <AnimatePresence mode="wait">
                {!isVisible ? (
                    /* THE TAB - Slide in/out from the right */
                    <motion.button
                        key="guide-tab"
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={() => setIsVisible(true)}
                        className="pointer-events-auto bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-l-lg shadow-lg flex flex-col items-center gap-2 border border-r-0 border-indigo-400 group transition-colors"
                    >
                        <Lightbulb className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="[writing-mode:vertical-lr] text-[10px] font-bold uppercase tracking-widest py-1">Guide</span>
                    </motion.button>
                ) : (
                    /* THE PANEL - Slide in/out from the right */
                    <motion.div
                        key="guide-panel"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="pointer-events-auto w-72 bg-card border-l border-y border-border shadow-2xl rounded-l-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-indigo-600 p-3 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-tighter">System Guide</span>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-white hover:bg-white/20" 
                                onClick={() => setIsVisible(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                            <div className="min-h-[120px]">
                                <Badge className="mb-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 border-none text-[9px] uppercase">
                                    {currentTip.category}
                                </Badge>
                                <h4 className="font-bold text-sm text-foreground leading-tight mb-1">
                                    {currentTip.title}
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {currentTip.content}
                                </p>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between pt-3 border-t">
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {currentIndex + 1} / {SYSTEM_TIPS.length}
                                </span>
                                <div className="flex gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevTip}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextTip}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}