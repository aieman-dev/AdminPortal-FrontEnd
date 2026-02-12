"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DivideCircle, Search, Copy } from "lucide-react"
import { SearchField } from "@/components/shared-components/search-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { formatCurrency } from "@/lib/formatter";
import { StatusBadge } from "@/components/shared-components/status-badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppToast } from "@/hooks/use-app-toast"
import { packageService } from "@/services/package-services" 

interface SelectableItPoswfPackage {
    id: string;
    packageId: string | number;
    packageName: string;
    packageType: string;
    price: number;
    status: string;
    lastValidDate: string; 
    syncStatus: "Pending" | "Synced" | "Error";
}

export default function BComparePackageTab() {
    const toast = useAppToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [packageType, setPackageType] = useState("all"); 
    const [results, setResults] = useState<SelectableItPoswfPackage[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSyncing, setIsSyncing] = useState(false);

    const packagesToDisplay = useMemo(() => {
        return results.filter(p =>
            p.packageName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, results]);

    const fetchUnsyncedPackages = async () => {
        setIsSearching(true);
        setSelectedIds(new Set());
        
        try {
            const typeFilter = packageType === "all" ? undefined : packageType;

            const response = await packageService.getUnsyncedPackages(
                typeFilter as any,
                searchQuery
            );
            
            if (response.success && response.data) {
                setResults(response.data);
                if (response.data.length === 0) {
                    toast.info("Search Complete",  "No unsynced packages found matching the criteria." );
                }
            } else {
                setResults([]);
                toast.error("Search Failed", response.error || "Could not retrieve packages.");
            }
        } catch (error) {
            console.error("API Search Error:", error);
            toast.error("Network Error", "Failed to connect to the package service.");
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchUnsyncedPackages();
    }, []); 

    const handleSelect = (id: string, isChecked: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = (isChecked: boolean) => {
        if (isChecked) {
            const allIds = new Set(packagesToDisplay.map(p => p.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const packagesToSyncCount = Array.from(selectedIds).length;
    const isAllSelected = packagesToSyncCount === packagesToDisplay.length && packagesToDisplay.length > 0;

    const handleSync = async () => {
        if (packagesToSyncCount === 0) {
            toast.info("No Packages Selected", "Please select packages to sync.");
            return;
        }

        setIsSyncing(true);
        
        try {
            const idsToSync = Array.from(selectedIds).map(id => Number(id));
            
            const response = await packageService.syncPackages(idsToSync);
            
            if (response.success && response.data) {
                setSelectedIds(new Set());
                
                toast.success("Sync Complete", response.data.message);

                await fetchUnsyncedPackages();
            } else {
                throw new Error(response.error || "Sync API failed to return success status.")
            }
        } catch (error) {
            console.error("Sync Execute Error:", error);
            toast.error("Sync Failed", 
                 error instanceof Error 
                    ? error.message.includes("500") ? "Internal Server Error during sync execution." : error.message
                    : "An unexpected error occurred during sync. Check console for details.",
               );
        } finally {
            setIsSyncing(false);
        }
    };

    const columns: TableColumn<SelectableItPoswfPackage>[] = useMemo (() => [
        { 
            header: "Select", 
            accessor: "id", 
            className: "pl-6",
            cell: (value, row) => (
                <div className="flex items-center justify-center">
                    <Checkbox 
                        checked={selectedIds.has(value as string)}
                        onCheckedChange={(checked) => handleSelect(value as string, !!checked)}
                        aria-label={`Select ${row.packageName}`}
                    />
                </div>
            )
        },
        { header: "Package ID", accessor: "packageId", cell: (value) => <span className="font-medium">{value}</span> },
        { header: "Package Name", accessor: "packageName" },
        { header: "Package Type", accessor: "packageType", cell: (value) => <StatusBadge status={value} /> },
        { header: "Price", accessor: "price", cell: (value) => formatCurrency(value) },
        { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
        { header: "Sync Status", accessor: "syncStatus", cell: (value) => <StatusBadge status={value} /> },
    
    ], [selectedIds]);

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <div className="space-y-2">
                        <SearchField 
                            label="Search Package"
                            placeholder="Enter package name"
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSearch={fetchUnsyncedPackages}
                            isSearching={isSearching}
                            extraFilters={
                                    <Select value={packageType} onValueChange={setPackageType}>
                                        <SelectTrigger className="h-11 w-full md:w-[200px]">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem> 
                                            <SelectItem value="Entry">Entry</SelectItem>
                                            <SelectItem value="Point">Point</SelectItem>
                                        </SelectContent>
                                    </Select>
                            }
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <DivideCircle className="h-5 w-5 text-muted-foreground" />
                        <div className="text-lg font-semibold">Packages Pending Sync</div>
                    </div>
                    
                    <div className="overflow-y-auto max-h-[400px] border border-border rounded-lg">
                        <DataTable
                            columns={columns}
                            data={packagesToDisplay}
                            keyExtractor={(row, index) => `${row.id}-${index}`}
                            emptyMessage={isSearching ? "Searching..." : "No packages found matching criteria."}
                        />
                    </div>
                    
                    <div className="flex justify-between items-center border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            {packagesToDisplay.length} total unsynced packages found.
                        </p>
                        <div className="flex gap-3">
                           {packagesToDisplay.length > 0 && (
                             <Button 
                                variant="outline"
                                onClick={() => handleSelectAll(!isAllSelected)} 
                                className="h-11 px-6"
                                disabled={isSyncing}
                             >
                                {isAllSelected ? "Deselect All" : "Select All"}
                             </Button>
                           )}
                           <Button 
                                onClick={handleSync} 
                                disabled={isSyncing || packagesToSyncCount === 0} 
                                className="h-11 px-6 text-primary-foreground"
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                {isSyncing ? "Syncing..." : `Sync Now (${packagesToSyncCount})`}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}