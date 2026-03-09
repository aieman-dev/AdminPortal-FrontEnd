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

// SeasonParkingDetailView /SuperAppVisitorDetailView logic
export function isUserInside(status: string | undefined): boolean {
    const s = (status || "").toUpperCase();
    return (s.includes("PARK") || s.includes("USED")) && 
           !s.includes("AWAY") && 
           !s.includes("UNUSED");
}

// ---safely maps your data and catches errors automatically--
export function safeMap<T>(
    rawData: any[], 
    mapperFunction: (item: any) => T, 
    entityName: string
): T[] {
    try {
        return rawData.map(mapperFunction);
    } catch (error: any) {
        // We catch the error thrown by the mapper and re-throw it 
        // with a clear message so the UI can catch it.
        throw new Error(`Failed to parse ${entityName} data: ${error.message}`);
    }
}