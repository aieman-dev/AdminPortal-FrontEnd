"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ban, Unlock, RefreshCw, CreditCard, Loader2 } from "lucide-react" 
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { carParkService } from "@/services/car-park-services"
import { BlockedUser, CarParkPass } from "@/type/car-park" 
import { useAppToast } from "@/hooks/use-app-toast"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { usePagination } from "@/hooks/use-pagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { StatusBadge } from "@/components/shared-components/status-badge"

export default function BlacklistTab() {
    const toast = useAppToast()
    const { user } = useAuth()
    
    // --- State ---
    const [searchTerm, setSearchTerm] = useState("")
    const [viewMode, setViewMode] = useState<"blacklist" | "search">("blacklist")
    
    const [blacklistData, setBlacklistData] = useState<BlockedUser[]>([])
    const [searchResultData, setSearchResultData] = useState<CarParkPass[]>([])
    const [loading, setLoading] = useState(false)

    // Block Dialog State
    const [isBlockOpen, setIsBlockOpen] = useState(false)
    const [blockReason, setBlockReason] = useState("")
    const [selectedUserToBlock, setSelectedUserToBlock] = useState<{ accId: string, name: string, qrId: number } | null>(null)
    const [isProcessingBlock, setIsProcessingBlock] = useState(false)

    // Unblock State
    const [isUnblockProcessing, setIsUnblockProcessing] = useState(false)

    // Pagination
    const { 
        currentPage, 
        pageSize, 
        totalPages, 
        totalRecords, 
        setCurrentPage, 
        setMetaData 
    } = usePagination({ pageSize: 10 });

    // --- 1. Fetch Blacklist (Report) ---
    const fetchBlacklist = useCallback(async (page: number) => {
        setLoading(true)
        setViewMode("blacklist")
        if (page !== currentPage) setCurrentPage(page);

        try {
            const res = await carParkService.getBlacklist(page, pageSize);
            setBlacklistData(res.items);
            setMetaData(res.totalPages, res.totalCount);
        } catch (error) {
            toast.error("Error", "Failed to fetch blacklist.")
        } finally {
            setLoading(false)
        }
    }, [currentPage, pageSize, setMetaData, setCurrentPage, toast]);

    // --- 2. UPDATED: Reuse getQrListing for Search ---
    const handleCardSearch = async () => {
        if (!searchTerm.trim()) {
            fetchBlacklist(1);
            return;
        }

        setLoading(true);
        setViewMode("search");
        setSearchResultData([]);

        try {
            // REUSE: Calling getQrListing (which uses /cards/active)
            // We request page 1 with a larger size (e.g., 20 or 50) for search results
            const response = await carParkService.getQrListing(1, 20, searchTerm.trim());
            
            // Extract items from the paginated response
            const results = response.items || []; 
            setSearchResultData(results);
            
            if (results.length === 0) {
                toast.info("No Active Cards Found", "Try searching by name, email or plate number.");
            }
        } catch (error) {
            toast.error("Search Failed", "Could not search active cards.");
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => { fetchBlacklist(1) }, [])

    // --- Actions ---
    const handleBlockClick = (card: CarParkPass) => {
        setSelectedUserToBlock({
            accId: String(card.accId), 
            name: card.name || "Unknown",
            qrId: Number(card.qrId)
        });
        setBlockReason("");
        setIsBlockOpen(true);
    };

    const confirmBlock = async () => {
        if (!selectedUserToBlock || !blockReason.trim()) {
            toast.error("Required", "Please enter a reason.");
            return;
        }

        setIsProcessingBlock(true);
        try {
            await carParkService.blockSeasonPass(
                selectedUserToBlock.qrId, 
                blockReason
            );
            toast.success("Blocked", `${selectedUserToBlock.name} has been added to blacklist.`);
            setIsBlockOpen(false);
            setSearchTerm(""); 
            fetchBlacklist(1); 
        } catch (error) {
            toast.error("Block Failed", error instanceof Error ? error.message : "Error occurred.");
        } finally {
            setIsProcessingBlock(false);
        }
    };

    const handleUnblock = async (qrId: string) => {
        setIsUnblockProcessing(true);
        try {
            await carParkService.unblockSeasonPass(Number(qrId), Number(user?.id || 0));
            toast.success("Unblocked", "User removed from blacklist.");
            fetchBlacklist(currentPage); 
        } catch (error) {
            toast.error("Unblock Failed", "Could not unblock user.");
        } finally {
            setIsUnblockProcessing(false);
        }
    };

    // --- Columns Definitions ---
    const blacklistColumns: TableColumn<BlockedUser>[] = [
        { header: "Card ID", accessor: "qrId", className: "pl-6 font-mono font-medium" },
        { header: "Email", accessor: "email" },
        { header: "Staff No", accessor: "staffNo", cell: (val) => val || "-" },
        { header: "Car Plate", accessor: "carPlate", className: "uppercase font-semibold" },
        { header: "Unit", accessor: "unitNo" },
        { 
            header: "Season Package", 
            accessor: "seasonPackage",
            cell: (val) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block" title={val as string}>{val}</span>
        },
        { 
            header: "Action", accessor: "id", className: "text-right pr-6",
            cell: (_, row) => (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    onClick={() => handleUnblock(row.qrId)}
                    disabled={isUnblockProcessing}
                >
                    <Unlock className="h-4 w-4 mr-2" /> Unblock
                </Button>
            )
        }
    ];

    // Search Results Columns (Active Cards)
    const searchColumns: TableColumn<CarParkPass>[] = [
        { 
            header: "Card ID", 
            accessor: "qrId", 
            className: "pl-6 font-mono text-xs text-muted-foreground" 
        },
        { 
            header: "Name", 
            accessor: "name", // Use 'name' from CarParkPass
            className: "font-medium" 
        },
        { header: "Email", accessor: "email" },
        { 
            header: "Car Plate", 
            accessor: "plateNo", 
            cell: (val) => <span className="uppercase font-semibold">{val}</span> 
        },
        { 
            header: "Status", 
            accessor: "status", 
            cell: (val) => <StatusBadge status={val as string} /> 
        },
        { 
            header: "Action", accessor: "qrId", className: "text-right pr-6",
            cell: (_, row) => (
                <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-8"
                    onClick={() => handleBlockClick(row)}
                >
                    <Ban className="h-4 w-4 mr-2" /> Block
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            
            {/* === CARD 1: SEARCH BAR === */}
            <Card>
                <CardContent>
                    <div className="space-y-2"> {/* Wrapper to handle spacing between Search Row and Helper Text */}
                        
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                            {/* Left Side: Search Field */}
                            <div className="flex-1 w-full">
                                <SearchField 
                                    label={viewMode === 'search' ? "Searching Active Cards" : "Search to Block User"}
                                    placeholder="Enter Name, Email, Plate No or Card ID..."
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    onSearch={handleCardSearch}
                                    isSearching={loading}
                                />
                            </div>
                            
                            {/* Right Side: Buttons (Aligned to bottom of search input) */}
                            <div className="flex gap-2">
                                {viewMode === 'search' && (
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => { setSearchTerm(""); fetchBlacklist(1); }}
                                        className="h-11" // Match SearchField height
                                    >
                                        Back to List
                                    </Button>
                                )}
                                <Button 
                                    variant="outline" 
                                    onClick={() => viewMode === 'blacklist' ? fetchBlacklist(1) : handleCardSearch()} 
                                    disabled={loading}
                                    className="h-11" // Match SearchField height
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> 
                                    {loading ? "Loading..." : "Refresh"}
                                </Button>
                            </div>
                        </div>

                        {/* Helper Text (Moved OUTSIDE the flex row so it doesn't break alignment) */}
                        {viewMode === 'search' && (
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <p className="text-xs text-muted-foreground">
                                    Showing active card results. <span className="font-medium text-foreground">Clear search</span> or click <span className="font-medium text-foreground">Back to List</span> to return.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* === CARD 2: DATA TABLE === */}
            <Card>
                <CardContent className="pt-6">
                    {/* Context Banner */}
                    {viewMode === 'blacklist' ? (
                        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                            <Ban className="h-4 w-4" />
                            <span className="font-medium">Current Blacklist ({totalRecords})</span>
                        </div>
                    ) : (
                        <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-1">
                            <CreditCard className="h-4 w-4" />
                            <span className="font-medium">Active Card Search Results</span>
                        </div>
                    )}

                    {/* Table Render */}
                    {viewMode === 'blacklist' ? (
                        <>
                            <DataTable 
                                columns={blacklistColumns}
                                data={blacklistData}
                                keyExtractor={(row) => row.id}
                                isLoading={loading}
                                emptyIcon={Ban}
                                emptyTitle="Blacklist Empty"
                                emptyMessage="No blocked users found."
                            />
                            {totalPages > 1 && (
                                <div className="mt-4">
                                    <PaginationControls 
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalRecords={totalRecords}
                                        pageSize={pageSize}
                                        onPageChange={fetchBlacklist}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <DataTable 
                            columns={searchColumns}
                            data={searchResultData}
                            keyExtractor={(row) => String(row.qrId)}
                            isLoading={loading}
                            emptyIcon={CreditCard}
                            emptyTitle="No Active Cards Found"
                            emptyMessage="No matching active cards/passes found."
                        />
                    )}
                </CardContent>
            </Card>

            {/* BLOCK CONFIRMATION DIALOG */}
            <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <Ban className="h-5 w-5" />
                            Confirm Block
                        </DialogTitle>
                        <DialogDescription>
                            You are about to block <strong>{selectedUserToBlock?.name}</strong> (Card ID: {selectedUserToBlock?.qrId}).
                            <br/>This will prevent them from accessing the car park immediately.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-2 space-y-2">
                        <Label>Reason for Blocking <span className="text-red-500">*</span></Label>
                        <Textarea 
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="e.g. Payment default, Violation of terms..."
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBlockOpen(false)} disabled={isProcessingBlock}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmBlock} disabled={isProcessingBlock}>
                            {isProcessingBlock ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm Block
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}