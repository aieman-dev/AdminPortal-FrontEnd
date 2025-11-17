"use client";
import React, { useState } from "react";
import { PackageFormData } from "../type/packages";

type Props = {
  form: PackageFormData;
  onBack: () => void;
  onSubmit?: () => void;
  onSaveDraft?: () => void;
};

function calculateValidDays(effectiveDate: string, lastValidDate: string): number {
  if (!effectiveDate || !lastValidDate) return 0;
  const start = new Date(effectiveDate);
  const end = new Date(lastValidDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const PackageFormStep3: React.FC<Props> = ({ form, onBack, onSubmit, onSaveDraft }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "items">("overview");
  const isPointMode = form.packageType === "Point";
  const validDays = calculateValidDays(form.effectiveDate, form.lastValidDate);
  const DEFAULT_IMAGE = "https://endodermal-tiffaney-scalelike.ngrok-free.dev/images/wynsnow.jpg";

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
              src={
                form.imageID instanceof File 
                  ? URL.createObjectURL(form.imageID)
                  : (typeof form.imageID === "string" && form.imageID !== "" ? form.imageID : DEFAULT_IMAGE)
              }
              alt={form.packageName}
              onError={(e) => (e.currentTarget.src = DEFAULT_IMAGE)}
              className="w-60 h-60 rounded-xl object-cover shadow-md bg-muted"
            />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 text-muted-foreground">
            <div>
              <h4 className="font-semibold mb-2 text-foreground">Package Info</h4>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {isPointMode ? `${form.totalPrice} Pts` : `RM ${form.totalPrice?.toFixed(2)}`}
              </p>
              <p><b className="text-foreground">Package Name:</b> {form.packageName || "-"}</p>
              <p><b className="text-foreground">Type:</b> {form.packageType || "-"}</p>
              <p><b className="text-foreground">Nationality:</b> {form.nationality || "-"}</p>
              <p><b className="text-foreground">Category:</b> {form.ageCategory || "-"}</p>
              <p><b className="text-foreground">Remark:</b> {form.tpremark || "-"}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-foreground">Validity</h4>
              <p><b className="text-foreground">Effective:</b> {form.effectiveDate ? new Date(form.effectiveDate).toLocaleDateString("en-GB") : "-"}</p>
              <p><b className="text-foreground">Expires:</b> {form.lastValidDate ? new Date(form.lastValidDate).toLocaleDateString("en-GB") : "-"}</p>
              <p><b className="text-foreground">Duration:</b> {validDays} Days</p>
              <p><b className="text-foreground">Day Pass:</b> {form.dayPass || "-"}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "items" && (
        <div className="rounded-lg bg-muted/30 p-4 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {form.packageitems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-card border border-border rounded shadow-sm">
                <span className="font-medium text-sm text-foreground">{item.itemName}</span>
                <span className="text-sm text-muted-foreground">
                  {isPointMode ? `${item.point} Pts` : `RM ${item.price}`} x {item.entryQty}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-10">
        <div className="flex gap-2">
          <button onClick={onBack} className="px-6 py-2 border border-border rounded-md text-foreground hover:bg-muted transition">Back</button>
          <button onClick={onSaveDraft} className="px-6 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-md hover:bg-gray-500 dark:hover:bg-gray-500 transition">Save Draft</button>
        </div>
        <button onClick={onSubmit} className="px-8 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition">Proceed</button>
      </div>
    </div>
  );
};

export default PackageFormStep3;