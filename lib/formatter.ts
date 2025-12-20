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