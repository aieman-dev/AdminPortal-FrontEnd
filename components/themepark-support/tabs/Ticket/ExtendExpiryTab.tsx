// components/it-poswf/tabs/Ticket/ExtendExpiryTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Calendar } from "lucide-react"
import { type ExtendTicketData } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"

export default function ExtendExpiryTab() {
  const { toast } = useToast()

  const [extendSearchQuery, setExtendSearchQuery] = useState("")
  const [extendSearchResult, setExtendSearchResult] = useState<ExtendTicketData[]>([])
  const [isExtendSearching, setIsExtendSearching] = useState(false)
  const [editedDates, setEditedDates] = useState<Record<string, string>>({})
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
        
        const initialDates: Record<string, string> = {}
        liveTickets.forEach((ticket) => {
          initialDates[ticket.ticketNo] = ticket.expiryDate.slice(0, 16) 
        })
        setEditedDates(initialDates)
        
        if (liveTickets.length === 0) {
             toast({
                title: "Search Complete",
                description: "No extendable tickets found for this invoice/transaction.",
            });
        }
      } else {
        setExtendSearchResult([])
        toast({
          title: "Search Failed",
          description: response.error || "Could not retrieve ticket list.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Extend Expiry Search Error:", error);
      setExtendSearchResult([]);
      toast({
        title: "Network Error",
        description: "Failed to connect to the search service.",
        variant: "destructive"
      });
    } finally {
      setIsExtendSearching(false)
    }
  }
  
  const handleDateChange = (ticketNo: string, newDate: string) => {
    setEditedDates((prev) => ({
      ...prev,
      [ticketNo]: newDate,
    }))
  }

  const handleUpdate = async (ticketNo: string) => {
    const originalTicket = extendSearchResult.find(t => t.ticketNo === ticketNo);
    const newExpiryDate = editedDates[ticketNo];

    if (!originalTicket || !newExpiryDate) {
        toast({ title: "Error", description: "Missing ticket data or new expiry date.", variant: "destructive" });
        return;
    }
    
    setIsUpdatingTicketNo(ticketNo);

    try {
        const payload = {
            TrxNo: extendSearchQuery.trim(), 
            ticketsToUpdate: [{
                ticketNo: originalTicket.ticketNo,
                ticketName: originalTicket.ticketName,
                effectiveDate: originalTicket.effectiveDate, 
                expiryDate: newExpiryDate + ":00", 
                lastValidDate: originalTicket.lastValidDate, 
            }],
        };

        const response = await itPoswfService.updateTicketExpiry(payload);

        if (response.success && response.data) {
            setExtendSearchResult(prev => prev.map(t => 
                t.ticketNo === ticketNo ? { ...t, expiryDate: newExpiryDate + ":00" } : t
            ));
            
            toast({
                title: "Success",
                description: `Expiry date updated for ticket ${ticketNo}.`,
            });
        } else {
            throw new Error(response.error || "Update failed.");
        }
    } catch (error) {
        console.error("Update Error:", error);
        toast({
            title: "Update Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred during update.",
            variant: "destructive"
        });
    } finally {
        setIsUpdatingTicketNo(null);
    }
  }

  return (
    <>
      <Card>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="extend-search" className="text-sm font-medium">
              Invoice No. / Transaction No
            </Label>
            <div className="flex gap-2">
              <Input
                id="extend-search"
                placeholder="Enter invoice or transaction number"
                value={extendSearchQuery}
                onChange={(e) => setExtendSearchQuery(e.target.value)}
                className="h-11"
              />
              <Button onClick={handleExtendSearch} disabled={isExtendSearching} className="h-11 px-8">
                <Search className="mr-2 h-4 w-4" />
                {isExtendSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {extendSearchResult.length > 0 && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Ticket Information
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket No</TableHead>
                    <TableHead>Ticket Name</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Last Valid Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extendSearchResult.map((ticket) => {
                    const isTicketUpdating = isUpdatingTicketNo === ticket.ticketNo;
                    return (
                    <TableRow key={ticket.ticketNo}>
                        <TableCell className="font-medium">{ticket.ticketNo}</TableCell>
                        <TableCell>{ticket.ticketName}</TableCell>
                        <TableCell>{ticket.effectiveDate}</TableCell>
                        <TableCell>
                          <Input
                            type="datetime-local"
                            value={editedDates[ticket.ticketNo] || ticket.expiryDate.slice(0, 16)} 
                            onChange={(e) => handleDateChange(ticket.ticketNo, e.target.value)}
                            className="h-9 w-full min-w-[200px]"
                            disabled={isTicketUpdating}
                          />
                        </TableCell>
                        <TableCell>{ticket.lastValidDate}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdate(ticket.ticketNo)}
                            disabled={isTicketUpdating || !editedDates[ticket.ticketNo]}
                          >
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