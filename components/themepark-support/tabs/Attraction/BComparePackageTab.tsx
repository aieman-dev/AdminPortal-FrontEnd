// components/themepark-support/tabs/Attraction/BComparePackageTab.tsx
"use client"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DivideCircle, Search, Copy } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

// Mock Package Type (Reusing ItPoswfPackage structure for table display)
interface SelectableItPoswfPackage {
    id: string; // Unique ID
    packageId: string | number;
    packageName: string;
    packageType: string;
    price: number;
    status: string; // Active | Inactive
    lastValidDate: string;
    syncStatus: "Pending" | "Synced" | "Error"; // Strict string literal type
}

const mockPackages: SelectableItPoswfPackage[] = [
    { id: "1", packageId: 1001, packageName: "Daily Pass Ticket", packageType: "Ticket", price: 150.00, status: "Active", lastValidDate: "2026-12-31", syncStatus: "Pending" },
    { id: "2", packageId: 2005, packageName: "Premium Point Pack", packageType: "Point", price: 50.00, status: "Active", lastValidDate: "2026-12-31", syncStatus: "Synced" },
    { id: "3", packageId: 1002, packageName: "Kid's Entry Ticket", packageType: "Ticket", price: 90.00, status: "Inactive", lastValidDate: "2025-06-01", syncStatus: "Pending" },
    { id: "4", packageId: 3010, packageName: "Annual Reward Bonus", packageType: "Reward", price: 0.00, status: "Active", lastValidDate: "2027-01-01", syncStatus: "Pending" },
    { id: "5", packageId: 2006, packageName: "Standard Point Pack", packageType: "Point", price: 25.00, status: "Active", lastValidDate: "2026-12-31", syncStatus: "Error" },
];

export default function BComparePackageTab() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [packageType, setPackageType] = useState("all"); 
    const [results, setResults] = useState<SelectableItPoswfPackage[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSyncing, setIsSyncing] = useState(false);

    const filteredResults = useMemo(() => {
        return results.filter(p =>
            p.packageName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (packageType === "all" || p.packageType.toLowerCase() === packageType.toLowerCase())
        );
    }, [searchQuery, packageType, results]);

    const handleSearch = () => {
        setIsSearching(true);
        setSelectedIds(new Set());
        
        // Simulate search logic (MOCK)
        setTimeout(() => {
            const finalResults = mockPackages.filter(p =>
                p.packageName.toLowerCase().includes(searchQuery.toLowerCase()) &&
                (packageType === "all" || p.packageType.toLowerCase() === packageType.toLowerCase())
            );
            setResults(finalResults);
            setIsSearching(false);
            if (finalResults.length === 0) {
                 toast({ title: "Search Complete", description: "No packages found matching the criteria." });
            }
        }, 500);
    };

    // Auto-load initial data
    useState(() => {
        handleSearch();
    });

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
            const allIds = new Set(filteredResults.map(p => p.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const packagesToSyncCount = Array.from(selectedIds).length;
    const isAllSelected = packagesToSyncCount === filteredResults.length && filteredResults.length > 0;

    const handleSync = () => {
        if (packagesToSyncCount === 0) {
            toast({ title: "No Packages Selected", description: "Please select packages to sync.", variant: "default" });
            return;
        }

        setIsSyncing(true);
        
        // MOCK: Simulate sync API call
        setTimeout(() => {
            const syncedPackages = Array.from(selectedIds).map(id => results.find(p => p.id === id)?.packageName);
            const updatedResults = results.map(p => {
                if (selectedIds.has(p.id) && p.syncStatus !== "Synced") {
                    return { ...p, syncStatus: "Synced" as "Synced" };
                }
                return p;
            });
            setResults(updatedResults);
            setSelectedIds(new Set());
            setIsSyncing(false);
            
            // Notification changed to Toast only, 5 seconds duration
            toast({ 
                title: "Sync Complete", 
                description: `Successfully initiated sync for ${packagesToSyncCount} package(s): ${syncedPackages.join(', ')}.`,
                duration: 5000, 
            });
        }, 1500);
    };

    const columns: TableColumn<SelectableItPoswfPackage>[] = [
        { 
            // FIX: Header must be a string. Using "Select" and the checkbox goes in the cell.
            header: "Select", 
            accessor: "id", 
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
        { header: "Price", accessor: "price", cell: (value) => `RM ${(value ?? 0).toFixed(2)}` },
        { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
        { header: "Last Valid Date", accessor: "lastValidDate" },
        { header: "Sync Status", accessor: "syncStatus", cell: (value) => {
            const statusLower = (value as string).toLowerCase();
            let color = "bg-gray-500/10 text-gray-500";
            if (statusLower === "synced") color = "bg-green-500/10 text-green-500";
            if (statusLower === "error") color = "bg-red-500/10 text-red-500";
            return <StatusBadge status={value as string} colorMap={{}} variant="default" />;
        }},
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    {/* Filter Section (Mimics PackageListingTab) */}
                    <div className="space-y-2">
                        <Label htmlFor="package-search" className="text-sm font-medium">
                            Search Package
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="package-search"
                                placeholder="Enter package name"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="h-11 flex-1"
                            />
                            <div className="w-[200px]">
                                <Select value={packageType} onValueChange={setPackageType}>
                                    <SelectTrigger id="package-type" className="h-11">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem> 
                                        <SelectItem value="Ticket">Ticket</SelectItem>
                                        <SelectItem value="Point">Point</SelectItem>
                                        <SelectItem value="Reward">Reward</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleSearch} disabled={isSearching} className="h-11 px-8">
                                <Search className="mr-2 h-4 w-4" />
                                {isSearching ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <DivideCircle className="h-5 w-5 text-muted-foreground" />
                        <div className="text-lg font-semibold">Packages Pending Sync</div>
                    </div>
                    
                    {/* Fixed Height Scrollable Table */}
                    <div className="overflow-y-auto max-h-[400px] border border-border rounded-lg">
                        <DataTable
                            columns={columns}
                            data={filteredResults}
                            keyExtractor={(row) => row.id}
                            emptyMessage={isSearching ? "Searching..." : "No packages found matching criteria."}
                        />
                    </div>
                    
                    <div className="flex justify-between items-center border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            {filteredResults.length} total packages found.
                        </p>
                        <div className="flex gap-3">
                           {/* Select All Button */}
                           {filteredResults.length > 0 && (
                             <Button 
                                variant="outline"
                                onClick={() => handleSelectAll(!isAllSelected)} 
                                className="h-11 px-6"
                             >
                                {isAllSelected ? "Deselect All" : "Select All"}
                             </Button>
                           )}
                           <Button 
                                onClick={handleSync} 
                                disabled={isSyncing || packagesToSyncCount === 0} 
                                // Button styling to Indigo/Primary theme
                                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-primary-foreground"
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