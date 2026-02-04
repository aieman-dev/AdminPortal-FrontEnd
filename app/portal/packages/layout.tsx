// app/portal/packages/layout.tsx
import React from 'react';
import { ModuleErrorBoundary } from "@/components/portal/module-error-boundary";

export default function PackageLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleErrorBoundary>
      {children}
    </ModuleErrorBoundary>
  );
}