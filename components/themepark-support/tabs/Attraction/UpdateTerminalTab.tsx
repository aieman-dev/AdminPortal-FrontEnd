// components/it-poswf/tabs/Attraction/UpdateTerminalTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Pencil, Settings } from "lucide-react"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { type Terminal } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"

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
                        modifiedDate: new Date().toISOString().slice(0, 19).replace("T", " ")
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
          <div className="space-y-2">
            <Label htmlFor="terminal-search" className="text-sm font-medium">
              Search Terminal
            </Label>
            <div className="flex gap-2">
              <Input
                id="terminal-search"
                placeholder="Enter terminal name or UUID"
                value={terminalSearchTerm}
                onChange={(e) => setTerminalSearchTerm(e.target.value)}
                className="h-11"
              />
              <Button onClick={handleTerminalSearch} disabled={isTerminalSearching} className="h-11 px-8">
                <Search className="mr-2 h-4 w-4" />
                {isTerminalSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Terminal Name</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>Terminal Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Modified Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No terminals found
                    </TableCell>
                  </TableRow>
                ) : (
                  terminals.map((terminal) => (
                    <TableRow key={terminal.id}>
                      <TableCell className="font-medium">{terminal.terminalName}</TableCell>
                      <TableCell className="font-mono text-sm">{terminal.uuid}</TableCell>
                      <TableCell>{terminal.terminalType}</TableCell>
                      <TableCell>
                        <StatusBadge status={terminal.status} />
                      </TableCell>
                      <TableCell>{terminal.modifiedDate}</TableCell>
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
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Terminal Name
                </Label>
                <Input
                  id="edit-name"
                  value={editingTerminal.terminalName}
                  className="h-11"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-uuid" className="text-sm font-medium">
                  UUID
                </Label>
                <Input
                  id="edit-uuid"
                  value={editingTerminal.uuid}
                  onChange={(e) => setEditingTerminal({ ...editingTerminal, uuid: e.target.value })}
                  className="h-11 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-sm font-medium">
                  Terminal Type
                </Label>
                <Select
                  value={editingTerminal.terminalType}
                  disabled
                >
                  <SelectTrigger id="edit-type" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POS">POS</SelectItem>
                    <SelectItem value="Kiosk">Kiosk</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                  value={editingTerminal.status}
                  disabled
                >
                  <SelectTrigger id="edit-status" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleTerminalUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Terminal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}