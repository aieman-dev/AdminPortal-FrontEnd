// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BACKEND_API_BASE } from "@/lib/config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DEFAULT_IMAGE = "/packages/DefaultPackageImage.png";
const IMAGE_ASSET_API_PATH = "api/Package/image-asset?id=";

export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url; // Handle local previews
  
  // If it's already a full URL (e.g. from Unsplash or external), return it
  if (url.startsWith("http")) {
      // If it points to OUR backend, we might need to proxy it
      if (url.startsWith(BACKEND_API_BASE)) {
          return `/api/proxy-image?url=${encodeURIComponent(url)}`;
      }
      return url;
  }

  let targetUrl = url;
  
  // Handle relative paths
  if (url.startsWith("/")) {
    targetUrl = `${BACKEND_API_BASE}${url}`;
  } 
  // Handle raw ID strings (e.g. "12345")
  else if (url.length > 0 && !url.includes('/')) {
    targetUrl = `${BACKEND_API_BASE}/${IMAGE_ASSET_API_PATH}${url}`;
  } else {
      return DEFAULT_IMAGE;
  }
  
  return `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
}

export function isPointPackage(packageType: string | undefined): boolean {
    const t = (packageType || "").toLowerCase();
    // Logic: It is points if it says "point", UNLESS it is "reward point" 
    // (Adjust this logic based on your specific business rule. 
    // If RewardP also uses points, remove the second check).
    return t.includes("point") && !t.includes("reward");
}

/**
 * Formats a value based on package type.
 * e.g. "50 Pts" or "RM 50.00"
 */
export function formatPackagePrice(amount: number | undefined, packageType: string | undefined): string {
    const value = amount || 0;
    const isPoints = isPointPackage(packageType);

    if (isPoints) {
        return `${Math.floor(value)} Pts`;
    }
    
    return `RM ${value.toLocaleString("en-US", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })}`;
}