// components/themepark-support/tabs/Attraction/PackageListingTab.tsx
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

  // --- 1. UPDATED DATE FORMATTER (dd-MMM-yyyy hh:mm am/pm) ---
  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString || dateString.startsWith('0001-01-01')) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 

    // Format Day-Month-Year (e.g. 08-Dec-2025)
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();

    // Format Time (e.g. 12:00 am)
    const time = date.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    }).toLowerCase(); // force lowercase am/pm

    return `${day}-${month}-${year} ${time}`;
  };

  const handlePackageSearch = async () => {
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
    
    // --- 2. APPLY DATE FORMATTER ---
    { 
        header: "Last Valid Date", 
        accessor: "lastValidDate",
        cell: (value) => formatDateTime(value as string)
    },
    
    {
      header: "Description",
      accessor: "description",
      cell: (value) => <div className="max-w-xs truncate" title={value as string}>{value}</div>,
    },
    
    // --- 3. APPLY CUSTOM COLORS FOR STATUS ---
    { 
        header: "Status", 
        accessor: "status", 
        cell: (value) => (
            <StatusBadge 
                status={value as string} 
                colorMap={{
                    active: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400",
                    inactive: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                }}
            /> 
        )
    },
    
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
                  // Handle potential N/A or empty date for the date picker input
                  value={editingPackage.lastValidDate !== "N/A" ? editingPackage.lastValidDate.split('T')[0] : ""}
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