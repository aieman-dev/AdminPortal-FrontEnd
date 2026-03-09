"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

interface Props {
  children: React.ReactNode
  widgetName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the localized error securely
    logger.error(`Widget Error: ${this.props.widgetName || 'Unknown Widget'}`, {
      error: error.message,
      componentStack: errorInfo.componentStack
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-muted/10 border border-dashed rounded-xl h-full min-h-[250px] w-full animate-in fade-in">
          <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {this.props.widgetName || "Widget"} failed to load
          </h3>
          <p className="text-xs text-muted-foreground mb-4 text-center max-w-[250px] line-clamp-2" title={this.state.error?.message}>
            {this.state.error?.message || "An unexpected error occurred during rendering."}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            <RefreshCw className="h-3 w-3 mr-2" /> Retry
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}