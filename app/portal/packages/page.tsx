"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, PackageX, Send, Loader2 } from "lucide-react"; 
import PackageFilters from "@/components/modules/packages/PackageFilters";
import { ConfirmationModal } from '@/components/modules/packages/PackageModals';
import PackageCard from "@/components/modules/packages/PackageCard";
import { packageService } from "@/services/package-services"; 
import { Package } from "@/type/packages"; 
import { useAuth } from "@/hooks/use-auth";
import { canCreatePackage } from "@/lib/auth"; 
import { getProxiedImageUrl } from "@/lib/utils"; 
import { formatDate } from "@/lib/formatter";
import { useAppToast } from "@/hooks/use-app-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button"; 
import { EmptyState } from "@/components/portal/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ModuleErrorBoundary } from "@/components/portal/module-error-boundary";

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

// 1. Define types for our dynamic action state
type ActionType = 'SUBMIT' | 'DELETE' | null;

const PackageSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mt-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col bg-card rounded-xl border p-0 overflow-hidden h-[300px]">
          <Skeleton className="h-32 w-full rounded-none" />
          <div className="p-3 flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="mt-auto border-t pt-2 flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

export default function PackagesPage() {
  const { user } = useAuth();
  const toast = useAppToast();
  const router = useRouter();

  const defaultFilter = "Pending";
  const canCreate = canCreatePackage(user?.department);
  const ITEMS_PER_PAGE = 30; 
  
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 500);

  const [packageTypeFilter, setPackageTypeFilter] = useState("All"); 
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPackageIds, setSelectedPackageIds] = useState<Set<number>>(new Set());
  
  // 2. CONSOLIDATED ACTION STATE
  // If targetId is set, it's a Single action. If targetId is null, it's a Bulk action.
  const [actionState, setActionState] = useState<{
    type: ActionType;
    targetId: number | null; 
    isOpen: boolean;
  }>({ type: null, targetId: null, isOpen: false });

  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  useEffect(() => {
    setSelectedPackageIds(new Set());
  }, [activeFilter]);

  const fetchPackages = useCallback(async () => {
      setIsLoading(true);
      setPackages([]);
      try {
        const startStr = dateRange.start ? dateRange.start.toISOString() : undefined;
        const endStr = dateRange.end ? dateRange.end.toISOString() : undefined;

        const { packages: rawData, totalPages: total, totalRecords: records } = await packageService.getPackages(
          activeFilter, startStr, endStr, currentPage, searchQuery, packageTypeFilter 
        );

        const formatted: PackageListItem[] = rawData.map((pkg: Package) => {
            const pType = (pkg.packageType || 'Entry');
            const isPoint = pType.toLowerCase().includes('point') && !pType.toLowerCase().includes('reward');
            const finalPrice = isPoint ? (pkg.point ?? 0) : (pkg.price ?? 0); 
            
            return ({
              id: pkg.id,
              name: pkg.name || "Untitled", 
              price: finalPrice.toString(), 
              category: pkg.ageCategory || "N/A",
              ageDescription: pkg.ageDescription,
              packageType: pType,
              createdDate: pkg.createdDate,
              nationality: pkg.nationality || "N/A",
              effectiveDate: pkg.effectiveDate,
              lastValidDate: pkg.lastValidDate,
              status: pkg.status || "Draft",
              image: getProxiedImageUrl(pkg.imageUrl),
            });
        });

        setPackages(formatted);
        setTotalPages(total);
        setTotalRecords(records);
      } catch (error) {
        toast.error("Error", "Failed to load packages.")
      } finally {
        setIsLoading(false);
      }
  }, [activeFilter, currentPage, debouncedSearch, dateRange, packageTypeFilter]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleFilterChange = (filter: string) => { setActiveFilter(filter); setCurrentPage(1); };
  const handleSearchChange = (query: string) => { setSearchQuery(query); setCurrentPage(1); };
  const handleDateFilter = (start: Date | null, end: Date | null) => { setDateRange({ start, end }); setCurrentPage(1); };
  
  const goToPage = (page: number) => { 
      setCurrentPage(Math.max(1, page)); 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

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
      toast.info("Package Duplicated", `New ID: ${response.newPackageId}. Status: Draft.` );
      setActiveFilter("Draft");
    } catch (error) {
      toast.error( "Duplication Failed", "Failed to duplicate.");
    } finally {
      setIsLoading(false);
    }
  }

  // --- 3. DYNAMIC HANDLERS (Open the Modal) ---

  // Triggered by Single Buttons
  const openSingleSubmit = (id: number) => setActionState({ type: 'SUBMIT', targetId: id, isOpen: true });
  const openSingleDelete = (id: number) => setActionState({ type: 'DELETE', targetId: id, isOpen: true });

  // Triggered by Bulk Buttons
  const openBulkSubmit = () => {
    if (selectedPackageIds.size === 0) return;
    setActionState({ type: 'SUBMIT', targetId: null, isOpen: true });
  };
  const openBulkDelete = () => {
    if (selectedPackageIds.size === 0) return;
    setActionState({ type: 'DELETE', targetId: null, isOpen: true });
  };

  // --- 4. UNIFIED EXECUTION LOGIC ---
  const executeAction = async () => {
    // Close modal immediately or keep open with loader. Let's close it.
    setActionState(prev => ({ ...prev, isOpen: false }));
    setIsProcessing(true);

    const { type, targetId } = actionState;
    
    // Determine IDs: If targetId exists, it's single. Else, it's bulk.
    const ids = targetId ? [targetId] : Array.from(selectedPackageIds);
    const count = ids.length;

    try {
        if (type === 'SUBMIT') {
            await packageService.submitDraft(ids);
            toast.success( "Submitted", `${count} package(s) submitted successfully.`);
        } 
        else if (type === 'DELETE') {
            await packageService.bulkDeletePackages(ids);
            toast.info( "Deleted", `${count} package(s) deleted successfully.`);
        }

        fetchPackages();
        if (!targetId) setSelectedPackageIds(new Set());
        
    } catch (error : any) {
        console.log("Submit Error Debug:", error); 
        const cleanMessage = error.message || "An unexpected error occurred.";
        const lowerCaseError = cleanMessage.toLowerCase();

        if (
            lowerCaseError.includes("expired") || 
            lowerCaseError.includes("last valid date") || 
            lowerCaseError.includes("not 'draft'")
        ) {
            toast.error( "Unable to Submit", 
                 "Some packages could not be submitted because their 'Last Valid Date' has passed. Please update the dates to a future time and try again.");
        } else {
            toast.error( "Operation Failed", cleanMessage);
        }
        
        console.error("Action Error:", error);
    } finally {
        setIsProcessing(false);
        setActionState({ type: null, targetId: null, isOpen: false });
    }
  };

  // --- 5. DYNAMIC MODAL TEXT HELPER ---
  const getModalContent = () => {
    const isSingle = actionState.targetId !== null;
    const count = isSingle ? 1 : selectedPackageIds.size;
    
    if (actionState.type === 'SUBMIT') {
        return {
            title: "Submit for Approval?",
            description: (
              <>
                <p>Upon submission, the package will be forwarded for review.</p>
                <p className="text-sm text-gray-500 mt-2">(Further edits will not be allowed after submission.)</p>
                {!isSingle && <p className="mt-2 font-semibold">Total Packages: {count}</p>}
              </>
            ),
            variant: "default" as const, // Blue
            confirmLabel: "Yes, Submit",
            cancelLabel: "Cancel"
        };
    }
    
    if (actionState.type === 'DELETE') {
        return {
            title: "Delete Package?",
            description: (
              <>
                <p>Are you sure you want to delete {isSingle ? "this package" : <b>{count} packages</b>}?</p>
                <p className="text-sm text-red-500 mt-2">This action cannot be undone.</p>
              </>
            ),
            variant: "destructive" as const, // Red
            confirmLabel: "Yes, Delete",
            cancelLabel: "No, Keep"
        };
    }
    return { title: "", description: "" };
  };

  const modalContent = getModalContent();

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

  const isDraftTab = activeFilter === "Draft";

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
                      <div className="ml-auto flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={openBulkSubmit} 
                            disabled={isProcessing}
                            className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                          >
                            {isProcessing && actionState.type === 'SUBMIT' ? (
                                // 1. Loading State: Spinning Icon only
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                // 2. Normal State: Send Icon
                                <Send className="w-4 h-4 mr-2"/>
                            )}
                            Submit Selected ({selectedPackageIds.size})
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={openBulkDelete} 
                            disabled={isProcessing}
                          >
                            {isProcessing && actionState.type === 'DELETE' ? (
                                  // 1. Loading State: Spinning Icon only
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                  // 2. Normal State: Trash Icon
                                  <Trash2 className="w-4 h-4 mr-2"/>
                              )}
                              Delete Selected ({selectedPackageIds.size})
                            </Button>
                      </div>
                  )}
              </div>
          )}

          {isLoading ? (
            <PackageSkeletons />
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
                    dateDisplay={formatDate(pkg.createdDate)} 
                    nationality={pkg.nationality}
                    status={pkg.status}
                    image={pkg.image}
                    isSelectable={isDraftTab}
                    isSelected={selectedPackageIds.has(pkg.id)}
                    onSelectChange={(checked) => handleSelectPackage(pkg.id, checked)}
                    onClick={() => handlePackageClick(pkg.id)}
                    onDuplicate={() => handleDuplicate(pkg.id)}
                    onEdit={() => handleEdit(pkg.id)}
                    onDelete={() => openSingleDelete(pkg.id)}
                    onSubmit={() => openSingleSubmit(pkg.id)}
                  />
                ))}
              </div>
              
               <PaginationControls 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalRecords}
                  pageSize={ITEMS_PER_PAGE}
                  onPageChange={goToPage}
               />
            </>
          ) : (
            <div className="h-80 flex items-center justify-center border border-dashed rounded-lg bg-muted/30 mt-6">
                <EmptyState 
                    icon={PackageX} 
                    title="No packages found" 
                    description="Try adjusting your filters or search query." 
                />
            </div>
          )}
        </div>
      </div>

      {canCreate && (
        <button
          onClick={handleAddNew}
          className="fixed bottom-8 right-8 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold transition-all hover:shadow-xl z-10"
        >
          <Plus size={20} />
          Add New
        </button>
      )}

      {/* 7. ONE DYNAMIC MODAL FOR ALL ACTIONS */}
      <ConfirmationModal
        isOpen={actionState.isOpen}
        onConfirm={executeAction}
        onCancel={() => setActionState(prev => ({ ...prev, isOpen: false }))}
        
        title={modalContent.title}
        description={modalContent.description}
        variant={modalContent.variant}
        confirmLabel={modalContent.confirmLabel}
        cancelLabel={modalContent.cancelLabel}
      />

    </div>
  );
}