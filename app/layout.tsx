import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationProvider } from "@/context/navigation-context"
import { PWAPrompt } from "@/components/portal/pwa-prompt"


export const metadata: Metadata = {
  title: "Theme Park Portal - Secure Authentication System",
  description: "Production-ready theme park portal with authentication and dashboard",
  generator: "v0.app",
  manifest: "/manifest.json", 
  formatDetection: {
    telephone: false, 
  },
  icons: {
    icon: '/icon-app/icon-192x192.png',
    apple: '/icon-app/apple-touch-icon.png?v=2',
  },
  appleWebApp: {
    capable: true, 
    statusBarStyle: "default",
    title: "TP Portal",
    startupImage: [
      { url: '/splash/apple-splash-2048-2732.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)' },
      { url: '/splash/apple-splash-1668-2388.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)' },
      { url: '/splash/apple-splash-1536-2048.png', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)' },
      { url: '/splash/apple-splash-1320-2868.png', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/apple-splash-1290-2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/apple-splash-1284-2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/apple-splash-1179-2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/apple-splash-1170-2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/apple-splash-1125-2436.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/apple-splash-828-1792.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)' },
    ]
  },
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
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationProvider>
              {/* --- WISE-STYLE SEAMLESS ANIMATED HANDOFF --- */}
              <Suspense 
                  fallback={
                    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#1603fc]">
                      
                      {/* The Logo (Pulses while app loads) */}
                      <div className="relative h-16 w-48 animate-pulse duration-1000">
                        <img 
                          src="/logo/icity-logo.svg" 
                          alt="i-City Logo" 
                          className="object-contain w-full h-full dark:hidden" 
                        />
                        <img 
                          src="/logo/icity-logo-white.svg" 
                          alt="i-City Logo" 
                          className="object-contain w-full h-full hidden dark:block" 
                        />
                      </div>

                      {/* The Sleek Loading Bar */}
                      <div className="absolute bottom-16 flex flex-col items-center gap-3 w-full px-12">
                        <div className="h-1 w-32 bg-gray-100 dark:bg-black/20 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-indigo-600 dark:bg-indigo-400 rounded-full w-1/2 animate-[shimmer_1s_infinite_linear]" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                          Securing Connection
                        </p>
                      </div>

                    </div>
                  }
                >
                  {children}
                </Suspense>
              <Analytics />
              <PWAPrompt />
            </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
