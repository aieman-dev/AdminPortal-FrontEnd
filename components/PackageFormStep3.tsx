// components/PackageFormStep3.tsx
"use client";
import React, { useState, useEffect } from "react";
import { PackageFormData } from "../type/packages";
import { useAuth } from "@/hooks/use-auth"; 
import { canDraftPackage, getAuthToken } from "@/lib/auth";
import { BACKEND_API_BASE } from "@/lib/config";
import { formatDate } from "@/lib/formatter";
import { Loader2 } from "lucide-react";

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
  return days > 0 ? days : 1; 
}

const DEFAULT_FALLBACK_IMAGE = "/packages/DefaultPackageImage.png";
const IMAGE_ASSET_API_PATH = "api/Package/image-asset?id=";

const PackageFormStep3: React.FC<Props> = ({ form, onBack, onSubmit, onSaveDraft }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "items">("overview");
  const { user } = useAuth();
  const canDraft = canDraftPackage(user?.department);
  
  // 1. Initialize with Default Image so it's never empty
  const [secureImageUrl, setSecureImageUrl] = useState<string>(DEFAULT_FALLBACK_IMAGE);
  const [loadingImage, setLoadingImage] = useState(false);

  const typeLower = form.packageType.toLowerCase();
  const isPointMode = typeLower === "point"; 
  const priceUnit = isPointMode ? "Pts" : "RM";

  const formatValue = (val: number | undefined) => {
    const num = val || 0;
    return num.toLocaleString('en-US', {
        minimumFractionDigits: isPointMode ? 0 : 2,
        maximumFractionDigits: isPointMode ? 0 : 2
    });
  };

  const displayTotal = formatValue(form.totalPrice);
  const validDays = calculateValidDays(form.effectiveDate, form.lastValidDate);
  const packageTypeLabel = form.packageType === "RewardP" ? "Reward Point" : form.packageType;

  // --- EFFECT: Load Image ---
  useEffect(() => {
    const loadSecureImage = async () => {
      // 1. If we have the working URL from Step 1, USE IT.
      if (form.imageUrl) {
          setSecureImageUrl(form.imageUrl);
          return;
      }

      const imgId = form.imageID;

      // 2. If it's a File (new upload), create object URL locally
      if (imgId instanceof File) {
        setSecureImageUrl(URL.createObjectURL(imgId));
        return;
      }

      // 3. If ID is missing, USE DEFAULT IMAGE (Matches Backend Behavior)
      if (!imgId) {
        setSecureImageUrl(DEFAULT_FALLBACK_IMAGE); 
        return;
      }

      // 4. Fallback: If we ONLY have an ID string but NO URL
      if (typeof imgId === "string") {
        if (imgId.startsWith("http") || imgId.startsWith("blob:") || imgId.startsWith("/")) {
           setSecureImageUrl(imgId);
           return;
        }

        setLoadingImage(true);
        try {
          const token = getAuthToken();
          const backendTargetUrl = `${BACKEND_API_BASE}/${IMAGE_ASSET_API_PATH}${imgId}`;
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(backendTargetUrl)}`;

          const res = await fetch(proxyUrl, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (res.ok) {
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            setSecureImageUrl(objectUrl);
          } else {
            console.warn("Failed to fetch image via proxy. Using default.");
            setSecureImageUrl(DEFAULT_FALLBACK_IMAGE);
          }
        } catch (error) {
          console.error("Error fetching secure image:", error);
          setSecureImageUrl(DEFAULT_FALLBACK_IMAGE);
        } finally {
          setLoadingImage(false);
        }
      }
    };

    loadSecureImage();
  }, [form.imageID, form.imageUrl]); 


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
          <div className="flex-shrink-0 relative">
            {loadingImage ? (
                <div className="w-60 h-60 rounded-xl bg-muted flex items-center justify-center shadow-md">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="w-60 h-60 rounded-xl bg-muted shadow-md overflow-hidden relative group">
                    <img
                      src={secureImageUrl}
                      alt={form.packageName}
                      onError={(e) => (e.currentTarget.src = DEFAULT_FALLBACK_IMAGE)}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Optional: Add a label if it is the default image so user knows it's auto-assigned */}
                    {secureImageUrl === DEFAULT_FALLBACK_IMAGE && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-1 text-center font-medium">
                            Default System Image
                        </div>
                    )}
                </div>
            )}
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
                <p className="mb-2"><b className="text-foreground inline-block w-[150px] text-left">Package Name:</b> {form.packageName || "-"}</p>
                <p className="mb-2"><b className="text-foreground inline-block w-[150px] text-left">Type:</b> {packageTypeLabel || "-"}</p>
                <p className="mb-2"><b className="text-foreground inline-block w-[150px] text-left">Nationality:</b> {form.nationality || "-"}</p>
                <p className="mb-2"><b className="text-foreground inline-block w-[150px] text-left">Category:</b> {form.ageCategory || "-"}</p>
                <p className="mt-4"><b className="text-foreground inline-block w-[150px] text-left">Remark:</b> {form.tpremark || "-"}</p>
              </div>
              
              {/* Column 2: Validity */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground border-b border-border pb-1">Validity</h4>
                <p className="mb-2"><b className="text-foreground inline-block w-[100px]">Effective:</b> {formatDate(form.effectiveDate)}</p>
                <p className="mb-2"><b className="text-foreground inline-block w-[100px]">Expires:</b> {formatDate(form.lastValidDate)}</p>
                <p className="mb-2"><b className="text-foreground inline-block w-[100px]">Duration:</b> {validDays} Days</p>
                <p className="mb-2"><b className="text-foreground inline-block w-[100px]">Day Pass:</b> {form.dayPass || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Package Items tab content... */}
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