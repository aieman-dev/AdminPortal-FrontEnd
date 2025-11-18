"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import PackageFilters from "@/components/PackageFilters";
import PackageCard from "@/components/PackageCard";
import { packageService } from "@/services/package-services"; 
import { Package } from "@/type/packages"; 
import { useAuth } from "@/hooks/use-auth";
import { canCreatePackage } from "@/lib/auth"; 

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
  const { user } = useAuth();
  
  // FIX 2: Use the helper function logic instead of hardcoding
  // This ensures IT_ADMIN, MIS_SUPERADMIN, and TP_ADMIN are all covered automatically
  const canCreate = canCreatePackage(user?.department);
  
  // Match backend default
  const ITEMS_PER_PAGE = 30; 
  
  const [activeFilter, setActiveFilter] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  
  const router = useRouter();

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        const startStr = dateRange.start ? dateRange.start.toISOString() : undefined;
        const endStr = dateRange.end ? dateRange.end.toISOString() : undefined;

        const { packages: rawData, totalPages: total, totalRecords: records } = await packageService.getPackages(
          activeFilter, 
          startStr, 
          endStr, 
          currentPage, 
          searchQuery
        );

        const formatted: PackageListItem[] = rawData.map((pkg: Package) => ({
          id: pkg.id,
          name: pkg.name || pkg.PackageName || "Untitled", 
          price: (pkg.price !== undefined ? pkg.price : pkg.totalPrice ?? 0).toString(),
          category: pkg.ageCategory || pkg.packageType || pkg.PackageType || "N/A",
          createdDate: formatDate(pkg.createdDate),
          rawDate: new Date(pkg.createdDate || new Date().toISOString()), 
          status: pkg.status || "Draft",
          image: pkg.imageUrl || pkg.imageID || "/packages/DefaultPackageImage.png",
        }));

        setPackages(formatted);
        setTotalPages(total);
        setTotalRecords(records);

      } catch (error) {
        console.error("Error loading packages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPackages();
    }, 500);

    return () => clearTimeout(timer);

  }, [activeFilter, currentPage, searchQuery, dateRange]); 

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleDateFilter = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    const target = Math.max(1, page);
    setCurrentPage(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePackageClick = (id: number) => {
    if (["Pending", "Draft", "Rejected"].includes(activeFilter)) {
      router.push(`/portal/packages/pdetails/${id}?source=pending`);
    } else {
      router.push(`/portal/packages/pdetails/${id}`);
    }
  };

  const handleEdit = (id: number) => router.push(`/portal/packages/${id}/edit`);
  const handleAddNew = () => router.push("/portal/packages/form");
  const handleDuplicate = (id: number) => console.log("Duplicate:", id);

  // Original Page Numbers Logic
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen flex p-8 transition-colors duration-300 text-foreground">
      <div className="w-full">
        <div className="rounded-lg shadow-sm border p-6 transition-colors duration-300 bg-card border-border text-card-foreground">
          <h2 className="text-xl font-bold mb-6">
            Package Status
          </h2>

          <PackageFilters
            activeFilter={activeFilter}
            setActiveFilter={handleFilterChange}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            onDateFilter={handleDateFilter}
            userDepartment={user?.department}
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
              <p>Loading packages...</p>
            </div>
          ) : packages.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground mt-4 mb-2">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalRecords || packages.length)} of {totalRecords || 'many'} packages
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mt-4">
                {packages.map((pkg, index) => (
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

              {(totalPages > 1 || packages.length === ITEMS_PER_PAGE) && (
                <div className="mt-8 flex items-center justify-between bg-muted/50 rounded-lg px-6 py-4 border border-border">
                  <div className="text-sm text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{currentPage}</span>
                    {totalPages > 1 && currentPage <= totalPages && (
                      <> of <span className="font-semibold text-foreground">{totalPages}</span></>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronsLeft className="w-5 h-5" />
                    </button>
                    
                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="hidden sm:flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-muted-foreground">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => goToPage(page as number)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              currentPage === page 
                                ? 'bg-primary text-primary-foreground' 
                                : 'border border-input hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>
                    
                    <button onClick={() => goToPage(currentPage + 1)} disabled={packages.length < ITEMS_PER_PAGE} className="p-2 rounded-lg border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronsRight className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Items per page: <span className="font-semibold text-foreground">{ITEMS_PER_PAGE}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground mt-12 py-10 bg-muted/30 rounded-lg border border-border border-dashed">
              No packages found in <strong>{activeFilter}</strong>.
            </p>
          )}
        </div>
      </div>

      {/* Add New Button - Only shown if user has permission */}
      {canCreate && (
        <button
          onClick={handleAddNew}
          className="fixed bottom-8 right-8  bg-indigo-500 hover:bg-indigo-600 dark:bg-white dark:hover:bg-gray-200 text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold transition-all hover:shadow-xl z-10"
        >
          <Plus size={20} />
          Add New
        </button>
      )}
    </div>
  );
}