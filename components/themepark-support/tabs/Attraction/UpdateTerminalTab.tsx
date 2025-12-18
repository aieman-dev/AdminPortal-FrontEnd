"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { type Terminal } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton";
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-GB', { 
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true 
  }).format(date);
};

export default function UpdateTerminalTab() {
  const { toast } = useToast()

  const [terminalSearchTerm, setTerminalSearchTerm] = useState("")
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [isTerminalSearching, setIsTerminalSearching] = useState(false)
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleTerminalSearch = async () => {
    setIsTerminalSearching(true)
    setTerminals([]) 

    try {
        const response = await itPoswfService.searchTerminals(terminalSearchTerm.trim());

        if (response.success && response.data) {
            setTerminals(response.data);
            if (response.data.length === 0) {
                toast({ title: "Search Complete", description: "No terminals found." });
            }
        } else {
            setTerminals([]);
            toast({
                title: "Search Failed",
                description: response.error || "Could not retrieve terminals.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("Terminal Search Error:", error);
        toast({ title: "Network Error", description: "Failed to connect to search service.", variant: "destructive" });
    } finally {
        setIsTerminalSearching(false)
    }
  }

  const handleEdit = (terminal: Terminal) => {
    setEditingTerminal({ ...terminal })
    setIsDialogOpen(true)
  }

  const handleTerminalUpdate = async () => {
    if (!editingTerminal || !editingTerminal.uuid.trim()) {
        toast({ title: "Validation Error", description: "UUID cannot be empty.", variant: "destructive" });
        return;
    }

    setIsUpdating(true);
    
    try {
        const terminalID = editingTerminal.id; 
        const newUUID = editingTerminal.uuid;

        const response = await itPoswfService.updateTerminalUUID(terminalID, newUUID);

        if (response.success) {
            const updatedTerminals = terminals.map((t) =>
                t.id === terminalID
                    ? { 
                        ...t, 
                        uuid: newUUID, 
                        modifiedDate: new Date().toISOString() 
                    }
                    : t,
            );
            
            setTerminals(updatedTerminals);
            setIsDialogOpen(false);
            setEditingTerminal(null);

            toast({
                title: "Success",
                description: response.data?.message || "Terminal UUID updated successfully",
            });
        } else {
            throw new Error(response.error || "API returned an error during update.");
        }
    } catch (error) {
        console.error("Terminal Update Error:", error);
        toast({
            title: "Update Failed",
            description: error instanceof Error ? error.message : "An unexpected network error occurred.",
            variant: "destructive",
        });
    } finally {
        setIsUpdating(false);
    }
  }
    
  return (
    <>
      <Card>
        <CardContent>
          {/* REPLACED MANUAL INPUT WITH SEARCHFIELD */}
          <div>
              <SearchField 
                label="Search Terminal"
                placeholder="Enter terminal name or UUID"
                value={terminalSearchTerm}
                onChange={setTerminalSearchTerm}
                onSearch={handleTerminalSearch}
                isSearching={isTerminalSearching}
              />
          </div>
        </CardContent>
      </Card>

      {/* Rest of the component (Table, Dialog) remains unchanged */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Terminal Name</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>Terminal Type</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Modified Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 1. LOADING STATE */}
                {isTerminalSearching ? (
                   Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24 rounded-full mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                      </TableRow>
                   ))
                ) : terminals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No terminals found
                    </TableCell>
                  </TableRow>
                ) : (
                  terminals.map((terminal) => (
                    <TableRow key={terminal.id}>
                      <TableCell className="font-medium">{terminal.terminalName}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-600">{terminal.uuid}</TableCell>
                      <TableCell>{terminal.terminalType}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={terminal.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-normal text-xs text-gray-600 bg-gray-100 border-gray-200 gap-1.5 py-1 px-2.5 w-[170px] justify-center mx-auto">
                            <Clock className="w-3.5 h-3.5 opacity-70" />
                            {formatDate(terminal.modifiedDate)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(terminal)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Terminal</DialogTitle>
            <DialogDescription>Update the terminal information below.</DialogDescription>
          </DialogHeader>
          {editingTerminal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">Terminal Name</Label>
                <Input id="edit-name" value={editingTerminal.terminalName} className="h-11" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-uuid" className="text-sm font-medium">UUID</Label>
                <Input id="edit-uuid" value={editingTerminal.uuid} onChange={(e) => setEditingTerminal({ ...editingTerminal, uuid: e.target.value })} className="h-11 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-sm font-medium">Terminal Type</Label>
                <Select value={editingTerminal.terminalType} disabled>
                  <SelectTrigger id="edit-type" className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POS">POS</SelectItem>
                    <SelectItem value="Kiosk">Kiosk</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm font-medium">Status</Label>
                <Select value={editingTerminal.status} disabled>
                  <SelectTrigger id="edit-status" className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUpdating}>Cancel</Button>
            <Button onClick={handleTerminalUpdate} disabled={isUpdating}>{isUpdating ? "Updating..." : "Update Terminal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}