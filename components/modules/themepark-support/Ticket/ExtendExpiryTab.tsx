"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, SearchX, Clock, Save } from "lucide-react"
import { type ExtendTicketData } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { SearchField } from "@/components/shared-components/search-field"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"

export default function ExtendExpiryTab() {
  const toast = useAppToast()
  const isMobile = useIsMobile()

  const [extendSearchQuery, setExtendSearchQuery] = useState("")
  const [extendSearchResult, setExtendSearchResult] = useState<ExtendTicketData[]>([])
  const [isExtendSearching, setIsExtendSearching] = useState(false)
  
  // Store datetime objects directly
  const [editedDates, setEditedDates] = useState<Record<string, Date>>({})
  const [isUpdatingTicketNo, setIsUpdatingTicketNo] = useState<string | null>(null);

  // Mobile Sheet State
  const [selectedTicket, setSelectedTicket] = useState<ExtendTicketData | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleExtendSearch = async (query?: string) => {
    const term = query !== undefined ? query : extendSearchQuery;

    if (!term) return

    if (query !== undefined) setExtendSearchQuery(query);

    setIsExtendSearching(true)
    setExtendSearchResult([]) 
    setEditedDates({}) 

    try {
      const response = await itPoswfService.findExtendableTickets(extendSearchQuery.trim());

      if (response.success && response.data) {
        const liveTickets = response.data;
        setExtendSearchResult(liveTickets); 
        
        const initialDates: Record<string, Date> = {}
        liveTickets.forEach((ticket) => {
          // Initialize with current expiry
          initialDates[ticket.ticketNo] = new Date(ticket.expiryDate)
        })
        setEditedDates(initialDates)
        
        if (liveTickets.length === 0) {
             toast.info("Search Complete", "No extendable tickets found.");
        }
      } else {
        toast.error("Search Failed", response.error || "Could not retrieve ticket list.");
      }
    } catch (error) {
      console.error("Extend Search Error:", error);
      toast.error("Network Error", "Failed to connect.");
    } finally {
      setIsExtendSearching(false)
    }
  }

  useAutoSearch(handleExtendSearch);

  const handleDateTimeChange = (ticketNo: string, newDate: Date | undefined) => {
      if (newDate) {
          setEditedDates(prev => ({ ...prev, [ticketNo]: newDate }));
      }
  }

  const handleUpdate = async (ticketNo: string) => {
    const originalTicket = extendSearchResult.find(t => t.ticketNo === ticketNo);
    const newExpiryDateObj = editedDates[ticketNo];

    if (!originalTicket || !newExpiryDateObj) return;
    
    // Format to ISO string for API (adjust for local timezone to preserve user selection)
    const offset = newExpiryDateObj.getTimezoneOffset()
    const localDate = new Date(newExpiryDateObj.getTime() - (offset * 60 * 1000))
    const isoString = localDate.toISOString().slice(0, 19); 

    setIsUpdatingTicketNo(ticketNo);

    try {
        const payload = {
            TrxNo: extendSearchQuery.trim(), 
            ticketsToUpdate: [{
                ticketNo: originalTicket.ticketNo,
                ticketName: originalTicket.ticketName,
                effectiveDate: originalTicket.effectiveDate, 
                expiryDate: isoString, 
                lastValidDate: originalTicket.lastValidDate, 
            }],
        };

        const response = await itPoswfService.updateTicketExpiry(payload);

        if (response.success) {
            setExtendSearchResult(prev => prev.map(t => 
                t.ticketNo === ticketNo ? { ...t, expiryDate: isoString } : t
            ));
            toast.success("Success", `Expiry date updated for ticket ${ticketNo}.`);
        } else {
            throw new Error(response.error || "Update failed.");
        }
    } catch (error) {
        toast.error("Update Failed", error instanceof Error ? error.message : "Error.");
    } finally {
        setIsUpdatingTicketNo(null);
    }
  }

  const openMobileSheet = (ticket: ExtendTicketData) => {
      setSelectedTicket(ticket);
      setIsSheetOpen(true);
  }

  // Define columns
  const columns: TableColumn<ExtendTicketData>[] = [
      { header: "Ticket No", accessor: "ticketNo", className: "font-medium pl-6" },
      { header: "Ticket Name", accessor: "ticketName" },
      { header: "Effective Date", accessor: "effectiveDate", cell: (val) => (val as string).split('T')[0], className: isMobile ? "hidden" : "" },
      { 
          header: "New Expiry Date", 
          accessor: "ticketNo", 
          className: isMobile ? "hidden" : "min-w-[320px]",
          cell: (ticketNo, row) => {
              const isTicketUpdating = isUpdatingTicketNo === ticketNo;
              const dateObj = editedDates[ticketNo as string];
              return (
                  <div className="flex items-center gap-3">
                      <div className="w-[140px]">
                          <DatePicker date={dateObj} setDate={(d) => handleDateTimeChange(ticketNo as string, d)} disabled={isTicketUpdating}/>
                      </div>
                      <div>
                          <TimePicker date={dateObj} setDate={(d) => handleDateTimeChange(ticketNo as string, d)} disabled={isTicketUpdating}/>
                      </div>
                  </div>
              )
          }
      },
      {
          header: "Action",
          accessor: "ticketNo",
          className: "text-right",
          cell: (ticketNo, row) => {
              const isTicketUpdating = isUpdatingTicketNo === ticketNo;
              if (isMobile) {
                  return (
                      <Button size="sm" onClick={() => openMobileSheet(row)} variant="outline">
                          Edit Expiry
                      </Button>
                  )
              }

              return (
                  <Button size="sm" onClick={() => handleUpdate(ticketNo as string)} disabled={isTicketUpdating}>
                    {isTicketUpdating ? "Updating..." : "Update"}
                  </Button>
              )
          }
      }
  ];

  return (
    <>
      <Card>
        <CardContent>
          <div>
            <SearchField 
                label="Invoice No. "
                placeholder="Enter invoice"
                value={extendSearchQuery}
                onChange={setExtendSearchQuery}
                onSearch={() => handleExtendSearch()}
                isSearching={isExtendSearching}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Ticket Information
          </div>
          
          <DataTable
            columns={columns}
            data={extendSearchResult}
            keyExtractor={(row) => row.ticketNo}
            isLoading={isExtendSearching}
            emptyIcon={SearchX}
            emptyTitle="No Tickets Found"
            emptyMessage={extendSearchQuery ? "No extendable tickets found for this invoice." : "Enter an invoice number to search."}
          />
        </CardContent>
      </Card>
    
    {/* MOBILE EDIT SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl px-0">
            {selectedTicket && (
                <div className="p-6 space-y-6">
                    <SheetHeader className="text-left">
                        <SheetTitle>Update Expiry Date</SheetTitle>
                        <SheetDescription>
                            Editing ticket <span className="font-mono text-foreground font-medium">{selectedTicket.ticketNo}</span>
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>New Expiry Date</Label>
                            <DatePicker 
                                date={editedDates[selectedTicket.ticketNo]} 
                                setDate={(d) => handleDateTimeChange(selectedTicket.ticketNo, d)} 
                                className="w-full h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New Expiry Time</Label>
                            <div className="p-2 border rounded-lg flex justify-center bg-muted/20">
                                <TimePicker 
                                    date={editedDates[selectedTicket.ticketNo]} 
                                    setDate={(d) => handleDateTimeChange(selectedTicket.ticketNo, d)} 
                                />
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="pt-4">
                        <Button 
                            className="w-full h-12 text-base" 
                            onClick={() => handleUpdate(selectedTicket.ticketNo)}
                            disabled={isUpdatingTicketNo === selectedTicket.ticketNo}
                        >
                            {isUpdatingTicketNo === selectedTicket.ticketNo ? "Updating..." : "Confirm Update"}
                        </Button>
                    </SheetFooter>
                </div>
            )}
        </SheetContent>
      </Sheet>
    </>
  )
}