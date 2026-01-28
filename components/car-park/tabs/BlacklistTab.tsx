"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ban, Unlock, RefreshCw, User, Loader2 } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { carParkService } from "@/services/car-park-services"
import { BlockedUser, Account } from "@/type/car-park"
import { useAppToast } from "@/hooks/use-app-toast"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { usePagination } from "@/hooks/use-pagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"

export default function BlacklistTab() {
    const toast = useAppToast()
    const { user } = useAuth()
    
    // --- State ---
    const [searchTerm, setSearchTerm] = useState("")
    const [viewMode, setViewMode] = useState<"blacklist" | "search">("blacklist")
    
    const [blacklistData, setBlacklistData] = useState<BlockedUser[]>([])
    const [searchResultData, setSearchResultData] = useState<Account[]>([])
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

    // --- 2. Search Accounts (Global Search) ---
    const handleAccountSearch = async () => {
        if (!searchTerm.trim()) {
            fetchBlacklist(1);
            return;
        }

        setLoading(true);
        setViewMode("search");
        setSearchResultData([]);

        try {
            const results = await carParkService.searchSuperAppAccounts(searchTerm.trim());
            setSearchResultData(results);
            if (results.length === 0) {
                toast.info("No Users Found", "Try searching by exact email or mobile number.");
            }
        } catch (error) {
            toast.error("Search Failed", "Could not search accounts.");
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => { fetchBlacklist(1) }, [])

    // --- Actions ---
    const handleBlockClick = async (account: Account) => {
        setLoading(true);
        try {
            const passDetails = await carParkService.getQrListingID({ accId: account.accId });
            
            if (passDetails && 'data' in passDetails && passDetails.data.qrId) {
                setSelectedUserToBlock({
                    accId: account.accId,
                    name: account.firstName || "User",
                    qrId: passDetails.data.qrId
                });
                setBlockReason("");
                setIsBlockOpen(true);
            } else {
                toast.error("Cannot Block", "This user does not have an active season pass/card to block.");
            }
        } catch (error) {
            toast.error("Error", "Failed to retrieve user pass details.");
        } finally {
            setLoading(false);
        }
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
                Number(user?.id || 0), 
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

    const searchColumns: TableColumn<Account>[] = [
        { header: "Name", accessor: "firstName", className: "pl-6 font-medium" },
        { header: "Email", accessor: "email" },
        { header: "Mobile", accessor: "mobile" },
        { header: "Acc ID", accessor: "accId", className: "text-muted-foreground font-mono text-xs" },
        { 
            header: "Action", accessor: "id", className: "text-right pr-6",
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
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                        <div className="flex-1 w-full space-y-1">
                             <SearchField 
                                label={viewMode === 'search' ? "Searching Accounts Database" : "Search to Block User"}
                                placeholder="Enter Name, Email or Mobile to find user..."
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onSearch={handleAccountSearch}
                                isSearching={loading}
                            />
                            {viewMode === 'search' && (
                                <p className="text-xs text-muted-foreground ml-1">
                                    Showing search results. Clear search to return to blacklist view.
                                </p>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            {viewMode === 'search' && (
                                <Button variant="secondary" onClick={() => { setSearchTerm(""); fetchBlacklist(1); }}>
                                    Back to List
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => viewMode === 'blacklist' ? fetchBlacklist(1) : handleAccountSearch()} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> 
                                {loading ? "Loading..." : "Refresh"}
                            </Button>
                        </div>
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
                            <User className="h-4 w-4" />
                            <span className="font-medium">Search Results</span>
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
                            keyExtractor={(row) => row.id}
                            isLoading={loading}
                            emptyIcon={User}
                            emptyTitle="No Users Found"
                            emptyMessage="No accounts matched your search criteria."
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