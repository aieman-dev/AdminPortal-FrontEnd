"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DatePicker } from "@/components/ui/date-picker";
import { Pencil, PackageX } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { type TableColumn, DataTable } from "@/components/shared-components/data-table"
import { ItPoswfPackage } from "@/type/themepark-support"
import { packageService } from "@/services/package-services"
import { formatCurrency, formatDateTime } from "@/lib/formatter";
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { usePagination } from "@/hooks/use-pagination"
import { SearchField } from "@/components/shared-components/search-field"
import { useIsMobile } from "@/hooks/use-mobile"
import { logger } from "@/lib/logger"

export default function PackageListingTab() {
  const toast = useAppToast()
  const isMobile = useIsMobile()

  const [packageSearchTerm, setPackageSearchTerm] = useState("")
  const [packages, setPackages] = useState<ItPoswfPackage[]>([])
  const [isPackageSearching, setIsPackageSearching] = useState(false)
  
  // Pagination State
  const pagination = usePagination({ pageSize: 30 });

  // Edit State
  const [editingPackage, setEditingPackage] = useState<ItPoswfPackage | null>(null)
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false)
  const [isPackageUpdating, setIsPackageUpdating] = useState(false)
  const [packageRemark, setPackageRemark] = useState("")


  const handlePackageSearch = (query?: string) => {
      const safeQuery = typeof query === "string" ? query : undefined;
      const term = safeQuery !== undefined ? safeQuery : packageSearchTerm;
      if(safeQuery !== undefined) setPackageSearchTerm(safeQuery);
      pagination.setCurrentPage(1); 
      fetchData(1, term);
  }

  useAutoSearch(handlePackageSearch);

  const fetchData = async (page: number, term: string = packageSearchTerm) => {
    setIsPackageSearching(true)

    if (page !== pagination.currentPage) pagination.setCurrentPage(page);

    try {
        const { packages: livePackages, totalPages, totalRecords } = await packageService.getPackagesListing(
            term.trim(),
            page 
        );
        
        setPackages(livePackages);
        pagination.setMetaData(totalPages, totalRecords);
        
        if (page === 1 && livePackages.length > 0) {
            toast.info( "Search Complete", `Found ${totalRecords} packages.` );
        }
    } catch (error) {
        logger.error("Package Search Error:", { error });
        toast.error("Error",  "Failed to fetch package data.");
        setPackages([]);
    } finally {
        setIsPackageSearching(false)
    }
  };

  const handlePackageEdit = (pkg: ItPoswfPackage) => {
    setEditingPackage({ ...pkg })
    setPackageRemark("")
    setIsPackageDialogOpen(true)
  }

  const handlePackageUpdate = async () => {
    if (!editingPackage) return
    setIsPackageUpdating(true)
    try {
        await packageService.updatePackagesExtend(
            editingPackage.packageId,
            editingPackage.lastValidDate,
            packageRemark
        );
        
        const updatedPackages = packages.map((p) =>
            p.id === editingPackage.id
                ? { ...editingPackage, modifiedDate: new Date().toISOString() }
                : p,
        );
        setPackages(updatedPackages)
        setIsPackageDialogOpen(false)
        setEditingPackage(null)
        
        toast.success( "Success",  "Package updated successfully.");
    } catch (error) {
        toast.error( "Update Failed", "An error occurred.");
    } finally {
        setIsPackageUpdating(false);
    }
  }

  useEffect(() => {
    const handleTabRefresh = () => {
        handlePackageSearch(packageSearchTerm);
    };

    window.addEventListener('refresh-active-tab', handleTabRefresh);
    return () => window.removeEventListener('refresh-active-tab', handleTabRefresh);
  }, [packageSearchTerm]);
  

  const packageColumns: TableColumn<ItPoswfPackage>[] = useMemo (() =>[
    { header: "Package ID", accessor: "packageId", className: "pl-6", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Package Name", accessor: "packageName" },
    { header: "Type", accessor: "packageType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Price", accessor: "price", cell: (value) => formatCurrency(value) },
    { header: "Last Valid Date", accessor: "lastValidDate", cell: (value) => formatDateTime(value as string) },
    { header: "Description", accessor: "description", cell: (value) => <div className="max-w-xs truncate" title={value as string}>{value}</div> },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value as string} /> },
    {
      header: "Action",
      accessor: "id",
      cell: (_: any, row: ItPoswfPackage) => (
        <Button variant="ghost" size="sm" onClick={() => handlePackageEdit(row)}>
          <Pencil className="h-4 w-4 mr-2" /> Edit
        </Button>
      ),
    },
  ], []);


  // Shared form content for both Dialog and Sheet
  const editFormContent = editingPackage && (
    <div className="space-y-4 py-4 px-6 flex-1 overflow-y-auto scrollbar-hide">
      <div className="space-y-2">
        <Label htmlFor="edit-last-valid-date">Last Valid Date</Label>
        <DatePicker
            date={editingPackage.lastValidDate !== "N/A" ? new Date(editingPackage.lastValidDate) : undefined}
            setDate={(date) => {
                if (date) {
                     const offset = date.getTimezoneOffset();
                     const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                     setEditingPackage({ ...editingPackage, lastValidDate: localDate.toISOString().split('T')[0] })
                }
            }}
            className="h-11 w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-remark">Remark</Label>
        <Textarea
          id="edit-remark"
          placeholder="Enter remarks"
          value={packageRemark}
          onChange={(e) => setPackageRemark(e.target.value)}
          className="resize-none h-32 text-base md:text-sm" 
        />
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardContent>
          <div>
            <SearchField 
                label="Package Name"
                placeholder="Enter package name"
                value={packageSearchTerm}
                onChange={setPackageSearchTerm}
                onSearch={handlePackageSearch}
                isSearching={isPackageSearching}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={packageColumns}
            data={packages}
            keyExtractor={(row) => row.id.toString()}
            isLoading={isPackageSearching}
            emptyTitle="No Packages Found"
            emptyIcon={PackageX}
            skeletonRowCount={pagination.pageSize}
            emptyMessage={
                isPackageSearching 
                ? "Searching..." 
                : packageSearchTerm 
                    ? `No packages found matching "${packageSearchTerm}"`
                    : "Enter a package name to search."
            }
            pagination={{
                ...pagination.paginationProps,
                onPageChange: (newPage) => fetchData(newPage) 
            }}
          />
        </CardContent>
      </Card>
      
      {isMobile ? (
        <Sheet open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen} >
          <SheetContent side="bottom" className="h-[85dvh] p-0 flex flex-col rounded-t-2xl bg-background" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader className="p-6 border-b text-left bg-muted/5 shrink-0">
              <SheetTitle className="text-xl">Edit Package</SheetTitle>
              <SheetDescription>Update the package information.</SheetDescription>
            </SheetHeader>
            
            {editFormContent}

            <SheetFooter className="p-4 border-t flex-col gap-3 shrink-0 bg-muted/5">
              <LoadingButton 
                  onClick={handlePackageUpdate} 
                  isLoading={isPackageUpdating}
                  loadingText="Updating..."
                  className="w-full h-11 text-base shadow-md"
              >
                  Update Package
              </LoadingButton>
              <Button variant="outline" className="w-full h-11" onClick={() => setIsPackageDialogOpen(false)} disabled={isPackageUpdating}>
                  Cancel
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden flex flex-col gap-0 rounded-xl">
            <DialogHeader className="p-6 border-b bg-muted/5 shrink-0">
              <DialogTitle className="text-xl">Edit Package</DialogTitle>
              <DialogDescription>Update the package information.</DialogDescription>
            </DialogHeader>
            
            {editFormContent}

            <DialogFooter className="p-6 border-t bg-muted/5 shrink-0">
              <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)} disabled={isPackageUpdating} className="h-11">
                  Cancel
              </Button>
              <LoadingButton 
                  onClick={handlePackageUpdate} 
                  isLoading={isPackageUpdating}
                  loadingText="Updating..."
                  className="min-w-[150px] h-11"
              >
                  Update Package
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}