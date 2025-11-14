import React, { useEffect, useState, useRef } from "react";
// + ADDED: X as an icon for a remove button
import { Calendar, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PackageFormData } from "../type/packages";
import { getAuthToken } from "@/services/package-services";

type Props = {
  form: PackageFormData;
  setForm: (f: PackageFormData | ((prev: PackageFormData) => PackageFormData)) => void;
  onNext: () => void;
};

const PackageFormStep1: React.FC<Props> = ({ form, setForm, onNext }) => {
  const [ageOptions, setAgeOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingAges, setLoadingAges] = useState(false);
  
  // + ADDED: State for the image preview URL
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  // + ADDED: Ref to control the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Dynamic Age Categories (Token added)
  useEffect(() => {
    const fetchCreationData = async () => {
      setLoadingAges(true);
      try {
        const authToken = getAuthToken();
        const res = await fetch("/api/proxy-create-package/creationdata", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authToken
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          const categories = data.ageCategories || [];
          setAgeOptions(categories.map((c: any) => ({
            value: c.ageCode,
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

  // + ADDED: 2. Create/Revoke Image Preview URL
  useEffect(() => {
    let objectUrl: string | null = null;
    
    // Create a new URL if a file is selected
    if (form.imageID && form.imageID instanceof File) {
      objectUrl = URL.createObjectURL(form.imageID);
      setImagePreviewUrl(objectUrl);
    } else {
      // Clear preview if imageID is null (e.g., removed)
      setImagePreviewUrl(null);
    }

    // Cleanup function: Revoke the URL on unmount or file change
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [form.imageID]); // This effect runs when 'form.imageID' changes

  // + ADDED: 3. Handler to remove the image
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop click from propagating
    
    // Clear the form state
    setForm(prev => ({ ...prev, imageID: null }));
    
    // Clear the file input element itself
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">1. Package Details</h2>
      <div className="border-b border-gray-300 mb-6 scrollbar-hide" />

      <div className="grid grid-cols-2 gap-8">
        {/* Package Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
          <input
            type="text"
            value={form.packageName}
            onChange={(e) => setForm({ ...form, packageName: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-500"
            placeholder="Enter package name"
          />
        </div>

        {/* Package Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
          <select
            value={form.packageType}
            onChange={(e) => setForm({ ...form, packageType: e.target.value })}
            className={`w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none ${
              form.packageType ? 'text-gray-900' : 'text-gray-500'
            }`}
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
            className={`w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none ${
              form.nationality ? 'text-gray-900' : 'text-gray-500'
            }`}
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
            className={`w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 ${
              form.ageCategory ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            <option value="">{loadingAges ? "Loading..." : "Select Age Category"}</option>
            {ageOptions.map((opt, idx) => (
              <option key={idx} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Effective Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
          <div className="relative">
            <DatePicker
              selected={form.effectiveDate ? new Date(form.effectiveDate) : null}
              onChange={(date) => setForm({ ...form, effectiveDate: date ? date.toISOString() : "" })}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer placeholder:text-gray-500"
              placeholderText="Select Date"
            />
            <Calendar className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Last Valid Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Valid Date</label>
          <div className="relative">
            <DatePicker
              selected={form.lastValidDate ? new Date(form.lastValidDate) : null}
              onChange={(date) => setForm({ ...form, lastValidDate: date ? date.toISOString() : "" })}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer placeholder:text-gray-500"
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-500"
            placeholder="e.g. 1 Day"
          />
        </div>

        {/* + MODIFIED: Image Upload Section */}
        <div className="col-span-2 space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Image</label>
          
          {/* 1. Show Preview & Remove Button IF image is selected */}
          {imagePreviewUrl ? (
            <div className="flex items-center gap-4">
              <img 
                src={imagePreviewUrl} 
                alt="Package Preview" 
                className="w-32 h-32 object-cover rounded-md border p-1 bg-gray-100" 
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-4 py-2 h-fit bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 flex items-center gap-2"
              >
                <X size={16} />
                Remove Image
              </button>
            </div>
          ) : (
            // 2. Show File Input IF no image is selected
            <input
              ref={fileInputRef} 
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, imageID: e.target.files?.[0] || null })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          )}
        </div>

        {/* Remarks */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
          <textarea
            value={form.tpremark || ""}
            onChange={(e) => setForm({ ...form, tpremark: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder:text-gray-500"
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