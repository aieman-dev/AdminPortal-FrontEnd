// app/portal/error.tsx
"use client"

import { useEffect } from "react"
import { SystemOffline } from "@/components/portal/system-offline" 

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
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <SystemOffline 
        message={error.message || "An unexpected error occurred."}
        onRetry={() => reset()} 
      />
    </div>
  )
}