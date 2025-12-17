"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "lucide-react"
import { type ExtendTicketData } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
// IMPORT SEARCH FIELD
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"

export default function ExtendExpiryTab() {
  const { toast } = useToast()

  const [extendSearchQuery, setExtendSearchQuery] = useState("")
  const [extendSearchResult, setExtendSearchResult] = useState<ExtendTicketData[]>([])
  const [isExtendSearching, setIsExtendSearching] = useState(false)
  
  // Store datetime objects directly now (simpler than ISO string juggling)
  const [editedDates, setEditedDates] = useState<Record<string, Date>>({})
  const [isUpdatingTicketNo, setIsUpdatingTicketNo] = useState<string | null>(null);

  const handleExtendSearch = async () => {
    if (!extendSearchQuery) return
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

  return (
    <>
      <Card>
        <CardContent>
          <div className="pt-6">
            <SearchField 
                label="Invoice No. / Transaction No"
                placeholder="Enter invoice or transaction number"
                value={extendSearchQuery}
                onChange={setExtendSearchQuery}
                onSearch={handleExtendSearch}
                isSearching={isExtendSearching}
            />
          </div>
        </CardContent>
      </Card>

      {extendSearchResult.length > 0 && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" /> Ticket Information
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket No</TableHead>
                    <TableHead>Ticket Name</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead className="min-w-[320px]">New Expiry Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extendSearchResult.map((ticket) => {
                    const isTicketUpdating = isUpdatingTicketNo === ticket.ticketNo;
                    const dateObj = editedDates[ticket.ticketNo];

                    return (
                    <TableRow key={ticket.ticketNo}>
                        <TableCell className="font-medium">{ticket.ticketNo}</TableCell>
                        <TableCell>{ticket.ticketName}</TableCell>
                        <TableCell>{ticket.effectiveDate.split('T')[0]}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                              {/* Date Picker */}
                              <div className="w-[140px]">
                                  <DatePicker 
                                    date={dateObj} 
                                    setDate={(d) => handleDateTimeChange(ticket.ticketNo, d)} 
                                    disabled={isTicketUpdating}
                                  />
                              </div>
                              
                              {/* Time Picker */}
                              <div>
                                  <TimePicker 
                                    date={dateObj} 
                                    setDate={(d) => handleDateTimeChange(ticket.ticketNo, d)} 
                                    disabled={isTicketUpdating}
                                  />
                              </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleUpdate(ticket.ticketNo)} disabled={isTicketUpdating}>
                            {isTicketUpdating ? "Updating..." : "Update"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}