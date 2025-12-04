// components/PackageFormStep1.tsx
import React, { useEffect, useState, useRef } from "react";
import { Calendar, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PackageFormData } from "../type/packages";
import { getAuthToken } from "@/lib/auth";

type Props = {
  form: PackageFormData;
  setForm: (f: PackageFormData | ((prev: PackageFormData) => PackageFormData)) => void;
  onNext: () => void;
};

// FIX 4: Helper to format date to an ISO string using local date components, 
// forcing NOON (T12:00:00) without the UTC indicator (Z) to prevent rollback.
const convertDateForSubmission = (date: Date): string => {
  if (!date) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // CHANGE: Return ISO-like string format: YYYY-MM-DDT12:00:00
  return `${year}-${month}-${day}T12:00:00`;
};


const PackageFormStep1: React.FC<Props> = ({ form, setForm, onNext }) => {
  const [ageOptions, setAgeOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingAges, setLoadingAges] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCreationData = async () => {
      setLoadingAges(true);
      try {
        const authToken = getAuthToken();
        const res = await fetch("/api/proxy-create-package/creationdata", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          const categories = data.ageCategories || [];
          setAgeOptions(categories.map((c: any) => ({
            value: c.displayText, 
            label: c.displayText
          })));
        }
      } catch (err) {
        console.error("Failed to load age categories", err);
      } finally {
        setLoadingAges(false);
      }
    };
    fetchCreationData();
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (form.imageID && form.imageID instanceof File) {
      objectUrl = URL.createObjectURL(form.imageID);
      setImagePreviewUrl(objectUrl);
    } else {
      setImagePreviewUrl(null);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [form.imageID]); 

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setForm(prev => ({ ...prev, imageID: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Common classes for inputs to reuse
  const inputClass = "w-full border border-input rounded-md px-3 py-2 text-sm " 
    "bg-white dark:bg-secondary/20 " 
    "text-foreground dark:text-gray-100 " 
    "dark:border-white/10 "  // Subtle border in dark mode
    "focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none " 
    "placeholder:text-muted-foreground transition-all";

  return (
    <div className="flex-1 text-foreground">
      <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">1. Package Details</h2>
      <div className="border-b border-border dark:border-white/10 mb-6 scrollbar-hide" />

      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Package Name</label>
          <input
            type="text"
            value={form.packageName}
            onChange={(e) => setForm({ ...form, packageName: e.target.value })}
            className={inputClass}
            placeholder="Enter package name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Package Type</label>
          {/* FIX 2: Updated dropdown options for Package Type */}
          <select
            value={form.packageType}
            onChange={(e) => setForm({ ...form, packageType: e.target.value })}
            className={inputClass}
          >
            <option value="" className="dark:bg-gray-900">Select Type</option>
            <option value="Entry" className="dark:bg-gray-900">Entry </option>
            <option value="Point" className="dark:bg-gray-900">Point </option>
            <option value="Reward P" className="dark:bg-gray-900">Reward P</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">This determines if items use RM, Points, or Reward Points.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Nationality</label>
          {/* FIX: Update labels and values to short codes */}
          <select
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className={inputClass}
          >
            <option value="" className="dark:bg-gray-900">Select Nationality</option>
            <option value="L" className="dark:bg-gray-900">Malaysia</option>
            <option value="F" className="dark:bg-gray-900">International</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Age Category</label>
          <select
            value={form.ageCategory}
            onChange={(e) => {
            // e.target.value is the descriptive label, since we set it that way above.
              const selectedLabel = e.target.value;
              setForm({ ...form, ageCategory: selectedLabel });
            }}
            disabled={loadingAges}
            className={`${inputClass} disabled:opacity-50`}
          >
            <option value="">{loadingAges ? "Loading..." : "Select Age Category"}</option>
            {ageOptions.map((opt, idx) => (
            // FIX 3: opt.value is the descriptive label, ensuring the select works correctly.
            <option key={idx} value={opt.value} className="dark:bg-gray-900">{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Effective Date</label>
          <div className="relative">
            <DatePicker
              selected={form.effectiveDate ? new Date(form.effectiveDate) : null}
              // FIX 4: Use conversion helper
              onChange={(date) => setForm({ ...form, effectiveDate: date ? convertDateForSubmission(date) : "" })}
              dateFormat="dd/MM/yyyy"
              className={`${inputClass} pl-10 cursor-pointer`}
              placeholderText="Select Date"
            />
            <Calendar className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Last Valid Date</label>
          <div className="relative">
            <DatePicker
              selected={form.lastValidDate ? new Date(form.lastValidDate) : null}
              // FIX 4: Use conversion helper
              onChange={(date) => setForm({ ...form, lastValidDate: date ? convertDateForSubmission(date) : "" })}
              dateFormat="dd/MM/yyyy"
              className={`${inputClass} pl-10 cursor-pointer`}
              placeholderText="Select Date"
              minDate={form.effectiveDate ? new Date(form.effectiveDate) : undefined}
            />
            <Calendar className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Day Pass</label>
          <input
            type="text"
            value={form.dayPass || ""}
            onChange={(e) => setForm({ ...form, dayPass: e.target.value })}
            className={inputClass}
            placeholder="e.g. 1 Day"
          />
        </div>

        <div className="col-span-2 space-y-3">
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Package Image</label>
          
          {imagePreviewUrl ? (
            <div className="flex items-center gap-4">
              <img 
                src={imagePreviewUrl} 
                alt="Package Preview" 
                className="w-32 h-32 object-cover rounded-md border border-border p-1 bg-muted" 
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-4 py-2 h-fit bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center gap-2 transition-colors"
              >
                <X size={16} />
                Remove Image
              </button>
            </div>
          ) : (
            <input
              ref={fileInputRef} 
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, imageID: e.target.files?.[0] || null })}
              className={`file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold 
                  file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 
                  dark:file:bg-indigo-500/20 dark:file:text-indigo-300 dark:hover:file:bg-indigo-500/30
                  ${inputClass}`}
                  />
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Remark</label>
          <textarea
            value={form.tpremark || ""}
            onChange={(e) => setForm({ ...form, tpremark: e.target.value })}
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="Add remarks (optional)"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PackageFormStep1;