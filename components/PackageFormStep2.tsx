// src/components/PackageFormStep2.tsx
import React, { useState, useMemo, useEffect } from "react";
import { PackageFormData, PackageItem } from "../type/packages";

type Props = {
  form: PackageFormData;
  setForm: (f: PackageFormData | ((prev: PackageFormData) => PackageFormData)) => void;
  onNext: () => void;
  onBack: () => void;
};

// Mock Items (In real app, you might fetch these too)
const sampleImage = "https://images.unsplash.com/photo-1524338198850-8a2ff63aaceb?w=400&h=300&fit=crop";
const sampleItems: PackageItem[] = [
  { attractionId: 1, itemName: "Disco Walk", price: 0, point: 0, entryQty: 0, image: sampleImage },
  { attractionId: 2, itemName: "Water World", price: 0, point: 0, entryQty: 0, image: sampleImage },
  { attractionId: 3, itemName: "Bowl America", price: 0, point: 0, entryQty: 0, image: sampleImage },
];

const PackageFormStep2: React.FC<Props> = ({ form, setForm, onNext, onBack }) => {
  const [query, setQuery] = useState("");
  
  // Determine mode based on Step 1 selection
  const isPointMode = form.packageType === "Point";

  const filtered = useMemo(() => 
    sampleItems.filter((i) => i.itemName.toLowerCase().includes(query.toLowerCase())), 
  [query]);

  // Toggle Item Selection
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

  // Handle Input Changes
  const handleItemChange = (item: PackageItem, field: "price" | "point" | "entryQty", value: string) => {
    if (!isSelected(item.attractionId!)) toggleSelect(item); // Auto-select on type

    const numVal = Math.max(Number(value) || 0, field === "entryQty" ? 1 : 0);

    setForm((prev) => ({
      ...prev,
      packageitems: prev.packageitems.map((s) =>
        s.attractionId === item.attractionId ? { ...s, [field]: numVal } : s
      ),
    }));
  };

  // Calculate Total
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
        <h2 className="text-2xl font-bold mb-2 text-gray-900">2. Package Items ({form.packageitems.length})</h2>
        <div className="text-sm text-blue-600 mb-2">Mode: <b>{isPointMode ? "Points" : "Price"}</b></div>
        <div className="border-b border-gray-300 mb-4" />

        <div className="mb-4">
          <input 
            placeholder="Search items..." 
            value={query} onChange={(e) => setQuery(e.target.value)} 
            className="w-full sm:w-1/2 rounded-full border px-4 py-2 outline-none" 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
          {filtered.map((item) => {
            const activeItem = form.packageitems.find((s) => s.attractionId === item.attractionId);
            const selected = !!activeItem;

            return (
              <div 
                key={item.attractionId} 
                onClick={() => toggleSelect(item)}
                className={`relative cursor-pointer p-3 rounded-lg border transition-all group
                  ${selected ? "ring-2 ring-indigo-600 shadow-md" : "hover:shadow-lg"}`}
              >
                <div className="h-40 bg-gray-100 rounded-md overflow-hidden relative">
                  <img src={item.image} className="object-cover h-full w-full" alt={item.itemName} />
                  
                  {/* Inputs Overlay */}
                  <div 
                    className={`absolute inset-0 bg-white/90 flex flex-col justify-center p-4 transition-opacity duration-200
                      ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="text-xs font-bold text-gray-700 uppercase mb-1">
                      {isPointMode ? "Points" : "Price (RM)"}
                    </label>
                    <input
                      type="number"
                      value={activeItem?.[isPointMode ? "point" : "price"] ?? ""}
                      onChange={(e) => handleItemChange(item, isPointMode ? "point" : "price", e.target.value)}
                      className="w-full border-b border-gray-400 text-center focus:border-indigo-600 outline-none mb-3 bg-transparent"
                    />
                    
                    <label className="text-xs font-bold text-gray-700 uppercase mb-1">Quantity</label>
                    <input
                      type="number"
                      value={activeItem?.entryQty ?? ""}
                      onChange={(e) => handleItemChange(item, "entryQty", e.target.value)}
                      className="w-full border-b border-gray-400 text-center focus:border-indigo-600 outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div className="mt-2 text-center font-semibold text-gray-800">{item.itemName}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Sidebar Summary (Same as before, just verifying mode) */}
      <div className="w-full lg:w-80 bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-bold text-gray-700 mb-4">Selected Items</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {form.packageitems.map(item => (
            <div key={item.attractionId} className="flex justify-between text-sm bg-white p-2 rounded border">
              <span>{item.itemName}</span>
              <span className="text-gray-500">
                {item.entryQty} x {isPointMode ? `${item.point}pts` : `RM${item.price}`}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>{isPointMode ? "" : "RM"} {form.totalPrice?.toLocaleString()} {isPointMode ? "Pts" : ""}</span>
        </div>
        <div className="mt-6 flex gap-2">
          <button onClick={onBack} className="flex-1 py-2 border rounded-md">Back</button>
          <button onClick={onNext} className="flex-1 py-2 bg-indigo-600 text-white rounded-md">Next</button>
        </div>
      </div>
    </div>
  );
};

export default PackageFormStep2;