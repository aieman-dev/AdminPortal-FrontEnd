"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  // Accept either a rendered node (JSX) or a component type (for icon refs).
  icon: React.ReactNode | React.ComponentType<any>
  title: string
  description: string
  action?: {
    label: string
    // serializable href (safe from Server Components)
    href?: string
    // client-only event handler (only used when EmptyState is rendered from a Client Component)
    onClick?: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  // FIX: Use isValidElement to distinguish between a rendered Element (<Icon />) 
  // and a Component Definition (Icon).
  // This correctly handles Functional Components, Class Components, and ForwardRef objects (like Lucide icons).
  const renderedIcon = React.isValidElement(icon)
    ? icon
    : React.createElement(icon as React.ComponentType<any>, {
        className: "h-8 w-8 text-muted-foreground",
      })

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {renderedIcon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        (action.href ? (
          <Button asChild variant="outline">
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        ))
      )}
    </div>
  )
}