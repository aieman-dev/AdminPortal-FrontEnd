// src/app/layout.tsx
import "./globals.css"
import { ThemeProvider } from "@/context/ThemeContext"
import { Inter } from "next/font/google"

export const metadata = {
  title: "I-CITY Dashboard",
  description: "Admin dashboard",
  icons: {
    icon: "/logo/i-only-logo-white.svg", // Path to your favicon
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="transition-colors duration-300 bg-gray-100 dark:bg-gray-900">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}