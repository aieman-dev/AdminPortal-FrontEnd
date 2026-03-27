"use client";

import React, { useState, useMemo, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { PackageFormValues } from "@/lib/schemas/package-management";
import { PackageItem } from "@/type/packages"; 
import { EmptyState } from "@/components/portal/empty-state"
import { ShoppingCart, List, Trash2, PlusCircle, AlertTriangle,  } from "lucide-react"; 
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose 
} from "@/components/ui/dialog";
import {
  HoverCard, HoverCardContent, HoverCardTrigger
} from "@/components/ui/hover-card"
import { packageService } from "@/services/package-services"; 
import { LoaderState } from "@/components/ui/loader-state";
import { Input } from "@/components/ui/input"; 
import { useAppToast } from "@/hooks/use-app-toast";
import { getProxiedImageUrl } from "@/lib/utils"; 
import { formatCurrency, isPointPackage } from "@/lib/formatter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";

type Props = {
  form: UseFormReturn<PackageFormValues>; 
  onNext: () => void;
  onBack: () => void;
};

const PackageFormStep2: React.FC<Props> = ({ form, onNext, onBack }) => {
  const toast = useAppToast();
  const [query, setQuery] = useState("");
  const [availableItems, setAvailableItems] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearOpen, setIsClearOpen] = useState(false);
  
  // Mobile Tab Logic
  const [mobileTab, setMobileTab] = useState<"browse" | "summary">("browse");
  
  const packageItems = form.watch("packageitems");
  const packageType = form.watch("packageType");
  const isPointMode = isPointPackage(packageType);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await packageService.getCreationData();
        const rawItems = data.attractions || [];
        const uniqueMap = new Map();
        rawItems.forEach((item: any) => {
          const id = item.terminalID || item.id;
          if (!uniqueMap.has(id)) {
            uniqueMap.set(id, {
              attractionId: id,
              itemName: item.attractionName || item.name || "Unknown",
              price: 0, point: 0, entryQty: 0,
              image: getProxiedImageUrl(item.ImageURL || item.imageUrl)
            });
          }
        });
        setAvailableItems(Array.from(uniqueMap.values()));
      } catch (error) { 
          logger.error("Failed to load available items", { error }); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchItems();
  }, []);

  const filtered = useMemo(() => 
    availableItems.filter((i) => i.itemName.toLowerCase().includes(query.toLowerCase())), 
  [query, availableItems]);


  const toggleSelect = (item: PackageItem) => {
    const exists = packageItems.find((s) => s.attractionId === item.attractionId);
    let newItems = [];
    if (exists) {
        newItems = packageItems.filter((s) => s.attractionId !== item.attractionId);
    } else {
        newItems = [...packageItems, { ...item, price: 0, point: 0, entryQty: 1 }];
        toast.success("Item Added", `${item.itemName} added.`);
    }
    form.setValue("packageitems", newItems);
  };

  const handleItemChange = (item: PackageItem, field: "price" | "point" | "entryQty", value: string) => {
    let numVal = Number(value); 
    if (isNaN(numVal)) numVal = 0;
    if (isPointMode && field === "point") numVal = Math.floor(numVal);
    if (field === "entryQty") numVal = Math.max(1, numVal);
    else numVal = Math.max(0, numVal);

    const exists = packageItems.find(s => s.attractionId === item.attractionId);
    let newItems = [];

    if(!exists) {
        const newItem = { ...item, price: 0, point: 0, entryQty: 1, [field]: numVal };
        newItems = [...packageItems, newItem];
    } else {
        newItems = packageItems.map((s) => 
            s.attractionId === item.attractionId ? { ...s, [field]: numVal } : s
        );
    }
    form.setValue("packageitems", newItems);
  };

  const handleSelectAll = () => {
    const existingIds = new Set(packageItems.map(p => p.attractionId));
    const itemsToAdd = filtered.filter(item => !existingIds.has(item.attractionId));
    
    if (itemsToAdd.length === 0) return;

    const newItems = [
      ...packageItems, 
      ...itemsToAdd.map(item => ({ ...item, price: 0, point: 0, entryQty: 1 }))
    ];
    form.setValue("packageitems", newItems);
    toast.success("Batch Add", `Added ${itemsToAdd.length} items to cart.`);
  };

  const handleClearCart = () => {
      setIsClearOpen(true);
  };

  const confirmClearCart = () => {
      form.setValue("packageitems", []);
      toast.success("Cart Cleared", "All items have been removed.");
      setIsClearOpen(false);
  };

  useEffect(() => {
    const total = packageItems.reduce((sum, item) => {
      const val = isPointMode ? (item.point || 0) : (item.price || 0);
      return sum + val;
    }, 0);
    form.setValue("totalPrice", total);
  }, [packageItems, isPointMode, form]);

  const getValueField = () => isPointMode ? "point" : "price";

  return (
    <div className="flex flex-col h-[calc(100dvh-200px)] min-h-[500px]">
      
      {/* HEADER SECTION */}
      <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold mb-2 text-foreground">2. Package Items</h2>
          <div className="border-b border-border mb-4" />
          <div className="mb-4 text-sm flex items-center gap-2">
              <span className="text-muted-foreground">Package Type:</span>
              <Badge className="font-semibold bg-blue-100 text-blue-600 hover:bg-blue-200 border-none">{packageType}</Badge>
          </div>
      </div>

      {/* MOBILE TABS (Visible only < XL) */}
      <div className="xl:hidden flex gap-2 mb-4 p-1 bg-muted rounded-lg flex-shrink-0">
          <button 
            onClick={() => setMobileTab("browse")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mobileTab === "browse" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
          >
            <List size={16} /> Browse Items
          </button>
          <button 
            onClick={() => setMobileTab("summary")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mobileTab === "summary" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
          >
            <ShoppingCart size={16} /> 
            Cart ({packageItems.length})
          </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 overflow-hidden relative">
        
        {/* LEFT COLUMN: BROWSE ITEMS */}
        <div className={`flex-col h-full overflow-hidden flex-1 ${mobileTab === "browse" ? "flex" : "hidden"} xl:flex`}>
          <div className="mb-4 flex-shrink-0 flex items-center gap-3">
              <div className="relative flex-1">
                  <Input 
                      placeholder="Search items" 
                      value={query} 
                      onChange={(e) => setQuery(e.target.value)} 
                  />
              </div>
              
              {/* Select All Button - Standard size with text */}
              <Button 
                  onClick={handleSelectAll} 
                  variant="outline"
                  className="shrink-0 gap-2 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
              >
                  <PlusCircle size={16} />
                  <span>Select All</span>
              </Button>
          </div>
          
          <div className="flex flex-col gap-2 overflow-y-auto pb-4 p-1 scrollbar-hide flex-1">
            {loading ? <LoaderState /> : filtered.map((item) => {
                const activeItem = packageItems.find((s) => s.attractionId === item.attractionId);
                const selected = !!activeItem;
                const valueField = getValueField();

                return (
                  <div key={item.attractionId} onClick={() => toggleSelect(item)} className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-colors ${selected ? "bg-indigo-50 border-indigo-600" : "hover:bg-muted/50"}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* ITEM IMAGE */}
                      <HoverCard openDelay={500} closeDelay={100}>
                          <HoverCardTrigger asChild>
                              <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted border group cursor-zoom-in">
                                  <img 
                                      src={item.image} 
                                      alt={item.itemName}
                                      className="h-full w-full object-cover"
                                      onError={(e) => (e.currentTarget.src = "/packages/DefaultPackageImage.png")}
                                  />
                              </div>
                          </HoverCardTrigger>
                          
                          <HoverCardContent 
                              side="right" 
                              align="start" 
                              className="w-72 h-72 p-0 overflow-hidden border-4 border-white shadow-2xl rounded-xl z-50 ml-4"
                          >
                              <img 
                                  src={item.image} 
                                  alt="Zoom" 
                                  className="w-full h-full object-cover" 
                              />
                          </HoverCardContent>
                      </HoverCard>

                      <div className="flex-1 font-semibold text-sm leading-tight">{item.itemName}</div>
                    </div>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input 
                            type={isPointMode ? "tel" : "text"} 
                            inputMode={isPointMode ? "numeric" : "decimal"}
                            className="w-20 h-9 text-center bg-white shadow-sm" 
                            value={activeItem?.[valueField] ?? ""} 
                            onChange={(e) => handleItemChange(item, valueField, e.target.value)} 
                            placeholder={isPointMode ? "Pts" : "RM"} 
                        />
                        <Input 
                            type="tel" 
                            className="w-16 h-9 text-center bg-white shadow-sm" 
                            value={activeItem?.entryQty ?? ""} 
                            onChange={(e) => handleItemChange(item, "entryQty", e.target.value)} 
                            placeholder="Qty" 
                        />
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
        
        {/* RIGHT COLUMN: SUMMARY (Hidden on mobile unless selected) */}
        <div className={`w-full xl:w-96 flex-col bg-muted/30 p-4 border rounded-lg h-full ${mobileTab === "summary" ? "flex" : "hidden"} xl:flex`}>
          <h3 className="font-bold mb-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                  <span>Selected Items</span>
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{packageItems.length}</span>
              </div>
              {packageItems.length > 0 && (
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearCart} 
                      className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                      <Trash2 size={14} className="mr-1" /> Clear
                  </Button>
              )}
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {packageItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 p-6">
                      <EmptyState 
                          icon={ShoppingCart} 
                          title="Cart is Empty" 
                          description="Browse items on the left and click to add them to your package." 
                      />
                  </div>
              ) : (
                  packageItems.map((item) => (
                    <div key={item.attractionId} className="flex justify-between items-center text-sm bg-card p-3 border rounded shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-medium line-clamp-1" title={item.itemName}>{item.itemName}</span>
                            <span className="text-xs text-muted-foreground">x{item.entryQty}</span>
                        </div>
                        <span className="font-mono font-medium">
                            {formatCurrency(isPointMode ? item.point : item.price, packageType)}
                        </span>
                    </div>
                  ))
              )}
          </div>

          <div className="mt-4 pt-4 border-t bg-card rounded-lg p-4 shadow-sm border flex-shrink-0 pb-safe">
              <div className="flex justify-between items-end mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Total Estimate</span>
                  <span className="text-2xl font-bold text-indigo-600 leading-none">
                      {formatCurrency(form.watch("totalPrice"), packageType)}
                  </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={onBack} className="w-full">Back</Button>
                  <Button onClick={onNext} disabled={packageItems.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700">Next Step</Button>
              </div>
          </div>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION DIALOG */}
      <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
                <AlertTriangle className="h-6 w-6" />
                <DialogTitle>Clear Shopping Cart?</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to remove all items from your selection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setIsClearOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearCart}>
              Yes, Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div> 
  );
};
    

export default PackageFormStep2;