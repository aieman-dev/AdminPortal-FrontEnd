//components/portal/module-error-boundary
"use client"

import React from "react"
import { SystemOffline } from "@/components/portal/system-offline"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ModuleErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log this to your Logger.ts here
    console.error("Module Boundary Caught:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <SystemOffline 
            message={this.state.error?.message || "An error occurred in this module."}
            onRetry={this.handleReset} 
          />
        </div>
      )
    }

    return this.props.children
  }
}