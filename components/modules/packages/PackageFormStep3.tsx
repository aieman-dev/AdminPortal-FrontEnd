"use client";
import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { PackageFormValues } from "@/lib/schemas/package-management";
import { canDraftPackage } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { getProxiedImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, isPointPackage } from "@/lib/formatter";

type Props = {
  form: UseFormReturn<PackageFormValues>; 
  onBack: () => void;
  onSubmit?: () => void;
  onSaveDraft?: () => void;
  isSubmitting?: boolean;
};

const PackageFormStep3: React.FC<Props> = ({ form, onBack, onSubmit, onSaveDraft, isSubmitting }) => {
  const { user } = useAuth();
  const canDraft = canDraftPackage(user?.department);
  
  const values = form.watch();
  const packageItems = values.packageitems || [];
  
  const [secureImageUrl, setSecureImageUrl] = useState<string>("/packages/DefaultPackageImage.png");
  const isPointMode = isPointPackage(values.packageType);
  const priceUnit = isPointMode ? "Pts" : "RM";

  const totalEntryQty = packageItems.reduce((acc, item) => acc + (item.entryQty || 0), 0);

  useEffect(() => {
    const loadSecureImage = async () => {
      if (values.imageUrl) { setSecureImageUrl(values.imageUrl); return; }
      if (values.imageID instanceof File) {
        setSecureImageUrl(URL.createObjectURL(values.imageID));
        return;
      }
      if (typeof values.imageID === "string" && values.imageID) {
         setSecureImageUrl(getProxiedImageUrl(values.imageID));
      }
    };
    loadSecureImage();
  }, [values.imageID, values.imageUrl]); 
  
  return (
    <div className="px-4 md:px-8 py-6 h-full flex flex-col overflow-hidden">
      
      {/* HEADER WITH SEPARATOR */}
      <div className="border-b border-border pb-4 mb-4 flex-shrink-0">
        <h2 className="text-2xl font-semibold text-foreground">3. Package Summary</h2>
      </div>
      
      {/* TABS & CONTENT */}
      <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col min-h-0">
        
        {/* Tab Header - Removed border-b */}
        <div className="flex-shrink-0 px-0 md:px-4 py-2 bg-muted/10 flex justify-between items-center mb-4 rounded-t-lg">
            <TabsList className="bg-muted/50 p-1 h-auto md:h-9 border shadow-sm w-full md:w-auto grid grid-cols-2 md:flex">
                <TabsTrigger 
                    value="overview" 
                    className="px-4 text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                >
                    Package Overview 
                </TabsTrigger>
                <TabsTrigger 
                    value="items" 
                    className="px-4 text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                >
                    Package Items 
                    <Badge variant="secondary" className="ml-2 h-4 px-1 bg-background/50 border text-current text-[10px]">{packageItems.length}</Badge>
                </TabsTrigger>
            </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
            
            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="mt-0 h-full">
                <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full lg:h-auto">
                    
                    {/* LEFT: IMAGE (Stretches to match content height) */}
                    <div className="w-full lg:w-1/3 xl:w-1/4 relative min-h-[250px] lg:min-h-0">
                        <img 
                            src={secureImageUrl} 
                            className="absolute inset-0 w-full h-full object-cover rounded-xl shadow-md border bg-muted" 
                            alt="Package Preview"
                        />
                    </div>

                    {/* RIGHT: CONTENT */}
                    <div className="flex-1 flex flex-col space-y-4">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Value</p>
                                <p className="text-3xl font-extrabold text-indigo-600 leading-none">
                                    {formatCurrency(values.totalPrice || 0, values.packageType)}
                                </p>
                            </div>
                        </div>
                        
                        {/* COMPACT INFO GRID */}
                        <div className="bg-muted/30 p-4 rounded-lg border text-sm space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                
                                {/* Col 1: Details */}
                                <div>
                                    <h4 className="font-bold text-sm mb-2 border-b pb-1">Package Info</h4>
                                    <div className="space-y-1.5 text-xs sm:text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Package Name:</span>
                                            <span className="font-semibold text-right truncate max-w-[150px]">{values.packageName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Entry Quantity:</span>
                                            <span>{totalEntryQty}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Price:</span>
                                            <span>{formatCurrency(values.totalPrice || 0, values.packageType)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Entry Type:</span>
                                            <span>{values.packageType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Nationality:</span>
                                            <span>{values.nationality === 'L' ? 'Malaysian' : values.nationality === 'F' ? 'International' : 'All'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Age Category:</span>
                                            <span>{values.ageCategory}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2: Validity */}
                                <div>
                                    <h4 className="font-bold text-sm mb-2 border-b pb-1">Validity</h4>
                                    <div className="space-y-1.5 text-xs sm:text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Effective Date:</span>
                                            <span>{values.effectiveDate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Last Valid Date:</span>
                                            <span>{values.lastValidDate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Day Pass:</span>
                                            <span>{values.dayPass || "-"}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-muted-foreground font-medium">Status:</span>
                                            <Badge variant="outline" className="font-normal text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 h-5">Draft (New)</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* REMARK - Pushed to fill remaining space if needed */}
                        <div className="flex-1">
                            <p className="text-xs font-bold text-muted-foreground mb-1">Internal Remark:</p>
                            <div className="p-3 bg-card border rounded-md text-sm whitespace-pre-wrap text-muted-foreground h-full min-h-[60px]">
                                {values.tpremark || "No remarks provided."}
                            </div>
                        </div>
                    </div>
                </div>
            </TabsContent>

            {/* TAB 2: ITEMS */}
            <TabsContent value="items" className="mt-0">
                {packageItems.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                        <p className="text-muted-foreground text-sm">No items added to this package.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {packageItems.map((item, index) => {
                            const itemVal = isPointMode ? (item.point || 0) : (item.price || 0);
                            return (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card shadow-sm">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-9 w-9 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                                            {item.entryQty || 1}x
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-sm text-foreground truncate" title={item.itemName}>
                                                {item.itemName}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground flex gap-2">
                                                <span className="font-mono">ID: {item.attractionId}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 pl-2">
                                        <div className="font-bold text-sm">
                                            {formatCurrency(itemVal, isPointMode)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </TabsContent>
        </div>
      </Tabs>
      
      {/* Footer Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-auto pt-4 border-t flex-shrink-0 pb-safe">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">Back</Button>
          {canDraft && (
            <Button variant="secondary" onClick={onSaveDraft} className="w-full sm:w-auto">Save Draft</Button>
          )}
        </div>

        <LoadingButton 
            onClick={onSubmit} 
            isLoading={isSubmitting || false}
            loadingText="Processing..."
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto px-8"
            >
            Confirm & Proceed
        </LoadingButton>
      </div>
    </div>
  );
};

export default PackageFormStep3;