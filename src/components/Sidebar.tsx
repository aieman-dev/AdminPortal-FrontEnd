"use client";

import { useState } from "react"; // <-- import useState
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Ticket, User, Settings, LogOut, ServerCog } from "lucide-react";

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
}

export default function Sidebar({ isExpanded, setIsExpanded, isDarkMode }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    packages: pathname.startsWith("/packages"),
  });

  const navItems = [
    { name: "Home", icon: <Home size={20} />, href: "/homepage" },
    {name: "Package", icon: <Ticket size={20} />,href: "/packages"},
    {name: "POSWF", icon: <ServerCog size={20} />,href: "/poswf"},
    { name: "Account", icon: <User size={20} />, href: "/account" },
    { name: "Settings", icon: <Settings size={20} />, href: "/settings" },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col justify-between shadow-lg transition-all duration-300 ease-in-out overflow-hidden
        ${isExpanded ? "w-64" : "w-20"} 
        ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div
        className={`flex items-center justify-center w-full h-[85px] py-6 border-b transition-colors duration-300 ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div
          className={`relative h-[51px] transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? "w-[145px]" : "w-[60px]"
          }`}
        >
          <Image
            src={isDarkMode ? "/logo/icity-logo-white.svg" : "/logo/icity-logo.svg"}
            alt="I-City Logo"
            fill
            priority
            className="object-contain transition-all duration-300 ease-in-out"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col w-full px-4 mt-6 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <div key={item.name} className="relative">
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-3 transition-all duration-300
                  ${isActive ? "bg-[#5B5FEF] text-white" : isDarkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-600 hover:bg-[#7C83FF]/15"}
                  ${!isExpanded ? "justify-center" : ""}`}
                title={!isExpanded ? item.name : undefined}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {isExpanded && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className={`relative border-t p-4 flex flex-col gap-4 transition-colors duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {/* User Info */}
        <div className={`flex items-center w-full transition-all duration-300 ease-in-out ${isExpanded ? "justify-start gap-3" : "justify-center"}`}>
          <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center font-semibold text-gray-700 flex-shrink-0">
            A
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "opacity-100 max-w-[7rem] ml-2" : "opacity-0 max-w-0"}`}>
            <p className="text-sm font-semibold whitespace-nowrap">Admin User</p>
            <p className="text-xs whitespace-nowrap">Administrator</p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          className={`group flex items-center text-sm w-full border rounded-md transition-all duration-200 ease-in-out
            ${isExpanded ? "justify-start gap-3 px-4 py-3" : "justify-center p-3"}
            ${isDarkMode ? "border-gray-700 text-white hover:bg-gray-700 hover:text-white" : "border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600"}
          `}
          title={!isExpanded ? "Sign out" : undefined}
          >
          <LogOut
            size={18}
            className={`flex-shrink-0 transition-transform duration-200 ease-in-out ${isExpanded ? "group-hover:translate-x-[2px]" : ""}${isDarkMode ? "text-white" : "text-gray-700"}`}
          />
          <span className ={`transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap ${isExpanded ? "opacity-100 ml-2 max-w-[5rem]" : "opacity-0 max-w-0"}`}>
            Sign out
          </span>
        </button>
      </div>
    </aside>
  );
}