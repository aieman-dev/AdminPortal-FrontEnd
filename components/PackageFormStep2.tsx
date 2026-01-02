"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PackageFormData, PackageItem } from "../type/packages";
import { ShoppingCart, List, Trash2, SearchX } from "lucide-react"; 
import { packageService } from "@/services/package-services"; 
import { formatCurrency } from "@/lib/formatter";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LoaderState } from "@/components/ui/loader-state";
import { EmptyState } from "@/components/portal/empty-state";
import { getProxiedImageUrl, formatPackagePrice, isPointPackage } from "@/lib/utils"; 

type Props = {
  form: PackageFormData;
  setForm: (f: PackageFormData | ((prev: PackageFormData) => PackageFormData)) => void;
  onNext: () => void;
  onBack: () => void;
};


const PackageFormStep2: React.FC<Props> = ({ form, setForm, onNext, onBack }) => {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<"browse" | "summary">("browse");
  const isPointMode = isPointPackage(form.packageType);

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
              price: 0,
              point: 0,
              entryQty: 0,
              image: getProxiedImageUrl(item.ImageURL || item.imageUrl || item.imageURL)
            });
          }
        });
          setItems(Array.from(uniqueMap.values()));
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const filtered = useMemo(() => 
    items.filter((i) => i.itemName.toLowerCase().includes(query.toLowerCase())), 
  [query, items]);

  const toggleSelect = (item: PackageItem) => {
    setForm((prev) => {
      const exists = prev.packageitems.find((s) => s.attractionId === item.attractionId);
      if (exists) {
        return { ...prev, packageitems: prev.packageitems.filter((s) => s.attractionId !== item.attractionId) };
      }
      return { 
        ...prev, 
        packageitems: [...prev.packageitems, { ...item, price: 0, point: 0, entryQty: 1 }] 
      };
    });
  };

  const handleItemChange = (item: PackageItem, field: "price" | "point" | "entryQty", value: string) => {
    let numVal = Number(value); 
    if (isNaN(numVal)) numVal = 0;
    if (isPointMode && field === "point") numVal = Math.floor(numVal);
    if (field === "entryQty") numVal = Math.max(1, numVal);
    else numVal = Math.max(0, numVal);

    setForm((prev) => {
      const exists = prev.packageitems.find((s) => s.attractionId === item.attractionId);
      let newItems = [...prev.packageitems];
      if (!exists) {
        const newItem = { ...item, price: 0, point: 0, entryQty: 1, [field]: numVal };
        newItems.push(newItem);
      } else {
        newItems = newItems.map((s) => 
            s.attractionId === item.attractionId ? { ...s, [field]: numVal } : s
        );
      }
      return { ...prev, packageitems: newItems };
    });
  };

  useEffect(() => {
    const total = form.packageitems.reduce((sum, item) => {
      const val = isPointMode ? (item.point || 0) : (item.price || 0);
      return sum + val;
    }, 0);
    setForm((prev) => ({ ...prev, totalPrice: total }));
  }, [form.packageitems, isPointMode, setForm]);

  const getModeDisplayText = () => {
    if (form.packageType === "Entry") return "Entry (RM)";
    if (form.packageType === "Point") return "Point (Pts)";
    if (form.packageType === "RewardP") return "Reward Point (RM)";
    return "N/A";
  };
  
  const getCurrencyDisplay = () => isPointMode ? "Pts" : "RM";
  const getValueField = () => isPointMode ? "point" : "price";
  
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      
      {/* MOBILE TABS */}
      <div className="flex xl:hidden mb-4 bg-muted/50 p-1 rounded-lg">
        <button
          onClick={() => setMobileTab("browse")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
            mobileTab === "browse" ? "bg-white dark:bg-gray-800 shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List size={16} /> Browse Items
        </button>
        <button
          onClick={() => setMobileTab("summary")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 relative ${
            mobileTab === "summary" ? "bg-white dark:bg-gray-800 shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingCart size={16} /> Review Selection
          {form.packageitems.length > 0 && (
            <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 overflow-hidden relative">
        
        {/* LEFT COLUMN: Search & List */}
        <div className={`flex-col h-full overflow-hidden flex-1 ${mobileTab === "browse" ? "flex" : "hidden"} xl:flex`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-foreground">2. Package Items</h2>
            <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded font-medium">
              Package Type: <b>{getModeDisplayText()}</b>
            </div>
          </div>
          <div className="border-b border-border mb-4" />

          <div className="mb-4">
            <input 
              placeholder="Search items..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              className="w-full sm:w-1/2 rounded-full border border-input px-4 py-2 bg-white dark:bg-gray-950 text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-500/20 transition-all" 
            />
          </div>
          
          <div className="flex flex-col gap-2 overflow-y-auto pb-4 p-1 scrollbar-hide flex-1">
            {loading ? (
              <LoaderState message="Loading items..." className="h-full border-none bg-transparent" />
            ) : filtered.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                    <EmptyState 
                        icon={SearchX} 
                        title="No items found" 
                        description="Try searching for a different item name."
                    />
                </div>
            ) : (
              filtered.map((item) => {
                const activeItem = form.packageitems.find((s) => s.attractionId === item.attractionId);
                const selected = !!activeItem;
                const valueField = getValueField();

                return (
                  <div
                    key={item.attractionId} 
                    onClick={() => toggleSelect(item)}
                    className={`
                      group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
                      ${
                        selected
                          ? "bg-indigo-50 border-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-500 shadow-sm"
                          : "bg-card hover:bg-muted/50 border-border"
                      }
                    `}
                  >
                    <div className="shrink-0 relative">
                      {/* HoverCard for preview */}
                      <HoverCard openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <div className="relative">
                            <img
                              src={item.image}
                              alt={item.itemName}
                              referrerPolicy="no-referrer"
                              // Use imported utility logic fallback? No, utility handles default.
                              // Just handle error case to be safe.
                              onError={(e) => (e.currentTarget.src = "/packages/DefaultPackageImage.png")}
                              className="h-12 w-12 rounded-full object-cover border border-border bg-muted cursor-zoom-in"
                            />
                            {selected && (
                                <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm border border-white dark:border-gray-800">
                                </div>
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent 
                          className="w-64 p-0 border-none bg-transparent shadow-none" 
                          side="right" 
                          align="start" 
                          sideOffset={20}
                        >
                          <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-white dark:border-gray-600">
                            <img src={item.image} alt={item.itemName} className="w-full h-auto object-cover bg-black" onError={(e) => (e.currentTarget.src = "/packages/DefaultPackageImage.png")} />
                            <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2 text-white text-xs font-medium truncate">
                                {item.itemName}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className={`font-semibold text-sm truncate ${selected ? "text-indigo-700 dark:text-indigo-300" : "text-foreground"}`}>
                        {item.itemName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col w-20 sm:w-24 items-center justify-center gap-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground text-center w-full">
                          {isPointMode ? "Points" : "RM"}
                        </label>
                        <input
                          type="number"
                          value={activeItem?.[valueField] || ""}
                          onChange={(e) => handleItemChange(item, valueField as "price" | "point", e.target.value)}
                          onClick={(e) => e.stopPropagation()} 
                          placeholder="0"
                          step={isPointMode ? "1" : "0.01"}
                          className={`
                            w-full h-8 px-2 text-sm text-center rounded border outline-none transition-colors
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                            ${
                              selected
                                ? "border-indigo-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-indigo-900 dark:text-indigo-100 bg-white dark:bg-gray-900"
                                : "border-input text-muted-foreground bg-white dark:bg-gray-950 focus:border-indigo-400"
                            }
                          `}
                        />
                      </div>

                      <div className="flex flex-col w-14 sm:w-16 items-center justify-center gap-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground text-center w-full">
                          Qty
                        </label>
                        <input
                          type="number"
                          value={activeItem?.entryQty || ""}
                          onChange={(e) => handleItemChange(item, "entryQty", e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="1"
                          className={`
                            w-full h-8 px-2 text-sm text-center rounded border outline-none transition-colors
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                            ${
                              selected
                                ? "border-indigo-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-indigo-900 dark:text-indigo-100 bg-white dark:bg-gray-900"
                                : "border-input text-muted-foreground bg-white dark:bg-gray-950 focus:border-indigo-400"
                            }
                          `}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* RIGHT COLUMN: Summary (Unchanged) */}
        <div className={`w-full xl:w-80 flex-col bg-muted/30 p-4 rounded-lg border border-border h-full ${mobileTab === "summary" ? "flex" : "hidden"} xl:flex`}>
          <h3 className="font-bold text-foreground mb-4 shrink-0 flex items-center justify-between">
            <span>Selected Items</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{form.packageitems.length}</span>
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-2 pt-2">
              {form.packageitems.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                    <ShoppingCart size={40} className="mb-2 stroke-1" />
                    <span className="text-sm italic">No items selected</span>
                  </div>
              )}
              {form.packageitems.map((item) => (
                  <div 
                    key={item.attractionId} 
                    className="group relative flex justify-between text-sm bg-card p-3 rounded border border-border shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <button
                        onClick={() => toggleSelect(item)}
                        className="absolute -top-2 -right-1 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 scale-90 group-hover:scale-100"
                        title="Remove from package"
                    >
                        <Trash2 size={12} />
                    </button>
                    <span className="text-foreground font-medium truncate w-[60%] select-none">{item.itemName}</span>
                    <span className="text-muted-foreground text-xs flex flex-col items-end select-none">
                        <span>Qty: {item.entryQty}</span>
                        <span className="font-semibold text-indigo-600">
                           {formatPackagePrice(isPointMode ? item.point : item.price, form.packageType)}
                        </span>
                    </span>
                  </div>
              ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border shrink-0">
              <div className="flex justify-between font-bold text-lg text-foreground mb-6">
                  <span>Total:</span>
                  <span>{formatPackagePrice(form.totalPrice, form.packageType)}</span>
              </div>
              <div className="flex gap-2">
                  <button onClick={onBack} className="flex-1 py-2 border border-border rounded-md text-foreground hover:bg-white dark:hover:bg-gray-800 transition">Back</button>
                  <button 
                      onClick={onNext} 
                      disabled={form.packageitems.length === 0}
                      className="flex-1 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                      Next Step
                  </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageFormStep2;