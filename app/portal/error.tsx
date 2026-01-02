// app/portal/error.tsx
"use client"

import { useEffect } from "react"
import { SystemOffline } from "@/components/portal/system-offline" // <--- The UI component

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Portal Error Boundary caught:", error)
  }, [error])

  return (
    <div className="h-full flex items-center justify-center p-6">
      {/* This renders the standardized Offline UI */}
      <SystemOffline 
        message={error.message}
        onRetry={() => reset()} 
      />
    </div>
  )
}