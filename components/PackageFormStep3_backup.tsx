// components/PackageFormStep3.tsx
"use client";
import React, { useState } from "react";
import { PackageFormData } from "../type/packages";
import { useAuth } from "@/hooks/use-auth"; 
import { canDraftPackage } from "@/lib/auth";
import { BACKEND_API_BASE } from "@/lib/config"; // Import config for image proxy

type Props = {
  form: PackageFormData;
  onBack: () => void;
  onSubmit?: () => void;
  onSaveDraft?: () => void;
};

// Helper: Calculate Valid Days
function calculateValidDays(effectiveDate: string, lastValidDate: string): number {
  if (!effectiveDate || !lastValidDate) return 0;
  const start = new Date(effectiveDate).getTime();
  const end = new Date(lastValidDate).getTime();
  const diffTime = end - start;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return days > 0 ? days : 1; // Minimum 1 day validity
}

// Helper: Image Proxy Logic (Consistent with Steps 1 & 2)
const DEFAULT_FALLBACK_IMAGE = "/packages/DefaultPackageImage.png";
const IMAGE_ASSET_API_PATH = "api/Package/image-asset?id=";

function getProxiedImageUrl(url: string | File | null | undefined): string {
  if (!url) return DEFAULT_FALLBACK_IMAGE;

  // Handle File objects (new uploads)
  if (url instanceof File) {
      return URL.createObjectURL(url);
  }

  // Handle existing URLs
  if (url.startsWith("https") || url.startsWith("blob:") || url.startsWith("/packages/")) return url;
  
  let targetUrl = url;
  if (url.startsWith(BACKEND_API_BASE) || url.startsWith("http://")) {
    targetUrl = url;
  } else if (url.startsWith("/")) {
    targetUrl = `${BACKEND_API_BASE}${url}`;
  } else if (url.length > 0 && !url.includes('/')) {
    // It's likely an ID
    targetUrl = `${BACKEND_API_BASE}/${IMAGE_ASSET_API_PATH}${url}`;
  } else {
      return DEFAULT_FALLBACK_IMAGE;
  }
  
  if (targetUrl.startsWith(BACKEND_API_BASE) || targetUrl.startsWith("http://")) {
    return `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
  }
  return DEFAULT_FALLBACK_IMAGE;
}

const PackageFormStep3: React.FC<Props> = ({ form, onBack, onSubmit, onSaveDraft }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "items">("overview");
  const { user } = useAuth();
  const canDraft = canDraftPackage(user?.department);

  // Logic: Point vs Currency Mode
  const typeLower = form.packageType.toLowerCase();
  // Check specifically for "point" (not reward point)
  const isPointMode = typeLower === "point"; 
  const priceUnit = isPointMode ? "Pts" : "RM";

  // Formatting Logic: Integers for Points, 2 Decimals for RM
  const formatValue = (val: number | undefined) => {
    const num = val || 0;
    return num.toLocaleString('en-US', {
        minimumFractionDigits: isPointMode ? 0 : 2,
        maximumFractionDigits: isPointMode ? 0 : 2
    });
  };

  const displayTotal = formatValue(form.totalPrice);
  const validDays = calculateValidDays(form.effectiveDate, form.lastValidDate);
  
  // Label Logic: Map "RewardP" -> "Reward Point"
  const packageTypeLabel = form.packageType === "RewardP" ? "Reward Point" : form.packageType;

  return (
    <div className="px-4 md:px-8 py-6">
      <h2 className="text-2xl font-semibold text-foreground mb-6">3. Package Summary</h2>

      <div className="flex gap-2 mb-8">
        {["overview", "items"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab 
              ? "bg-indigo-600 text-white" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab === "overview" ? "Package Overview" : "Package Items"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-shrink-0">
            <img
              src={getProxiedImageUrl(form.imageID)}
              alt={form.packageName}
              onError={(e) => (e.currentTarget.src = DEFAULT_FALLBACK_IMAGE)}
              className="w-60 h-60 rounded-xl object-cover shadow-md bg-muted"
            />
          </div>

          <div className="flex-1 flex flex-col space-y-4">
            
            {/* Price/Point Display */}
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {isPointMode ? `${displayTotal} ${priceUnit}` : `${priceUnit} ${displayTotal}`}
            </p>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-muted-foreground">
              
              {/* Column 1: Package Info */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground border-b border-border pb-1">Package Info</h4>
                <p className="mb-2">
                  <b className="text-foreground inline-block w-[150px] text-left">Package Name:</b> {form.packageName || "-"}
                </p>
                <p className="mb-2">
                  <b className="text-foreground inline-block w-[150px] text-left">Type:</b> {packageTypeLabel || "-"}
                </p>
                <p className="mb-2">
                  <b className="text-foreground inline-block w-[150px] text-left">Nationality:</b> {form.nationality || "-"}
                </p>
                <p className="mb-2">
                  <b className="text-foreground inline-block w-[150px] text-left">Category:</b> {form.ageCategory || "-"}
                </p>
                <p className="mt-4">
                  <b className="text-foreground inline-block w-[150px] text-left">Remark:</b> {form.tpremark || "-"}
                </p>
              </div>
              
              {/* Column 2: Validity */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground border-b border-border pb-1">Validity</h4>
                <p className="mb-2">
                  <b className="text-foreground inline-block w-[100px]">Effective:</b> {form.effectiveDate ? new Date(form.effectiveDate).toLocaleDateString("en-GB") : "-"}
                </p>
                <p className="mb-2">
                  <b className="text-foreground inline-block w-[100px]">Expires:</b> {form.lastValidDate ? new Date(form.lastValidDate).toLocaleDateString("en-GB") : "-"}
                </p>
                <p className="mb-2">
                  <b className="text-foreground inline-block w-[100px]">Duration:</b> {validDays} Days
                </p>
                <p className="mb-2">
                  <b className="text-foreground inline-block w-[100px]">Day Pass:</b> {form.dayPass || "-"}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {activeTab === "items" && (
        <div className="rounded-lg bg-muted/30 p-4 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {form.packageitems.map((item, idx) => {
              const val = isPointMode ? (item.point || 0) : (item.price || 0);
              const formattedItemVal = formatValue(val);

              return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-card border border-border rounded shadow-sm">
                    <span className="font-medium text-sm text-foreground">{item.itemName}</span>
                    <span className="text-sm text-muted-foreground">
                      {isPointMode ? `${formattedItemVal} Pts` : `RM ${formattedItemVal}`} x {item.entryQty}
                    </span>
                  </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-10">
        <div className="flex gap-2">
          <button onClick={onBack} className="px-6 py-2 border border-border rounded-md text-foreground hover:bg-muted transition">Back</button>
          {canDraft && (
            <button onClick={onSaveDraft} className="px-6 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-md hover:bg-gray-500 dark:hover:bg-gray-500 transition">Save Draft</button>
          )}
          </div>
        <button onClick={onSubmit} className="px-8 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition">Proceed</button>
      </div>
    </div>
  );
};

export default PackageFormStep3;