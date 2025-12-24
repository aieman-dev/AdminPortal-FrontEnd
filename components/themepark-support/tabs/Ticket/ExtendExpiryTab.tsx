"use client"

import { useState, useEffect, use } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, SearchX } from "lucide-react"
import { type ExtendTicketData } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"

export default function ExtendExpiryTab() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('search')

  const [extendSearchQuery, setExtendSearchQuery] = useState("")
  const [extendSearchResult, setExtendSearchResult] = useState<ExtendTicketData[]>([])
  const [isExtendSearching, setIsExtendSearching] = useState(false)
  
  // Store datetime objects directly
  const [editedDates, setEditedDates] = useState<Record<string, Date>>({})
  const [isUpdatingTicketNo, setIsUpdatingTicketNo] = useState<string | null>(null);

  const handleExtendSearch = async (queryOverride?: string) => {
    const term = queryOverride !== undefined ? queryOverride : extendSearchQuery;

    if (!term) return

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
             toast({ title: "Search Complete", description: "No extendable tickets found." });
        }
      } else {
        toast({ title: "Search Failed", description: response.error || "Could not retrieve ticket list.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Extend Search Error:", error);
      toast({ title: "Network Error", description: "Failed to connect.", variant: "destructive" });
    } finally {
      setIsExtendSearching(false)
    }
  }

  useEffect(() => {
    if (urlQuery) {
      setExtendSearchQuery(urlQuery)
      handleExtendSearch(urlQuery) 
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

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
    const isoString = localDate.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss

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
            toast({ title: "Success", description: `Expiry date updated for ticket ${ticketNo}.` });
        } else {
            throw new Error(response.error || "Update failed.");
        }
    } catch (error) {
        toast({ title: "Update Failed", description: error instanceof Error ? error.message : "Error.", variant: "destructive" });
    } finally {
        setIsUpdatingTicketNo(null);
    }
  }

  // Define columns
  const columns: TableColumn<ExtendTicketData>[] = [
      { header: "Ticket No", accessor: "ticketNo", className: "font-medium pl-6" },
      { header: "Ticket Name", accessor: "ticketName" },
      { header: "Effective Date", accessor: "effectiveDate", cell: (val) => (val as string).split('T')[0] },
      { 
          header: "New Expiry Date", 
          accessor: "ticketNo", 
          className: "min-w-[320px]",
          cell: (ticketNo, row) => {
              const isTicketUpdating = isUpdatingTicketNo === ticketNo;
              const dateObj = editedDates[ticketNo as string];
              
              return (
                  <div className="flex items-center gap-3">
                      {/* Date Picker */}
                      <div className="w-[140px]">
                          <DatePicker 
                            date={dateObj} 
                            setDate={(d) => handleDateTimeChange(ticketNo as string, d)} 
                            disabled={isTicketUpdating}
                          />
                      </div>
                      {/* Time Picker */}
                      <div>
                          <TimePicker 
                            date={dateObj} 
                            setDate={(d) => handleDateTimeChange(ticketNo as string, d)} 
                            disabled={isTicketUpdating}
                          />
                      </div>
                  </div>
              )
          }
      },
      {
          header: "Action",
          accessor: "ticketNo",
          className: "text-right",
          cell: (ticketNo) => {
              const isTicketUpdating = isUpdatingTicketNo === ticketNo;
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
                label="Invoice No. / Transaction No"
                placeholder="Enter invoice or transaction number"
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
    </>
  )
}