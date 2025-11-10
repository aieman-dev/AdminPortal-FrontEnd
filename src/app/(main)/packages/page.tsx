// src/app/(main)/packages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PackageFilters from "@/components/PackageFilters";
import PackageCard from "@/components/PackageCard";
import { PackageFormData } from "@/type/packages";


interface PackageItem {
   id: number;
  title: string;
  price: string;
  category: string;
  dates: string;
  status: string;
  image: string;
  createdAt: string;
}

export default function PackagesPage() {
  const [activeFilter, setActiveFilter] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const router = useRouter();

  //  Load saved packages from localStorage on mount
 useEffect(() => {
  const loadPackages = () => {
    const saved = JSON.parse(localStorage.getItem("packages") || "[]");

  const formatted = saved.map((pkg: any) => ({
    id: pkg.id,
    title: pkg.title || pkg.name || "Untitled",
    price: pkg.price || "—",
    category: pkg.category || pkg.ageCategory || "N/A",
    dates:
      pkg.startDate && pkg.endDate
        ? `${pkg.startDate} - ${pkg.endDate}`
        : "—",
    status: pkg.status || "Draft",
    image: pkg.image || "/bg/DefaultPackageImage.png",
    createdAt: pkg.createdDate || new Date().toISOString(),
  }));

  setPackages(formatted);
  console.log("Loaded packages:", formatted);
};
 loadPackages();
  window.addEventListener("focus", loadPackages);
  return () => window.removeEventListener("focus", loadPackages);
}, []);

  //  Filter by status tab
  const filteredPackages = packages.filter((pkg) => {
    if (activeFilter === "Show All") return true;
    return pkg.status.toLowerCase() === activeFilter.toLowerCase();
  });

  //  Apply search filter
  const visiblePackages = filteredPackages.filter((pkg) =>
    pkg.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  //  Package actions
  const handlePackageClick = (id: number) => {
    console.log("Package clicked:", id);
    router.push(`/packages/pdetails/${id}`);
  };

  const handleDuplicate = (id: number) => {
    console.log("Duplicate package:", id);
  };

  const handleEdit = (id: number) => {
    console.log("Edit package:", id);
    router.push(`/packages/${id}/edit`);
  };

  const handleAddNew = () => {
    console.log("Add new package");
    router.push("/packages/form");
  };

  // 🖼️ Render
  return (
    <div className="min-h-screen flex p-8 transition-colors duration-300 text-gray-900 dark:text-gray-100">
      <div className="w-full">
        <div
          className="rounded-lg shadow-sm border p-6 transition-colors duration-300
                     bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Package Status
          </h2>

          <PackageFilters
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Package Cards */}
          {visiblePackages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mt-4">
              {visiblePackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id ?? index}
                  id={pkg.id ?? index}
                  title={pkg.title}
                  price={pkg.price || "RM —"}
                  category={pkg.category || "N/A"}
                  dates={pkg.dates || "—"}
                  status={pkg.status}
                  image={
                    pkg.image ||
                    "https://via.placeholder.com/400x300?text=No+Image"
                  }
                  onClick={() => handlePackageClick(pkg.id ?? index)}
                  onDuplicate={() => handleDuplicate(pkg.id ?? index)}
                  onEdit={() => handleEdit(pkg.id ?? index)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-6">
              No packages found under this category.
            </p>
          )}
        </div>
      </div>

      {/* Floating "Add New" button */}
      <button
        onClick={handleAddNew}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 
                   text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 
                   font-semibold transition-all hover:shadow-xl"
      >
        <Plus size={20} />
        Add New
      </button>
    </div>
  );
}
