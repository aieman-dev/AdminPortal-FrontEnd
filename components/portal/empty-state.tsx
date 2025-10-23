"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  // Accept either a rendered React node (JSX) or a component type (for
  // backward compatibility with icon component refs like `FileText`).
  icon: React.ReactNode | React.ComponentType<any>
  title: string
  description: string
  action?: {
    label: string
    // href is serializable and safe to pass from Server Components.
    href?: string
    // onClick may be provided when this component is used from a Client Component.
    onClick?: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const renderedIcon =
    typeof icon === "function"
      ? React.createElement(icon as React.ComponentType<any>, {
          className: "h-8 w-8 text-muted-foreground",
        })
      : icon

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {renderedIcon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        // If href is provided, render an anchor inside Button using asChild so
        // the action is serializable from Server Components. If onClick is
        // provided (when used from a Client Component), wire it up directly.
        action.href ? (
          <Button asChild variant="outline">
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}
