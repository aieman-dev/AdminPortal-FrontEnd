"use client"

import React, { createContext, useContext, useState } from "react"

interface NavigationContextType {
  isDirty: boolean
  setIsDirty: (val: boolean) => void
  pendingPath: string | null
  setPendingPath: (path: string | null) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false)
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  return (
    <NavigationContext.Provider value={{ isDirty, setIsDirty, pendingPath, setPendingPath }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) throw new Error("useNavigation must be used within NavigationProvider")
  return context
}