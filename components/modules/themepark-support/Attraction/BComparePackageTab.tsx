"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DivideCircle, Search, Copy } from "lucide-react"
import { SearchField } from "@/components/shared-components/search-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { formatCurrency } from "@/lib/formatter";
import { StatusBadge } from "@/components/shared-components/status-badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppToast } from "@/hooks/use-app-toast"
import { packageService } from "@/services/package-services" 
import { SelectableUnsyncPackage } from "@/type/themepark-support"
import { useDataTable } from "@/hooks/use-data-table"
import { Pagination } from "@/components/ui/pagination"


export default function BComparePackageTab() {
    const toast = useAppToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [packageType, setPackageType] = useState("all"); 
    const [results, setResults] = useState<SelectableUnsyncPackage[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSyncing, setIsSyncing] = useState(false);

    // Filter results based on search input
    const packagesToDisplay = useMemo(() => {
        return results.filter(p =>
            p.packageName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, results]);

    // Initialize the DataTable hook for Pagination & Sorting
    const {
        paginatedData,
        sortConfig,
        onSort,
        paginationProps,
        resetPagination
    } = useDataTable({
        data: packagesToDisplay,
        pageSize: 20
    });

    const fetchUnsyncedPackages = async () => {
        setIsSearching(true);
        setSelectedIds(new Set());
        resetPagination();
        
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

    useEffect(() => {
        const handleTabRefresh = () => {
            fetchUnsyncedPackages();
        };

        window.addEventListener('refresh-active-tab', handleTabRefresh);
        return () => window.removeEventListener('refresh-active-tab', handleTabRefresh);
    }, [searchQuery, packageType]);

    const columns: TableColumn<SelectableUnsyncPackage>[] = useMemo (() => [
        { 
            header: "Select", 
            accessor: "id", 
            className: "pl-6 w-[60px]", 
            cell: (value, row) => (
                <div className="flex items-center justify-start">
                    <Checkbox 
                        checked={selectedIds.has(value as string)}
                        onCheckedChange={(checked) => handleSelect(value as string, !!checked)}
                        aria-label={`Select ${row.packageName}`}
                    />
                </div>
            )
        },
        { 
            header: "Package ID", 
            accessor: "packageId", 
            sortable: true,
            className: "w-[120px]", 
            cell: (value) => <span className="font-medium">{value}</span> 
        },
        { 
            header: "Package Name", 
            accessor: "packageName", 
            sortable: true,
            className: "w-[30%] min-w-[200px] max-w-[300px]", 
            cell: (value) => <div className="truncate font-medium" title={value as string}>{value}</div>
        },
        { 
            header: "Package Type", 
            accessor: "packageType", 
            sortable: true,
            className: "w-[120px] text-center", 
            cell: (value) => <StatusBadge status={value as string} /> 
        },
        { 
            header: "Unsynced Items", 
            accessor: "unsyncedItemNames",
            className: "w-[30%] min-w-[200px] max-w-[300px]",
            cell: (value) => <div className="text-sm text-muted-foreground truncate" title={value as string}>{value || "N/A"}</div> 
        },
        { 
            header: "Status", 
            accessor: "status", 
            sortable: true,
            className: "w-[100px] text-center", 
            cell: (value) => <StatusBadge status={value as string} /> 
        },
        { 
            header: "Sync Status", 
            accessor: "syncStatus", 
            sortable: true,
            className: "w-[120px] text-right pr-6", 
            cell: (value) => <StatusBadge status={value as string} /> 
        },
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
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2">
                        <DivideCircle className="h-5 w-5 text-muted-foreground" />
                        <div className="text-lg font-semibold">Packages Pending Sync</div>
                    </div>
                </div>
                    
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={paginatedData}
                        keyExtractor={(row, index) => `${row.id}-${index}`}
                        emptyMessage={isSearching ? "Searching..." : "No packages found matching criteria."}
                        isLoading={isSearching}
                        pagination={paginationProps}
                        onSort={onSort}
                        sortConfig={sortConfig}
                        skeletonRowCount={paginationProps.pageSize}
                    />
                    
                    <div className="flex justify-between items-center border-t pt-4 px-6 pb-6 bg-muted/10">
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
                           <LoadingButton 
                                onClick={handleSync} 
                                isLoading={isSyncing}
                                loadingText="Syncing..."
                                disabled={packagesToSyncCount === 0} 
                                className="h-11 px-6 text-primary-foreground"
                                icon={Copy}
                            >
                                Sync Now ({packagesToSyncCount})
                            </LoadingButton>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}