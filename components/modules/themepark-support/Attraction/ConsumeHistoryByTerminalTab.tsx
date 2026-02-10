"use client"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { History, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { useAppToast } from "@/hooks/use-app-toast"
import { itPoswfService } from "@/services/themepark-support"
import { type TerminalTransaction} from "@/type/themepark-support"
import { formatDateTime } from "@/lib/formatter";
import { TerminalSelector } from "@/components/shared-components/terminal-selector"
import { DatePicker } from "@/components/ui/date-picker"



export default function ConsumeHistoryByTerminalTab() {
    const toast= useAppToast();
    
    // -- SIMPLIFIED STATE --
    const [selectedTerminalId, setSelectedTerminalId] = useState<string>("")
    const [searchDate, setSearchDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [hasSearched, setHasSearched] = useState(false)
    const [consumeHistory, setConsumeHistory] = useState<TerminalTransaction[]>([])
    const [isHistorySearching, setIsHistorySearching] = useState(false)

    // Helper for date picker state sync
    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            setSearchDate(localDate.toISOString().split('T')[0]);
        } else {
            setSearchDate("");
        }
    };

    const handleHistorySearch = async () => {
        if (!selectedTerminalId) {
            toast.info("Input Required", "Please select a Terminal.");
            return;
        }

        setIsHistorySearching(true);
        setHasSearched(true);
        setConsumeHistory([]);

        try {
            const response = await itPoswfService.searchTerminalHistory(selectedTerminalId, searchDate);

            if (response.success && response.data) {
                setConsumeHistory(response.data.consumeHistory);
                
                if (response.data.consumeHistory.length === 0) {
                     toast.info("Search Complete", `No consumption history found for this terminal on ${searchDate}.`);
                } else {
                     toast.info("Search Complete",  "History data retrieved." );
                }
            } else {
                toast.error("Search Failed", response.error || "Could not retrieve history.");
            }
        } catch (error) {
            console.error("History Search Error:", error);
            toast.error( "Network Error", "Failed to connect to the history service.");
        } finally {
            setIsHistorySearching(false);
        }
    }

    const commonColumns: TableColumn<TerminalTransaction>[] = useMemo(() => [
        { header: "Transaction ID", accessor: "trxID", className: "pl-6", cell: (value) => <span className="font-medium">{value}</span> },
        { header: "Invoice No", accessor: "invoiceNo" },
        { header: "Transaction Type", accessor: "trxType", cell: (value) => <StatusBadge status={value} /> },
        { header: "Amount", accessor: "amount", cell: (value) => `RM ${(value ?? 0).toFixed(2)}` },
        { header: "Created Date", accessor: "createdDate", cell: (value) => formatDateTime(value) },
        { header: "Status", accessor: "recordStatus", cell: (value) => <StatusBadge status={value} /> },
        { header: "Created By", accessor: "createdBy" },
    ], []);

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    {/* RESPONSIVE LAYOUT: 
                        Desktop: [ Selector (Flex 1) ] [ Date (180px) ] [ Button ]
                    */}
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        
                        {/* 1. Unified Terminal Selector */}
                        <div className="w-full lg:flex-1 space-y-2">
                            <TerminalSelector 
                                value={selectedTerminalId}
                                onChange={setSelectedTerminalId}
                                label="Terminal Search / ID"
                                placeholder="Enter ID (e.g. 383) or Name"
                                className="h-11"
                            />
                        </div>

                        {/* 2. Date Picker (Standardized) */}
                        <div className="w-full lg:w-[180px] space-y-2">
                            <Label htmlFor="search-date" className="text-sm font-medium">
                                Search Date
                            </Label>
                            <DatePicker
                                date={searchDate ? new Date(searchDate) : undefined}
                                setDate={handleDateSelect}
                                className="h-11"
                            />
                        </div>

                        {/* 3. Search Button */}
                        <div className="w-full lg:w-auto space-y-2">
                            <Button onClick={handleHistorySearch} 
                                    disabled={!selectedTerminalId || isHistorySearching} 
                                    className="h-11 px-8 w-full lg:w-auto">
                                <Search className="mr-2 h-4 w-4" />
                                {isHistorySearching ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {hasSearched && (
                <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-4 ">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <History className="h-5 w-5 text-muted-foreground" />
                            Consume History ({consumeHistory.length})
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <DataTable
                            columns={commonColumns}
                            data={consumeHistory}
                            keyExtractor={(row) => row.id}
                            isLoading={isHistorySearching}
                            emptyMessage={isHistorySearching ? "Loading Consume History..." : "No consumption records found for this terminal."}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}