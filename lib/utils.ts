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
  if (url.startsWith("blob:") || url.startsWith("data:")) return url; 
  
  if (url.startsWith("http")) {
      if (url.startsWith(BACKEND_API_BASE)) {
          return `/api/proxy-image?url=${encodeURIComponent(url)}`;
      }
      return url;
  }

  let targetUrl = url;
  
  if (url.startsWith("/")) {
    targetUrl = `${BACKEND_API_BASE}${url}`;
  } 
  else if (url.length > 0 && !url.includes('/')) {
    targetUrl = `${BACKEND_API_BASE}/${IMAGE_ASSET_API_PATH}${url}`;
  } else {
      return DEFAULT_IMAGE;
  }
  
  return `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
}

export function extractBackendError(errorMsg: string): string {
    if (!errorMsg) return "An unexpected error occurred.";
    // Regex to find content between "error =" and the next comma or bracket
    const match = errorMsg.match(/error\s*=\s*([^,}]+)/);
    return match && match[1] ? match[1].trim() : errorMsg;
}

// NOTE: Pricing logic moved to lib/formatter.ts