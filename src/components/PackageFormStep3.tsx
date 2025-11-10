//src/components/PackageFormStep3.tsx
"use client";
import React, { useState } from "react";
import { PackageFormData } from "../type/packages";
import { Search, CheckCircle } from "lucide-react";
import { DraftModal } from "@/components/PackageModals";

type Props = {
  form: PackageFormData;
  onBack: () => void;
  onSubmit?: () => void;
  onSaveDraft?: () => void;
};

// Helper — calculate valid days
function calculateValidDays(effectiveDate: string, lastValidDate: string): number {
  const start = new Date(effectiveDate);
  const end = new Date(lastValidDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const PackageFormStep3: React.FC<Props> = ({ form, onBack, onSubmit, onSaveDraft }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "items">("overview");
  const [visitedItemsTab, setVisitedItemsTab] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const validDays =
    form.effectiveDate && form.lastValidDate
      ? calculateValidDays(form.effectiveDate, form.lastValidDate)
      : "-";

  const filteredItems =
    form.packageitems?.filter((item) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  // Default placeholder image
  const defaultImage = "/bg/DefaultPackageImage.png"; 

  return (
    <div className="px-4 md:px-8 py-6 w-full overflow-hidden relative">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        3. Package Summary
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {["overview", "items"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab as any);
              if (tab === "items") setVisitedItemsTab(true);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {tab === "overview" ? "Package Overview" : "Package Items"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            {/* Package Image */}
            <div className="flex-shrink-0">
              {form.imageID && typeof form.imageID !== "string" ? (
                <img
                  src={URL.createObjectURL(form.imageID)}
                  alt={form.name}
                  className="w-60 h-60 rounded-xl object-cover shadow-md"
                />
              ) : form.imageID ? (
                <img
                  src={form.imageID}
                  alt={form.name}
                  className="w-60 h-60 rounded-xl object-cover shadow-md"
                />
              ) : (
                <img
                  src={defaultImage}
                  alt="Default Package"
                  className="w-60 h-60 rounded-xl object-cover shadow-md opacity-90"
                />
              )}
            </div>

            {/* Package Info */}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {form.name || "Untitled Package"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                {/* Package Info */}
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Package Info</h4>
                  <p><b>Total Price:</b> {form.totalPrice?.toFixed(2) || "0.00"}</p>
                  <p><b>Package Type:</b> {form.packageType || "-"}</p>
                  <p><b>Nationality:</b> {form.nationality || "-"}</p>
                  <p><b>Age Category:</b> {form.ageCategory || "-"}</p>
                   <p><b>Day Pass:</b> {form.dayPass || "-"}</p>
                </div>

                {/* Validity */}
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Validity</h4>
                  <p><b>Effective Date:</b> {form.effectiveDate || "-"}</p>
                  <p><b>Last Valid Date:</b> {form.lastValidDate || "-"}</p>
                  <p><b>Valid Days:</b> {validDays}</p>
                  <p><b>Status:</b> Draft</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="my-6 border-gray-200" />

          {/* Remarks */}
          {form.tpremark && (
            <div className="text-gray-700">
              <h4 className="font-semibold mb-1 text-gray-900">Remark</h4>
              <p>{form.tpremark}</p>
            </div>
          )}
        </>
      )}

      {/* Package Items Tab */}
      {activeTab === "items" && (
        <div className="rounded-lg bg-gray-100 p-4 overflow-hidden">
          {/* Search */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center bg-white rounded-full px-4 py-2 w-80 shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="bg-transparent outline-none flex-1 text-gray-900 placeholder-gray-400"
              />
              <Search size={18} className="text-gray-400" />
            </div>
          </div>

          {/* Items List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto max-h-[400px] scrollbar-hide">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <span className="font-medium text-gray-700 text-sm">
                    {item.itemName}
                  </span>
                  <div className="text-sm text-gray-500">
                    RM {item.price ?? "-"} × {item.entryQty ?? "-"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No items found.</p>
            )}
          </div>
        </div>
      )}

      {/* Bottom Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-10">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition"
          >
            Back
          </button>
          <button
            onClick={onSaveDraft}
            className="px-6 py-2 rounded-md bg-gray-400 text-white hover:bg-gray-500 transition"
          >
            Save as Draft
          </button>
        </div>
        <button
          onClick={onSubmit}
          disabled={!visitedItemsTab}
          className={`px-10 py-2.5 rounded-full font-medium transition ${
            visitedItemsTab
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

export default PackageFormStep3;
