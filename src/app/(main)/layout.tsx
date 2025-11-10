// src/app/(main)/layout.tsx
"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/context/ThemeContext";


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();
  // -------------------------------
  return (
    <div className="flex min-h-screen transition-colors duration-300 bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
      />

      {/* Main Section */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        {/* Header */}
        <PageHeader
          title="Dashboard"
          subtitle="Welcome back!"
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Content */}
        <main className="flex-1 p-6 transition-colors duration-300 bg-gray-50 dark:bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
}