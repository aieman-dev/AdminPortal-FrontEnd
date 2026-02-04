"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface PageWrapperProps {
  children: ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 1, 0.5, 1] // Custom "ease-out-expo" for a smooth finish
      }}
    >
      {children}
    </motion.div>
  )
}