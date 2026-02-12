"use client"

import { useState } from "react"
import { Lightbulb, X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatePresence, motion } from "framer-motion"
import { SYSTEM_TIPS } from "@/config/system-tips-data"
import { useIsMobile } from "@/hooks/use-mobile"

export function SystemTips() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const isMobile = useIsMobile();

    const currentTip = SYSTEM_TIPS[currentIndex];

    const nextTip = () => setCurrentIndex((prev) => (prev + 1) % SYSTEM_TIPS.length);
    const prevTip = () => setCurrentIndex((prev) => (prev - 1 + SYSTEM_TIPS.length) % SYSTEM_TIPS.length);

    if (!currentTip) return null;

    // --- ANIMATION VARIANTS ---
    const desktopVariants = {
        hidden: { x: 300, opacity: 0 },
        visible: { x: 0, opacity: 1 },
        exit: { x: 300, opacity: 0 }
    };

    const mobileVariants = {
        hidden: { y: 100, opacity: 0 },
        visible: { y: 0, opacity: 1 },
        exit: { y: 100, opacity: 0 }
    };

    return (
        <>
            {/* MOBILE BACKDROP (Only show when open on mobile) */}
            <AnimatePresence>
                {isMobile && isVisible && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsVisible(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
                    />
                )}
            </AnimatePresence>

            {/* MAIN CONTAINER */}
            {/* Desktop: Fixed Right-Top | Mobile: Fixed Bottom-Right (Trigger) or Bottom-Center (Card) */}
            <div className={`fixed z-50 pointer-events-none flex items-end justify-end
                ${isMobile ? "bottom-0 left-0 right-0 p-4" : "top-24 right-0 h-auto items-start"}
            `}>
                <AnimatePresence mode="wait">
                    {!isVisible ? (
                        /* === TRIGGER BUTTON === */
                        <motion.button
                            key="guide-tab"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsVisible(true)}
                            className={`pointer-events-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg group transition-colors flex items-center justify-center
                                ${isMobile 
                                    ? "h-12 w-12 rounded-full absolute bottom-6 right-4 shadow-xl" // Mobile: Round FAB
                                    : "p-2 rounded-l-lg border-y border-l border-indigo-400 flex-col gap-2" // Desktop: Side Tab
                                }
                            `}
                        >
                            <Lightbulb className={isMobile ? "h-6 w-6" : "h-5 w-5 group-hover:scale-110 transition-transform"} />
                            {!isMobile && (
                                <span className="[writing-mode:vertical-lr] text-[10px] font-bold uppercase tracking-widest py-1">
                                    Guide
                                </span>
                            )}
                        </motion.button>
                    ) : (
                        /* === CONTENT PANEL === */
                        <motion.div
                            key="guide-panel"
                            variants={isMobile ? mobileVariants : desktopVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={`pointer-events-auto bg-card shadow-2xl overflow-hidden flex flex-col
                                ${isMobile 
                                    ? "w-full rounded-2xl border border-border mb-2" // Mobile: Floating Card at bottom
                                    : "w-72 rounded-l-2xl border-l border-y border-border" // Desktop: Side Panel
                                }
                            `}
                        >
                            {/* Header */}
                            <div className="bg-indigo-600 p-3 flex items-center justify-between text-white shrink-0">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-tighter">System Guide</span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-white hover:bg-white/20 rounded-full" 
                                    onClick={() => setIsVisible(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                <div className="min-h-[100px]">
                                    <Badge className="mb-3 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-none text-[9px] uppercase px-2 py-0.5">
                                        {currentTip.category}
                                    </Badge>
                                    <h4 className="font-bold text-sm text-foreground leading-snug mb-2">
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
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={prevTip}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={nextTip}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}