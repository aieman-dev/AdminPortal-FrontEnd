//components/PackageFormStep2
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PackageFormData, PackageItem } from "../type/packages";
import { Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

type Props = {
  form: PackageFormData;
  setForm: (f: PackageFormData | ((prev: PackageFormData) => PackageFormData)) => void;
  onNext: () => void;
  onBack: () => void;
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1524338198850-8a2ff63aaceb?w=400&h=300&fit=crop";

function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith("https") || url.startsWith("blob:")) return url;
  if (url.startsWith("http://")) return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  return url;
}

const PackageFormStep2: React.FC<Props> = ({ form, setForm, onNext, onBack }) => {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isPointMode = form.packageType === "Point";

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const authToken = getAuthToken();
        const response = await fetch("/api/proxy-create-package/creationdata", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const rawItems = data.attractions || [];
          const mappedItems: PackageItem[] = rawItems.map((item: any) => ({
            attractionId: item.terminalID || item.id,
            itemName: item.attractionName || item.name || "Unknown",
            price: 0, 
            point: 0, 
            entryQty: 0, 
            image: getProxiedImageUrl(item.ImageURL || item.imageUrl || item.imageURL)
          }));
          setItems(mappedItems);
        }
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

  const isSelected = (id: number) => form.packageitems.some((s) => s.attractionId === id);

  const handleItemChange = (item: PackageItem, field: "price" | "point" | "entryQty", value: string) => {
    if (!isSelected(item.attractionId!)) toggleSelect(item);
    const numVal = Math.max(Number(value) || 0, field === "entryQty" ? 1 : 0);
    setForm((prev) => ({
      ...prev,
      packageitems: prev.packageitems.map((s) =>
        s.attractionId === item.attractionId ? { ...s, [field]: numVal } : s
      ),
    }));
  };

  useEffect(() => {
    const total = form.packageitems.reduce((sum, item) => {
      const val = isPointMode ? (item.point || 0) : (item.price || 0);
      return sum + val * (item.entryQty || 0);
    }, 0);
    setForm((prev) => ({ ...prev, totalPrice: total }));
  }, [form.packageitems, isPointMode, setForm]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-auto xl:h-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <h2 className="text-2xl font-bold mb-2 text-foreground">2. Package Items ({form.packageitems.length})</h2>
        <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">Mode: <b>{isPointMode ? "Points" : "Price"}</b></div>
        <div className="border-b border-border mb-4" />

        <div className="mb-4">
          <input 
            placeholder="Search items..." 
            value={query} onChange={(e) => setQuery(e.target.value)} 
            className="w-full sm:w-1/2 rounded-full border border-input px-4 py-2 bg-white dark:bg-gray-950 text-foreground outline-none placeholder:text-muted-foreground" 
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4 p-1 scrollbar-hide">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading items...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No items found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const activeItem = form.packageitems.find((s) => s.attractionId === item.attractionId);
              const selected = !!activeItem;

              return (
                <div 
                  key={`${item.attractionId}-${index}`} 
                  onClick={() => toggleSelect(item)}
                  className={`relative cursor-pointer p-3 rounded-lg border border-border transition-all group
                    ${selected 
                      ? "ring-2 ring-indigo-600 bg-indigo-50/10 dark:bg-indigo-900/20 border-indigo-600 dark:border-indigo-500 shadow-md" 
                      : "bg-card dark:bg-secondary/10 border-border dark:border-white/5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                >
                  <div className="h-40 bg-muted rounded-md overflow-hidden relative">
                    <img 
                      src={item.image} 
                      className="object-cover h-full w-full" 
                      alt={item.itemName} 
                      referrerPolicy="no-referrer"
                      onError={(e) => (e.currentTarget.src = DEFAULT_IMAGE)}
                    />
                    
                    <div 
                      className={`absolute inset-0 bg-white/90 dark:bg-gray-950/90 flex flex-col justify-center p-4 transition-opacity duration-200
                        ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                        {isPointMode ? "Points" : "Price (RM)"}
                      </label>
                      <input
                        type="number"
                        value={activeItem?.[isPointMode ? "point" : "price"] ?? ""}
                        onChange={(e) => handleItemChange(item, isPointMode ? "point" : "price", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full border-b border-gray-400 dark:border-gray-600 text-center focus:border-indigo-600 outline-none mb-3 bg-transparent text-foreground dark:text-white"
                      />
                      
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Quantity</label>
                      <input
                        type="number"
                        value={activeItem?.entryQty ?? ""}
                        onChange={(e) => handleItemChange(item, "entryQty", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full border-b border-gray-400 dark:border-gray-600 text-center focus:border-indigo-600 outline-none bg-transparent text-foreground"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-center font-semibold text-foreground">{item.itemName}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="w-full lg:w-80 bg-muted/30 p-4 rounded-lg border border-border">
        <h3 className="font-bold text-foreground mb-4">Selected Items</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {form.packageitems.map((item, idx) => (
            <div key={`${item.attractionId}-${idx}`} className="flex justify-between text-sm bg-card p-2 rounded border border-border">
              <span className="text-foreground">{item.itemName}</span>
              <span className="text-muted-foreground">
                {item.entryQty} x {isPointMode ? `${item.point}pts` : `RM${item.price}`}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex justify-between font-bold text-lg text-foreground">
          <span>Total:</span>
          <span>{isPointMode ? "" : "RM"} {form.totalPrice?.toLocaleString()} {isPointMode ? "Pts" : ""}</span>
        </div>
        <div className="mt-6 flex gap-2">
          <button onClick={onBack} className="flex-1 py-2 border border-border rounded-md text-foreground hover:bg-muted transition">Back</button>
          <button onClick={onNext} className="flex-1 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Next</button>
        </div>
      </div>
    </div>
  );
};

export default PackageFormStep2;