"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Info, XCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { BroadcastItem } from "@/services/setting-services"

interface SystemAnnouncementProps {
    broadcasts: BroadcastItem[];
}

export function SystemAnnouncement({ broadcasts }: SystemAnnouncementProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeAlert, setActiveAlert] = useState<BroadcastItem | null>(null);

  useEffect(() => {
    if (!broadcasts || broadcasts.length === 0) {
        setActiveAlert(null);
        setIsVisible(false);
        return;
    }
    const latestAlert = broadcasts[0];
    const dismissedId = localStorage.getItem("last_dismissed_broadcast_id");

    if (dismissedId !== String(latestAlert.id)) {
        setActiveAlert(latestAlert);
        setIsVisible(true);
    } else {
        setIsVisible(false);
    }

  }, [broadcasts]);

  const handleDismiss = () => {
      setIsVisible(false);
      
      if (activeAlert) {
          localStorage.setItem("last_dismissed_broadcast_id", String(activeAlert.id));
      }
  }

  if (!activeAlert) return null;

  // Style based on type
  const getTypeStyles = (type: string) => {
      const t = type.toLowerCase();
      if (t === 'critical') return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200";
      if (t === 'warning') return "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200";
      return "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200";
  };
  
  const getIcon = (type: string) => {
      const t = type.toLowerCase();
      if (t === 'critical') return <XCircle className="h-4 w-4 shrink-0" />;
      if (t === 'warning') return <AlertTriangle className="h-4 w-4 shrink-0" />;
      return <Info className="h-4 w-4 shrink-0" />;
  };

  return (
    <AnimatePresence>
      {isVisible && activeAlert && (
        <motion.div
          key="system-banner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`overflow-hidden border-b ${getTypeStyles(activeAlert.type)}`}
        >
          <div className="px-4 py-3 flex items-center justify-between container mx-auto">
            <div className="flex items-center gap-3 text-sm">
              {getIcon(activeAlert.type)}
              <span className="font-semibold">{activeAlert.title}:</span>
              <span className="opacity-90">{activeAlert.message}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}