// src/components/PackageFormStep2.tsx
import React, { useState, useMemo, useEffect } from "react";
import { PackageFormData, PackageItem } from "../type/packages";

type Props = {
  form: PackageFormData;
  setForm: (
    f: PackageFormData | ((prev: PackageFormData) => PackageFormData)
  ) => void;
  onNext: () => void;
  onBack: () => void;
};

const sampleImage =
  "https://images.unsplash.com/photo-1524338198850-8a2ff63aaceb?w=400&h=300&fit=crop";

const sampleItems: PackageItem[] = [
  { attractionId: 1, itemName: "Disco Walk", price: 0, entryQty: 0, image: sampleImage },
  { attractionId: 2, itemName: "Water World", price: 0, entryQty: 0, image: sampleImage },
  { attractionId: 3, itemName: "Bowl America", price: 0, entryQty: 0, image: sampleImage },
  { attractionId: 4, itemName: "Bumper Car", price: 0, entryQty: 0, image: sampleImage },
  { attractionId: 5, itemName: "DSA", price: 0, entryQty: 0, image: sampleImage },
  { attractionId: 6, itemName: "Fun Fun", price: 0, entryQty: 0, image: sampleImage },
  { attractionId: 7, itemName: "SnoWalk", price: 0, entryQty: 0, image: sampleImage },
  { attractionId: 8, itemName: "Sky City", price: 0, entryQty: 0, image: sampleImage },
  { attractionId: 9, itemName: "WynSnow", price: 0, entryQty: 0, image: sampleImage },
  { attractionId: 10, itemName: "Ferris Wheel", price: 0, entryQty: 0, image: sampleImage },
];

