// components/it-poswf/tabs/Attraction/PackageListingTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Pencil, PackageIcon } from "lucide-react"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { type TableColumn, DataTable } from "@/components/themepark-support/it-poswf/data-table"
import { ItPoswfPackage } from "@/type/themepark-support"
import { packageService } from "@/services/package-services"
import { useToast } from "@/hooks/use-toast"

export default function PackageListingTab() {
  const { toast } = useToast()

  const [packageSearchTerm, setPackageSearchTerm] = useState("")
  const [packages, setPackages] = useState<ItPoswfPackage[]>([])
  const [isPackageSearching, setIsPackageSearching] = useState(false)
  const [editingPackage, setEditingPackage] = useState<ItPoswfPackage | null>(null)
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false)
  const [isPackageUpdating, setIsPackageUpdating] = useState(false)
  const [packageRemark, setPackageRemark] = useState("")

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(',', '');
  };

  const handlePackageSearch = async () => {
    // Prevent redundant search if term is empty AND results are already loaded
    if (!packageSearchTerm.trim() && packages.length > 0) {
        return; 
    }

    setIsPackageSearching(true)
    setPackages([]) 
    
    try {
        const { packages: livePackages } = await packageService.getItPoswfPackages(
            packageSearchTerm.trim()
        );
        
        setPackages(livePackages);
        
        if (livePackages.length > 0) {
            toast({ title: "Search Complete", description: `Found ${livePackages.length} packages.` });
        } else {
            toast({ title: "Search Complete", description: "No packages found matching the criteria." });
        }

    } catch (error) {
        console.error("Package Search Error:", error);
        toast({
            title: "Package Search Failed",
            description: "Failed to fetch package data.",
            variant: "destructive"
        });
    } finally {
        setIsPackageSearching(false)
    }
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

        // Update the local UI state on success
        const updatedPackages = packages.map((p) =>
            p.id === editingPackage.id
                ? {
                    ...editingPackage,
                    lastModifiedBy: "current.user@themepark.com", 
                    modifiedDate: new Date().toISOString().slice(0, 19).replace("T", " "),
                  }
                : p,
        );
        
        setPackages(updatedPackages)
        setIsPackageDialogOpen(false)
        setEditingPackage(null)
        setPackageRemark("")
        
        toast({
            title: "Success",
            description: "Package updated successfully.",
        });

    } catch (error) {
        console.error("Package Update Error:", error);
        toast({
            title: "Update Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
            variant: "destructive",
        });
    } finally {
        setIsPackageUpdating(false);
    }
  }

  const packageColumns: TableColumn<ItPoswfPackage>[] = [
    { header: "Package ID", accessor: "packageId", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Package Name", accessor: "packageName" },
    { header: "Package Type", accessor: "packageType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Price", accessor: "price", cell: (value) => `RM ${(value ?? 0).toFixed(2)}` },
    { header: "Last Valid Date", accessor: "lastValidDate" },
    {
      header: "Description",
      accessor: "description",
      cell: (value) => <div className="max-w-xs truncate">{value}</div>,
    },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    {
      header: "Action",
      accessor: "id",
      cell: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => handlePackageEdit(row)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="package-search" className="text-sm font-medium">
              Package Name
            </Label>
            <div className="flex gap-2">
              <Input
                id="package-search"
                placeholder="Enter package name"
                value={packageSearchTerm}
                onChange={(e) => setPackageSearchTerm(e.target.value)}
                className="h-11"
              />
              <Button onClick={handlePackageSearch} disabled={isPackageSearching} className="h-11 px-8">
                <Search className="mr-2 h-4 w-4" />
                {isPackageSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataTable
            columns={packageColumns}
            data={packages}
            keyExtractor={(row) => row.id.toString()}
            emptyMessage={isPackageSearching ? "Searching..." : "No packages found"}
          />
        </CardContent>
      </Card>
      
      <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>Update the package information and add remarks for the changes.</DialogDescription>
          </DialogHeader>
          {editingPackage && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-last-valid-date" className="text-sm font-medium">
                  Last Valid Date
                </Label>
                <Input
                  id="edit-last-valid-date"
                  type="date"
                  value={editingPackage.lastValidDate.split('T')[0]}
                  onChange={(e) => setEditingPackage({ ...editingPackage, lastValidDate: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-remark" className="text-sm font-medium">
                  Remark
                </Label>
                <Textarea
                  id="edit-remark"
                  placeholder="Enter remarks for this update"
                  value={packageRemark}
                  onChange={(e) => setPackageRemark(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created By (Email):</span>
                  <span className="font-medium">{ editingPackage.createdBy || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created Date:</span>
                  <span className="font-medium">{formatDateTime(editingPackage.createdDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Modified By (Email):</span>
                  <span className="font-medium">{ editingPackage.lastModifiedBy || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Modified Date:</span>
                  <span className="font-medium">{formatDateTime(editingPackage.modifiedDate)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)} disabled={isPackageUpdating}>
              Cancel
            </Button>
            <Button onClick={handlePackageUpdate} disabled={isPackageUpdating}>
              {isPackageUpdating ? "Updating..." : "Update Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}