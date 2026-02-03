// lib/formatter.ts

import { STATUS_STYLES } from "./constants";
/**
 * Helper to determine if a package type implies points vs currency.
 */
export function isPointPackage(packageType: string | undefined): boolean {
  const t = (packageType || "").toLowerCase();
  // Logic: It is points if it says "point", UNLESS it is "reward point" 
  return t.includes("point") && !t.includes("reward");
}

/**
 * Unified Currency Formatter
 * Supports both explicit boolean (isPoints=true) OR type string (packageType="Entry")
 * * Usage:
 * formatCurrency(100, true) -> "100 Pts"
 * formatCurrency(100, "Point") -> "100 Pts"
 * formatCurrency(100, "Entry") -> "RM 100.00"
 */
export const formatCurrency = (
  amount: number | undefined, 
  typeOrIsPoints: boolean | string | undefined = false
): string => {
  const value = amount || 0;
  
  let isPoints = false;

  if (typeof typeOrIsPoints === 'boolean') {
      isPoints = typeOrIsPoints;
  } else {
      isPoints = isPointPackage(typeOrIsPoints);
  }
  
  if (isPoints) {
    return `${Math.floor(value)} Pts`;
  }
  
  return `RM ${value.toLocaleString("en-US", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Standard Date Formatter
 * Output: "12 Oct 2023"
 */
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString || dateString.startsWith("0001")) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", 
    month: "short", 
    year: "numeric"
  }).format(date);
};

/**
 * Standard Date & Time Formatter
 * Output: "12 Oct 2023, 10:30 am"
 */
export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString || dateString.startsWith("0001")) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", 
    month: "short", 
    year: "numeric",
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: true
  }).format(date).replace(',', ''); 
};

// Helper to extract just the time (e.g., "03:00 am")
export const getTimeDisplay = (dateStr: string | undefined) => {
    if (!dateStr || dateStr.startsWith("0001")) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: true
    }).format(date);
};

export const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

/**
 * Returns the CSS classes for a given status key.
 * Used by StatusBadge and PackageCard.
 */
export function getStatusStyle(status: string): string {
    const key = status?.toLowerCase().trim() || "default";
    return STATUS_STYLES[key] || "bg-gray-100 text-gray-600 border-gray-200";
}

// Formatter Helpers
export const formatNRIC = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    // If it's pure numbers and 12 chars, treat as NRIC
    if (/^\d{12}$/.test(clean)) {
        return `${clean.slice(0, 6)}-${clean.slice(6, 8)}-${clean.slice(8, 12)}`;
    }
    // Otherwise return clean alphanumeric for Passports
    return clean.slice(0, 15); 
};

export const formatMobile = (val: string) => {
    let digits = val.replace(/\D/g, "");
    // Only prefix if it's a local number starting with '0' or '1'
    if (digits.startsWith("0")) digits = "6" + digits;
    return digits.slice(0, 13);
};