// components/PackageFormStep1.tsx
import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PackageFormData } from "../type/packages";

type Props = {
  form: PackageFormData;
  setForm: (f: PackageFormData | ((prev: PackageFormData) => PackageFormData)) => void;
  onNext: () => void;
};

const PackageFormStep1: React.FC<Props> = ({ form, setForm, onNext }) => {
  const [ageOptions, setAgeOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingAges, setLoadingAges] = useState(false);

  // 1. Fetch Dynamic Age Categories
  useEffect(() => {
    const fetchCreationData = async () => {
      setLoadingAges(true);
      try {
        const res = await fetch("/api/proxy-create-package/creationdata");
        if (res.ok) {
          const data = await res.json();
          // Adjust this mapping based on the exact structure of /creationdata response
          // Assuming data is an array or has an ageCategories property
          const categories = Array.isArray(data) ? data : data.ageCategories || [];
          
          setAgeOptions(categories.map((c: any) => ({
            value: c.code || c.name || c, // Fallback depending on API structure
            label: c.name || c.displayText || c
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

  return (
    <div className="flex-1">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">1. Package Details</h2>
      <div className="border-b border-gray-300 mb-6" />

      <div className="grid grid-cols-2 gap-8">
        {/* Package Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
          <input
            type="text"
            value={form.packageName}
            onChange={(e) => setForm({ ...form, packageName: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Enter package name"
          />
        </div>

        {/* Package Type (Price vs Point) - Affects Step 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
          <select
            value={form.packageType}
            onChange={(e) => setForm({ ...form, packageType: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select Type</option>
            <option value="Price">Price</option>
            <option value="Point">Point</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">This determines if items use RM or Points.</p>
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
          <select
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select Nationality</option>
            <option value="Malaysian">Malaysian</option>
            <option value="Non-Malaysian">Non-Malaysian</option>
          </select>
        </div>

        {/* Dynamic Age Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age Category</label>
          <select
            value={form.ageCategory}
            onChange={(e) => setForm({ ...form, ageCategory: e.target.value })}
            disabled={loadingAges}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
          >
            <option value="">{loadingAges ? "Loading..." : "Select Age Category"}</option>
            {ageOptions.map((opt, idx) => (
              <option key={idx} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Effective Date - Clickable Calendar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
          <div className="relative">
            <DatePicker
              selected={form.effectiveDate ? new Date(form.effectiveDate) : null}
              onChange={(date) => setForm({ ...form, effectiveDate: date ? date.toISOString() : "" })}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              placeholderText="Select Date"
            />
            <Calendar className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Last Valid Date - Clickable Calendar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Valid Date</label>
          <div className="relative">
            <DatePicker
              selected={form.lastValidDate ? new Date(form.lastValidDate) : null}
              onChange={(date) => setForm({ ...form, lastValidDate: date ? date.toISOString() : "" })}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              placeholderText="Select Date"
              minDate={form.effectiveDate ? new Date(form.effectiveDate) : undefined}
            />
            <Calendar className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Day Pass */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Day Pass</label>
          <input
            type="text"
            value={form.dayPass || ""}
            onChange={(e) => setForm({ ...form, dayPass: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g. 1 Day"
          />
        </div>

        {/* Image Upload */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, imageID: e.target.files?.[0] || null })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {/* Remarks */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
          <textarea
            value={form.tpremark || ""}
            onChange={(e) => setForm({ ...form, tpremark: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
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