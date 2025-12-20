"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker";
import { Pencil, PackageX } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { type TableColumn, DataTable } from "@/components/themepark-support/it-poswf/data-table"
import { ItPoswfPackage } from "@/type/themepark-support"
import { packageService } from "@/services/package-services"
import { formatCurrency, formatDateTime } from "@/lib/formatter";
import { useToast } from "@/hooks/use-toast"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"

export default function PackageListingTab() {
  const { toast } = useToast()

  const [packageSearchTerm, setPackageSearchTerm] = useState("")
  const [packages, setPackages] = useState<ItPoswfPackage[]>([])
  const [isPackageSearching, setIsPackageSearching] = useState(false)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 30; // Matches service call

  // Edit State
  const [editingPackage, setEditingPackage] = useState<ItPoswfPackage | null>(null)
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false)
  const [isPackageUpdating, setIsPackageUpdating] = useState(false)
  const [packageRemark, setPackageRemark] = useState("")


  const handlePackageSearch = async () => {
    fetchData(1);
  }

  const fetchData = async (page: number) => {
    setIsPackageSearching(true)
    setCurrentPage(page);

    try {
        const { packages: livePackages, totalPages: apiTotalPages, totalRecords: apiTotalRecords } = await packageService.getItPoswfPackages(
            packageSearchTerm.trim(),
            page 
        );
        
        setPackages(livePackages);
        setTotalPages(apiTotalPages);
        setTotalRecords(apiTotalRecords);
        
        if (page === 1 && livePackages.length > 0) {
            toast({ title: "Search Complete", description: `Found ${apiTotalRecords} packages.` });
        }
    } catch (error) {
        console.error("Package Search Error:", error);
        toast({ title: "Error", description: "Failed to fetch package data.", variant: "destructive" });
        setPackages([]);
    } finally {
        setIsPackageSearching(false)
    }
  };

  const handlePageChange = (newPage: number) => {
      fetchData(newPage);
  }

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
        
        toast({ title: "Success", description: "Package updated successfully." });
    } catch (error) {
        toast({ title: "Update Failed", description: "An error occurred.", variant: "destructive" });
    } finally {
        setIsPackageUpdating(false);
    }
  }

  // FIXED: Explicitly typed 'value' and 'row'
  const packageColumns: TableColumn<ItPoswfPackage>[] = [
    { header: "Package ID", accessor: "packageId", className: "pl-6", cell: (value: any) => <span className="font-medium">{value}</span> },
    { header: "Package Name", accessor: "packageName" },
    { header: "Type", accessor: "packageType", cell: (value: any) => <StatusBadge status={value} /> },
    { header: "Price", accessor: "price", cell: (value: any) => formatCurrency(value) },
    { header: "Last Valid Date", accessor: "lastValidDate", cell: (value: any) => formatDateTime(value as string) },
    { header: "Description", accessor: "description", cell: (value: any) => <div className="max-w-xs truncate" title={value as string}>{value}</div> },
    { header: "Status", accessor: "status", cell: (value: any) => <StatusBadge status={value as string} /> },
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
        <CardContent className="space-y-4 ">
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
                currentPage: currentPage,
                totalPages: totalPages,
                onPageChange: handlePageChange,
                totalRecords: totalRecords,
                pageSize: PAGE_SIZE
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