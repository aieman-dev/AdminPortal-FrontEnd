// lib/formatters.ts

/**
 * Standard Date Formatter
 * Output: "12 Oct 2023"
 */
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString || dateString.startsWith("0001")) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid
  
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

// Helper to format relative time (e.g. "2 mins ago")
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
 * Standard Currency Formatter
 * Output: "RM 50.00" or "50 Pts"
 */
export const formatCurrency = (amount: number | undefined, isPoints: boolean = false): string => {
  const value = amount || 0;
  
  if (isPoints) {
    return `${Math.floor(value)} Pts`;
  }
  
  return `RM ${value.toLocaleString("en-US", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};