const PackageFormStep2: React.FC<Props> = ({ form, setForm, onNext, onBack }) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      sampleItems.filter((i) =>
        i.itemName.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [query]
  );

  // ----- Selection & Input Handling -----
  const toggleSelect = (item: PackageItem) => {
    setForm((prev) => {
      const exists = prev.packageitems.find((s) => s.attractionId === item.attractionId);
      if (exists) {
        return {
          ...prev,
          packageitems: prev.packageitems.filter((s) => s.attractionId !== item.attractionId),
        };
      }
      return {
        ...prev,
        packageitems: [
          ...prev.packageitems,
          { ...item, price: 0, entryQty: 1 },
        ],
      };
    });
  };

  const isSelected = (id: number) =>
    form.packageitems.some((s) => s.attractionId === id);

  const ensureSelected = (item: PackageItem) => {
    if (!isSelected(item.attractionId)) toggleSelect(item);
  };

  const handleItemChange = (
    item: PackageItem,
    field: "price" | "entryQty",
    value: string
  ) => {
    ensureSelected(item);
    const numericValue = Math.max(Number(value) || 0, field === "entryQty" ? 1 : 0);
    setForm((prev) => ({
      ...prev,
      packageitems: prev.packageitems.map((s) =>
        s.attractionId === item.attractionId
          ? { ...s, [field]: numericValue }
          : s
      ),
    }));
  };

  const removeSelected = (id: number) =>
    setForm((prev) => ({
      ...prev,
      packageitems: prev.packageitems.filter((s) => s.attractionId !== id),
    }));

  // ----- Total price calculation -----
  useEffect(() => {
    const total = form.packageitems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.entryQty || 0),
      0
    );
    setForm((prev) => ({ ...prev, totalPrice: total }));
  }, [form.packageitems, setForm]);

  // ----- Component JSX -----
  return (
    <div className="flex flex-col xl:flex-row gap-6 h-auto xl:h-full">
      {/* Left: Available Items */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">
          2. Package Items ({form.packageitems.length} selected)
        </h2>
        <div className="border-b border-gray-300 mb-4" />

        <div className="mb-4 flex items-center gap-2">
          <input
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-3/4 lg:w-1/2 rounded-full border border-gray-300 px-4 py-2 text-gray-700 focus:outline-gray-200"
          />
          <button
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                packageitems: [...sampleItems],
              }))
            }
            className="px-3 py-1 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700"
          >
            Select All
          </button>
          <button
            onClick={() =>
              setForm((prev) => ({ ...prev, packageitems: [] }))
            }
            className="px-3 py-1 rounded-md border border-gray-300 text-sm hover:bg-gray-100"
          >
            Clear All
          </button>
        </div>

        <div className="flex-1 pr-0 lg:pr-2 overflow-y-auto bg-gray-50 p-4 rounded-md min-h-0 scrollbar-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 pb-4">
            {filtered.map((item) => (
              <div
                key={item.attractionId}
                role="button"
                aria-pressed={isSelected(item.attractionId)}
                className={`relative cursor-pointer p-3 rounded-lg border transition-transform duration-300 ease-in-out
                  ${isSelected(item.attractionId)
                    ? "ring-4 ring-[#6D28D9] shadow-lg"
                    : "hover:shadow-md hover:scale-105"
                  } group`}
                onClick={() => toggleSelect(item)}
              >
                <div className="relative h-40 flex items-center justify-center bg-white rounded overflow-hidden shadow-sm transition-all duration-500 group-hover:shadow-md">
                  <img
                    src={item.image}
                    alt={item.itemName}
                    className="object-cover h-full w-full transition-transform duration-700 ease-in-out group-hover:scale-105"
                  />

                  {/* Overlay */}
                  <div
                    className={`absolute inset-0 flex flex-col justify-center bg-white/95 backdrop-blur-sm p-3 transform transition-all duration-500 ease-in-out
                      ${
                        isSelected(item.attractionId)
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-auto"
                      }`}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.tagName === "INPUT" || target.tagName === "LABEL") return;
                      toggleSelect(item);
                    }}
                  >
                    <label className="text-sm font-medium text-gray-800 mb-1">Price (RM)</label>
                    <input
                      type="number"
                      min={0}
                      value={
                        form.packageitems.find((s) => s.attractionId === item.attractionId)?.price ?? ""
                      }
                      onFocus={(e) => { if (e.target.value === "0") e.target.value = ""; }}
                      onBlur={(e) => { if (e.target.value === "") handleItemChange(item, "price", "0"); }}
                      onChange={(e) => handleItemChange(item, "price", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full border-b text-gray-700 outline-none text-center"
                    />

                    <label className="text-sm font-medium text-gray-800 mb-1 mt-2">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={
                        form.packageitems.find((s) => s.attractionId === item.attractionId)?.entryQty ?? ""
                      }
                      onChange={(e) => handleItemChange(item, "entryQty", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full border-b text-gray-700 outline-none text-center"
                    />
                  </div>
                </div>

                <div className="mt-2 text-center font-semibold text-gray-900">{item.itemName}</div>

                {isSelected(item.attractionId) && (
                  <div className="absolute top-2 right-2 bg-[#6D28D9] text-white rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Selected Items */}
      <div className="w-full lg:w-80 flex flex-col h-full border-t lg:border-t-0 lg:border-l pt-5 lg:pt-0 pl-0 lg:pl-5 pr-3 overflow-hidden">
        <div className="text-sm text-gray-900 mb-3 font-semibold">Selected Items:</div>
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-md min-h-0 scrollbar-hidden">
          {form.packageitems.length === 0 && <div className="text-gray-900 font-medium">No items selected</div>}
          <ul className="space-y-3">
            {form.packageitems.map((s) => (
              <li key={s.attractionId} className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white rounded-md overflow-hidden border">
                  {s.image && <img src={s.image} alt={s.itemName} className="object-cover h-full w-full" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{s.itemName}</div>
                  <div className="text-xs text-gray-700">Qty: {s.entryQty || 1} | RM{s.price || 0}</div>
                </div>
                <button onClick={() => removeSelected(s.attractionId)} className="text-sm text-red-500 hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 text-right text-gray-900 font-semibold">
          Total Price: RM {form.totalPrice?.toFixed(2) || "0.00"}
        </div>

        <div className="mt-5 flex justify-between">
          <button onClick={onBack} className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100">Back</button>
          <button onClick={onNext} className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700">Next</button>
        </div>
      </div>
    </div>
  );
};

export default PackageFormStep2;
