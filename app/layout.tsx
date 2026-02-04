import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationProvider } from "@/context/navigation-context"


export const metadata: Metadata = {
  title: "Theme Park Portal - Secure Authentication System",
  description: "Production-ready theme park portal with authentication and dashboard",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {/* 3. Wrap your children with the ThemeProvider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationProvider>
              <Suspense 
                  fallback={
                    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-muted-foreground gap-3">
                      {/* Use your branding color here */}
                      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                      <p className="text-sm font-medium animate-pulse">Initializing Portal...</p>
                    </div>
                  }
                >
                  {children}
                </Suspense>
              <Analytics />
            </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
