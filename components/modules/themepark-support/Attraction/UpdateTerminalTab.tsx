// components/themepark-support/tabs/Attraction/UpdateTerminalTab.tsx
"use client"

import { useState,useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Clock, SearchX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { type Terminal } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { formatDate } from "@/lib/formatter";
import { SearchField } from "@/components/shared-components/search-field"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table" 


export default function UpdateTerminalTab() {
  const toast = useAppToast()

  const [terminalSearchTerm, setTerminalSearchTerm] = useState("")
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [isTerminalSearching, setIsTerminalSearching] = useState(false)
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleTerminalSearch = async (query?: string) => {
      // Use the passed query (from AutoSearch) or the state (from Button click)
      const term = query !== undefined ? query : terminalSearchTerm;
      
      if (!term) return;
      if (query !== undefined) setTerminalSearchTerm(query);

    setIsTerminalSearching(true)
    setTerminals([]) 

    try {
        const response = await itPoswfService.searchTerminals(terminalSearchTerm.trim());

        if (response.success && response.data) {
            setTerminals(response.data);
            if (response.data.length === 0) {
                toast.info( "Search Complete", "No terminals found." );
            }
        } else {
            setTerminals([]);
            toast.error("Search Failed", response.error || "Could not retrieve terminals.");
        }
    } catch (error) {
        console.error("Terminal Search Error:", error);
        toast.error("Network Error", "Failed to connect to search service.");
    } finally {
        setIsTerminalSearching(false)
    }
  }

  useAutoSearch(handleTerminalSearch);

  const handleEdit = (terminal: Terminal) => {
    setEditingTerminal({ ...terminal })
    setIsDialogOpen(true)
  }

  const handleTerminalUpdate = async () => {
    if (!editingTerminal || !editingTerminal.uuid.trim()) {
        toast.error("Validation Error", "UUID cannot be empty.");
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

            toast.success("Success", response.data?.message || "Terminal UUID updated successfully",
            );
        } else {
            throw new Error(response.error || "API returned an error during update.");
        }
    } catch (error) {
        console.error("Terminal Update Error:", error);
        toast.error( "Update Failed", error instanceof Error ? error.message : "An unexpected network error occurred.");
    } finally {
        setIsUpdating(false);
    }
  }

  // --- COLUMN DEFINITIONS ---
  const terminalColumns: TableColumn<Terminal>[] = [
      { header: "Terminal Name", accessor: "terminalName", className: "font-medium pl-6" },
      { header: "UUID", accessor: "uuid", cell: (val) => <span className="font-mono text-sm text-gray-600">{val}</span> },
      { header: "Type", accessor: "terminalType" },
      { header: "Status", accessor: "status", className: "text-center", cell: (val) => <StatusBadge status={val} /> },
      { 
          header: "Modified Date", 
          accessor: "modifiedDate", 
          className: "text-center",
          cell: (val) => (
            <Badge variant="outline" className="font-normal text-xs text-gray-600 bg-gray-100 border-gray-200 gap-1.5 py-1 px-2.5 justify-center mx-auto">
                <Clock className="w-3.5 h-3.5 opacity-70" />
                {formatDate(val as string)}
            </Badge>
          ) 
      },
      {
          header: "Action",
          accessor: "id",
          className: "text-right",
          cell: (_, row) => (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )
      }
  ];
    
  return (
    <>
      <Card>
        <CardContent>
          <div>
              <SearchField 
                label="Search Terminal"
                placeholder="Enter terminal name or UUID"
                value={terminalSearchTerm}
                onChange={setTerminalSearchTerm}
                onSearch={() => handleTerminalSearch()}
                isSearching={isTerminalSearching}
              />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={terminalColumns}
            data={terminals}
            keyExtractor={(row) => row.id}
            isLoading={isTerminalSearching}
            emptyIcon={SearchX}
            emptyTitle="No Terminals Found"
            emptyMessage={terminalSearchTerm ? `No results found for "${terminalSearchTerm}"` : "Enter a search term to find terminals."}
          />
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