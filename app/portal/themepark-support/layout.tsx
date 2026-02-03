import { ModuleErrorBoundary } from "@/components/portal/module-error-boundary"

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleErrorBoundary>
      {children}
    </ModuleErrorBoundary>
  )
}