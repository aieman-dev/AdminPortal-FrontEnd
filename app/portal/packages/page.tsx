// src/app/(main)/packages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import PackageFilters from "@/components/PackageFilters";
import PackageCard from "@/components/PackageCard";
import { packageService } from "@/services/package-services"; 
import { Package } from "@/type/packages"; 

interface PackageListItem {
  id: number;
  name: string;
  price: string;
  category: string;
  createdDate: string; 
  status: string;
  image: string;
  rawDate: Date; 
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PackagesPage() {
  const [activeFilter, setActiveFilter] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  
  const router = useRouter();

  // 1. Fetch Data
  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        const rawData = await packageService.getPackages(activeFilter);

        const formatted: PackageListItem[] = rawData.map((pkg: Package) => ({
          id: pkg.id,
          // Map new 'name' field, fallback to old 'PackageName'
          name: pkg.name || pkg.PackageName || "Untitled", 
          
          // Map new 'price' field, fallback to old 'totalPrice'
          price: (pkg.price !== undefined ? pkg.price : pkg.totalPrice ?? 0).toString(),
              
          // Map 'ageCategory' or 'packageType'
          category: pkg.ageCategory || pkg.packageType || pkg.PackageType || "N/A",
          
          createdDate: formatDate(pkg.createdDate),
          rawDate: new Date(pkg.createdDate || new Date().toISOString()), 
          status: pkg.status || "Draft",
          
          // Map new 'imageUrl', fallback to old 'imageID'
          image: pkg.imageUrl || pkg.imageID || "/packages/DefaultPackageImage.png",
        }));

        setPackages(formatted);
      } catch (error) {
        console.error("Error loading packages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, [activeFilter]);

  // 2. Handle Filter
  const handleDateFilter = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
  };

  // 3. Apply Filters (Search + Date)
  const visiblePackages = packages.filter((pkg) => {
    // Text Search
    const matchesSearch = pkg.name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Date Filter
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0); // Start of day

      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999); // End of day

      // Check if package date is within range
      matchesDate = pkg.rawDate >= start && pkg.rawDate <= end;
    }

    return matchesSearch && matchesDate;
  });

  const handlePackageClick = (id: number) => router.push(`/portal/packages/pdetails/${id}`);
  const handleEdit = (id: number) => router.push(`/portal/packages/${id}/edit`);
  const handleAddNew = () => router.push("/portal/packages/form");
  const handleDuplicate = (id: number) => console.log("Duplicate:", id);

  return (
    <div className="min-h-screen flex p-8 transition-colors duration-300 text-gray-900 dark:text-gray-100">
      <div className="w-full">
        <div className="rounded-lg shadow-sm border p-6 transition-colors duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Package Status
          </h2>

          <PackageFilters
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onDateFilter={handleDateFilter}
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
              <p>Loading packages...</p>
            </div>
          ) : visiblePackages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mt-4">
              {visiblePackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id ?? index}
                  id={pkg.id ?? index}
                  name={pkg.name} 
                  price={pkg.price}
                  category={pkg.category}
                  createdDate={pkg.createdDate} 
                  status={pkg.status}
                  image={pkg.image}
                  onClick={() => handlePackageClick(pkg.id)}
                  onDuplicate={() => handleDuplicate(pkg.id)}
                  onEdit={() => handleEdit(pkg.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-12 py-10 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              No packages found in <strong>{activeFilter}</strong> for this date range.
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleAddNew}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold transition-all hover:shadow-xl z-10"
      >
        <Plus size={20} />
        Add New
      </button>
    </div>
  );
}