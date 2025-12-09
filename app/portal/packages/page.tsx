"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, AlertTriangle } from "lucide-react";
import PackageFilters from "@/components/PackageFilters";
import PackageCard from "@/components/PackageCard";
import { packageService } from "@/services/package-services"; 
import { Package } from "@/type/packages"; 
import { useAuth } from "@/hooks/use-auth";
import { canCreatePackage } from "@/lib/auth"; 
import { BACKEND_API_BASE } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PackageListItem {
  id: number;
  name: string;
  price: string;
  category: string; 
  ageDescription?: string;
  packageType: string;
  nationality: string;
  status: string;
  image: string;
  effectiveDate: string | undefined;
  lastValidDate: string | undefined;
  createdDate: string | undefined; 
}

const formatShortDate = (dateString: string | undefined) => {
  if (!dateString) return "—";
  const date = new Date(dateString.split('T')[0]);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const IMAGE_ASSET_API_PATH = "api/Package/image-asset?id=";

function getProxiedImageUrl(url: string | null | undefined): string {
  const DEFAULT_IMAGE = "/packages/DefaultPackageImage.png";
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith("blob:") || url.startsWith("/packages/")) return url;
  
  let targetUrl = url;
  if (url.startsWith(BACKEND_API_BASE) || url.startsWith("http://")) {
    targetUrl = url;
  } else if (url.startsWith("/")) {
    targetUrl = `${BACKEND_API_BASE}${url}`;
  } else if (url.length > 0 && !url.includes('/')) {
    targetUrl = `${BACKEND_API_BASE}/${IMAGE_ASSET_API_PATH}${url}`;
  } else {
      return DEFAULT_IMAGE;
  }
  
  if (targetUrl.startsWith(BACKEND_API_BASE) || targetUrl.startsWith("http://")) {
    return `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
  }
  return DEFAULT_IMAGE; 
}

export default function PackagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const defaultFilter = "Pending";
  const canCreate = canCreatePackage(user?.department);
  const ITEMS_PER_PAGE = 30; 
  
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageTypeFilter, setPackageTypeFilter] = useState("All"); 
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPackageIds, setSelectedPackageIds] = useState<Set<number>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSelectedPackageIds(new Set());
  }, [activeFilter]);

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
          searchQuery,
          packageTypeFilter 
        );

        const formatted: PackageListItem[] = rawData.map((pkg: Package) => {
            const pType = (pkg.packageType || pkg.PackageType || 'Entry');
            const isPoint = pType.toLowerCase().includes('point') && !pType.toLowerCase().includes('reward');
            const finalPrice = isPoint
                ? (pkg.point ?? 0) 
                : (pkg.price ?? pkg.totalPrice ?? 0); 
            
            return ({
              id: pkg.id,
              name: pkg.name || pkg.PackageName || "Untitled", 
              price: finalPrice.toString(), 
              category: pkg.ageCategory || "N/A",
              ageDescription: pkg.ageDescription,
              packageType: pType,
              createdDate: pkg.createdDate,
              nationality: pkg.nationality || "N/A",
              effectiveDate: pkg.effectiveDate,
              lastValidDate: pkg.lastValidDate,
              status: pkg.status || "Draft",
              image: getProxiedImageUrl(pkg.imageUrl || pkg.imageID),
            });
        });

        setPackages(formatted);
        setTotalPages(total);
        setTotalRecords(records);

      } catch (error) {
        console.error("Error loading packages:", error);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPackages();
    }, 500);
    return () => clearTimeout(timer);
  }, [activeFilter, currentPage, searchQuery, dateRange, packageTypeFilter]); 

  const handleFilterChange = (filter: string) => { setActiveFilter(filter); setCurrentPage(1); };
  const handleSearchChange = (query: string) => { setSearchQuery(query); setCurrentPage(1); };
  const handleDateFilter = (start: Date | null, end: Date | null) => { setDateRange({ start, end }); setCurrentPage(1); };
  const goToPage = (page: number) => { setCurrentPage(Math.max(1, page)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handlePackageClick = (id: number) => {
    const pendingStatuses = ["Pending", "Draft", "Rejected"];
    if (pendingStatuses.includes(activeFilter)) {
        router.push(`/portal/packages/pdetails/requests/${id}`);
    } else {
        router.push(`/portal/packages/pdetails/package/${id}`);
    }
  };

  const handleEdit = (id: number) => router.push(`/portal/packages/form?id=${id}`);
  const handleAddNew = () => router.push("/portal/packages/form");
  
  const handleDuplicate = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await packageService.duplicatePackage(id);
      toast({ title: "Package Duplicated", description: `New ID: ${response.newPackageId}. Status: Draft.` });
      setActiveFilter("Draft");
    } catch (error) {
      toast({ title: "Duplication Failed", description: error instanceof Error ? error.message : "Failed to duplicate.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  // --- UPDATED: Use Bulk Delete API for Single Delete ---
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
        // FIX: Use bulkDeletePackages with a single ID array instead of updateStatus
        await packageService.bulkDeletePackages([deleteId]); 
        
        toast({ 
            title: "Draft Deleted", 
            description: `Package ID ${deleteId} has been removed successfully.` 
        });
        
        fetchPackages(); 
    } catch (error) {
        toast({ title: "Deletion Failed", description: "Failed to delete package.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setDeleteId(null);
    }
  };

  const handleSelectPackage = (id: number, checked: boolean) => {
      const newSet = new Set(selectedPackageIds);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      setSelectedPackageIds(newSet);
  };

  const handleSelectAll = () => {
      if (selectedPackageIds.size === packages.length) {
          setSelectedPackageIds(new Set()); 
      } else {
          const allIds = new Set(packages.map(p => p.id));
          setSelectedPackageIds(allIds);
      }
  };

  const handleBulkDelete = async () => {
      if (selectedPackageIds.size === 0) return;
      if (!window.confirm(`Are you sure you want to delete ${selectedPackageIds.size} draft packages?`)) return;

      setIsBulkDeleting(true);
      try {
          const ids = Array.from(selectedPackageIds);
          await packageService.bulkDeletePackages(ids);
          toast({ title: "Bulk Delete Success", description: `${ids.length} packages deleted.` });
          setSelectedPackageIds(new Set());
          fetchPackages(); 
      } catch (error) {
          toast({ title: "Bulk Delete Failed", description: "Some packages could not be deleted.", variant: "destructive" });
      } finally {
          setIsBulkDeleting(false);
      }
  };

  const isDraftTab = activeFilter === "Draft";

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
        <div className="rounded-lg shadow-sm border p-6 bg-card border-border text-card-foreground">
          <h2 className="text-xl font-bold mb-6">Package Status</h2>

          <PackageFilters
            activeFilter={activeFilter}
            setActiveFilter={handleFilterChange}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            onDateFilter={handleDateFilter}
            userDepartment={user?.department}
            packageTypeFilter={packageTypeFilter}
            setPackageTypeFilter={setPackageTypeFilter}
          />

          {isDraftTab && packages.length > 0 && (
              <div className="flex items-center gap-4 mb-4 bg-muted/30 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4"
                        checked={selectedPackageIds.size === packages.length && packages.length > 0}
                        onChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium">Select All</span>
                  </div>
                  {selectedPackageIds.size > 0 && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleBulkDelete} 
                        disabled={isBulkDeleting}
                        className="ml-auto"
                      >
                        {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Trash2 className="w-4 h-4 mr-2"/>}
                        Delete Selected ({selectedPackageIds.size})
                      </Button>
                  )}
              </div>
          )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mt-4">
                {packages.map((pkg, index) => (
                  <PackageCard
                    key={pkg.id ?? index}
                    id={pkg.id ?? index}
                    name={pkg.name} 
                    price={pkg.price}
                    category={pkg.category || "N/A"}
                    description={pkg.ageDescription}
                    packageType={pkg.packageType}
                    dateDisplay={formatShortDate(pkg.createdDate)} 
                    nationality={pkg.nationality}
                    status={pkg.status}
                    image={pkg.image}
                    isSelectable={isDraftTab}
                    isSelected={selectedPackageIds.has(pkg.id)}
                    onSelectChange={(checked) => handleSelectPackage(pkg.id, checked)}
                    onClick={() => handlePackageClick(pkg.id)}
                    onDuplicate={() => handleDuplicate(pkg.id)}
                    onEdit={() => handleEdit(pkg.id)}
                    onDelete={() => handleDeleteClick(pkg.id)}
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

      {canCreate && (
        <button
          onClick={handleAddNew}
          className="fixed bottom-8 right-8 bg-indigo-500 hover:bg-indigo-600 dark:bg-white dark:hover:bg-gray-200 text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold transition-all hover:shadow-xl z-10"
        >
          <Plus size={20} />
          Add New
        </button>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this package? <br/>
              <span className="font-semibold text-foreground">Package ID: {deleteId}</span>
              <br/><br/>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleConfirmDelete} 
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Package"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}