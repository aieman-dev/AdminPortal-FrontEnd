// components/PackageFormStep1.tsx
import React from "react";
import { PackageFormData } from "../type/packages";

type Props = {
  form: PackageFormData;
  setForm: (
    f: PackageFormData | ((prev: PackageFormData) => PackageFormData)
  ) => void;
  onNext: () => void;
};

const PackageFormStep1: React.FC<Props> = ({ form, setForm, onNext }) => {
  return (
    <div className="flex-1">
      {/* Form card */}
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          1. Package Details
        </h2>
        <div className="border-b border-gray-300 mb-6" />

        <div className="grid grid-cols-2 gap-8">
          {/* Package Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Name
            </label>
            <input
              type="text"
              value={form.packageName}
              onChange={(e) => setForm({ ...form, packageName: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter package name"
            />
          </div>

          {/* Package Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Type
            </label>
            <select
              value={form.packageType}
              onChange={(e) =>
                setForm({ ...form, packageType: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Type</option>
              <option value="Standard">Standard</option>
              <option value="VIP">VIP</option>
              <option value="Family">Family</option>
            </select>
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nationality
            </label>
            <select
              value={form.nationality}
              onChange={(e) =>
                setForm({ ...form, nationality: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Nationality</option>
              <option value="Malaysian">Malaysian</option>
              <option value="Foreigner">Foreigner</option>
            </select>
          </div>

          {/* Age Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age Category
            </label>
            <select
              value={form.ageCategory}
              onChange={(e) =>
                setForm({ ...form, ageCategory: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Age Category</option>
              <option value="Child">Child</option>
              <option value="Adult">Adult</option>
              <option value="Senior">Senior</option>
            </select>
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date
            </label>
            <input
              type="date"
              value={form.effectiveDate}
              onChange={(e) =>
                setForm({ ...form, effectiveDate: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Last Valid Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Valid Date
            </label>
            <input
              type="date"
              value={form.lastValidDate}
              onChange={(e) =>
                setForm({ ...form, lastValidDate: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Day Pass */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day Pass
            </label>
            <input
              type="number"
              min={1}
              value={form.dayPass || ""}
              onChange={(e) =>
                setForm({ ...form, dayPass:e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter number of days"
            />
          </div>

          {/* Package Image */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, imageID: e.target.files?.[0] || null })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {form.imageID && typeof form.imageID !== "string" && (
              <p className="text-sm text-gray-500 mt-1">{form.imageID.name}</p>
            )}
          </div>

          {/* TP Remark */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remark
            </label>
            <textarea
              value={form.tpremark || ""}
              onChange={(e) =>
                setForm({ ...form, tpremark: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Add remarks (optional)"
            />
          </div>
        </div>

        {/* Next Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onNext}
            className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Next
          </button>
        </div>
    </div>    
  );
};

export default PackageFormStep1;
