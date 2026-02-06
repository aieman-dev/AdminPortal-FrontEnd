"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker";
import { Pencil, PackageX } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { type TableColumn, DataTable } from "@/components/shared-components/data-table"
import { ItPoswfPackage } from "@/type/themepark-support"
import { packageService } from "@/services/package-services"
import { formatCurrency, formatDateTime } from "@/lib/formatter";
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { usePagination } from "@/hooks/use-pagination"
import { SearchField } from "@/components/shared-components/search-field"

export default function PackageListingTab() {
  const toast = useAppToast()

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
        const { packages: livePackages, totalPages, totalRecords } = await packageService.getItPoswfPackages(
            term.trim(),
            page 
        );
        
        setPackages(livePackages);
        pagination.setMetaData(totalPages, totalRecords);
        
        if (page === 1 && livePackages.length > 0) {
            toast.info( "Search Complete", `Found ${totalRecords} packages.` );
        }
    } catch (error) {
        console.error("Package Search Error:", error);
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
        await packageService.updateItPoswfPackage(
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

  // FIXED: Explicitly typed 'value' and 'row'
  const packageColumns: TableColumn<ItPoswfPackage>[] = [
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
  ]

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
      
      <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>Update the package information.</DialogDescription>
          </DialogHeader>
          {editingPackage && (
            <div className="space-y-4 py-4">
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
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)} disabled={isPackageUpdating}>Cancel</Button>
            <Button onClick={handlePackageUpdate} disabled={isPackageUpdating}>{isPackageUpdating ? "Updating..." : "Update Package"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}