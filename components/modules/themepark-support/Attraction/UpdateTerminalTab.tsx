// components/themepark-support/tabs/Attraction/UpdateTerminalTab.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Pencil, Clock, SearchX, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { type Terminal } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { formatDate } from "@/lib/formatter";
import { SearchField } from "@/components/shared-components/search-field"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table" 
import { useIsMobile } from "@/hooks/use-mobile"

// --- HELPER COMPONENT ---
const UuidHoverCell = ({ uuid, row, toast }: { uuid: string, row: Terminal, toast: any }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(uuid);
        setIsCopied(true);
        toast.success("Copied", "UUID copied to clipboard");
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
                <span className="font-mono text-[13px] text-muted-foreground truncate block cursor-pointer hover:text-indigo-600 transition-colors">
                    {uuid}
                </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-[320px] p-0 overflow-hidden border shadow-xl pointer-events-auto">
                <div className="bg-muted/50 px-4 py-3 border-b">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Terminal Identifier
                        </span>
                        <Badge variant="outline" className="h-5 text-[9px] font-mono bg-background">
                            ID: {row.id}
                        </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-foreground truncate">{row.terminalName}</h4>
                </div>

                <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                            Full UUID
                        </p>
                        <div className="p-2.5 bg-muted rounded-md border border-border/50 break-all font-mono text-[11px] text-foreground leading-relaxed">
                            {uuid}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleCopy}
                    className="w-full bg-indigo-600 px-4 py-2.5 flex items-center justify-between text-white hover:bg-indigo-700 transition-colors"
                >
                    <span className="text-[10px] font-medium uppercase tracking-wider">
                        {isCopied ? "Copied to Clipboard" : "Copy UUID"}
                    </span>
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            </HoverCardContent>
        </HoverCard>
    );
}

// --- MAIN COMPONENT ---
export default function UpdateTerminalTab() {
  const toast = useAppToast()
  const isMobile = useIsMobile()

  // 1. STATE
  const [terminalSearchTerm, setTerminalSearchTerm] = useState("")
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [terminalTypes, setTerminalTypes] = useState<string[]>([]);
  const [isTerminalSearching, setIsTerminalSearching] = useState(false)
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // 2. LOGIC
  const handleTerminalSearch = async (query?: string) => {
    const term = query !== undefined ? query : terminalSearchTerm;
    setIsTerminalSearching(true)
    setTerminals([]) 

    try {
        const response = await itPoswfService.searchTerminals(term.trim());

        if (response.success && response.data) {
            setTerminals(response.data);
            if (response.data.length === 0) toast.info( "Search Complete", "No terminals found." );
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

    useEffect(() => {
      const fetchTypes = async () => {
          const types = await itPoswfService.getTerminalTypes();
          if (types && types.length > 0) {
              setTerminalTypes(types);
          }
      };
      fetchTypes();
  }, []);

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
        const response = await itPoswfService.updateTerminalUUID(
            editingTerminal.id, 
            editingTerminal.uuid, 
            editingTerminal.terminalType
        );

        if (response.success) {
            const updatedTerminals = terminals.map((t) =>
                t.id === editingTerminal.id
                    ? { 
                        ...t, 
                        uuid: editingTerminal.uuid, 
                        terminalType: editingTerminal.terminalType,
                        modifiedDate: new Date().toISOString() 
                    }
                    : t,
            );
            
            setTerminals(updatedTerminals);
            setIsDialogOpen(false);
            setEditingTerminal(null);
            toast.success("Success", response.data?.message || "Terminal UUID updated successfully");
        } else {
            throw new Error(response.error || "API returned an error during update.");
        }
    } catch (error: any) {
        console.error("Terminal Update Error:", error);
        toast.error( "Update Failed", error.message || "An unexpected network error occurred.");
    } finally {
        setIsUpdating(false);
    }
  }

  // 3. COLUMNS
  const terminalColumns: TableColumn<Terminal>[] = useMemo (() => [
      { 
        header: "Terminal Name", 
        accessor: "terminalName", 
        className: "font-medium pl-6 w-[25%] min-w-[200px]",
      },
      { 
        header: "UUID", 
        accessor: "uuid", 
        className: "px-4 w-[25%] min-w-[180px]", 
        cell: (val, row) =><UuidHoverCell uuid={val as string} row={row} toast={toast} />
      },
      { 
        header: "Type", 
        accessor: "terminalType", 
        className: "px-4 w-[15%] min-w-[100px] text-center",
        cell: (val) => <span className="trim-text">{val?.toString().trim()}</span> 
      },
      { 
        header: "Status", 
        accessor: "status", 
        className: "px-4 w-[15%] min-w-[100px] text-center",
        cell: (val) => <StatusBadge status={val} /> 
      },
      { 
        header: "Modified Date", 
        accessor: "modifiedDate", 
        className: "px-4 w-[15%] min-w-[140px] text-center",
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
        className: "text-right pr-6 w-[100px]",
        cell: (_, row) => (
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )
      }
  ], []);
    

  // Shared form content for both Dialog and Sheet
  const editFormContent = editingTerminal && (
    <div className="space-y-4 py-4 px-6 flex-1 overflow-y-auto scrollbar-hide">
      <div className="space-y-2">
        <Label htmlFor="edit-name" className="text-sm font-medium">Terminal Name</Label>
        <Input id="edit-name" value={editingTerminal.terminalName} className="h-11" disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-uuid" className="text-sm font-medium">UUID</Label>
        <Input id="edit-uuid" value={editingTerminal.uuid} onChange={(e) => setEditingTerminal({ ...editingTerminal, uuid: e.target.value })} className="h-11 font-mono text-base md:text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-type" className="text-sm font-medium">Terminal Type</Label>
        <Select 
            value={editingTerminal.terminalType || ""} 
            onValueChange={(val) => setEditingTerminal({ ...editingTerminal, terminalType: val })}
        >
            <SelectTrigger id="edit-type" className="h-11">
                <SelectValue placeholder="Select Terminal Type" />
            </SelectTrigger>
            
            <SelectContent>
                {terminalTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                        {type}
                    </SelectItem>
                ))}

                {editingTerminal.terminalType && !terminalTypes.includes(editingTerminal.terminalType) && (
                    <SelectItem value={editingTerminal.terminalType}>
                        {editingTerminal.terminalType} (Legacy)
                    </SelectItem>
                )}
            </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-status" className="text-sm font-medium">Status</Label>
        <div className="flex items-center h-11 px-3 rounded-md border border-input bg-muted/50 cursor-not-allowed">
            <StatusBadge status={editingTerminal.status?.trim()}  />
        </div>
      </div>
    </div>
  );
    
  // 4. RENDER UI
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
            skeletonRowCount={30}
            emptyTitle="No Terminals Found"
            emptyMessage={terminalSearchTerm ? `No results found for "${terminalSearchTerm}"` : "Enter a search term to find terminals."}
          />
        </CardContent>
      </Card>
      
      {isMobile ? (
        <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <SheetContent side="bottom" className="h-[85dvh] p-0 flex flex-col rounded-t-2xl bg-background" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader className="p-6 border-b text-left bg-muted/5 shrink-0">
              <SheetTitle className="text-xl">Edit Terminal</SheetTitle>
              <SheetDescription>Update the terminal information below.</SheetDescription>
            </SheetHeader>
            
            {editFormContent}

            <SheetFooter className="p-4 border-t flex-col gap-3 shrink-0 bg-muted/5">
              <LoadingButton 
                  onClick={handleTerminalUpdate} 
                  isLoading={isUpdating}
                  loadingText="Updating..."
                  className="w-full h-11 text-base shadow-md"
              >
                  Update Terminal
              </LoadingButton>
              <Button variant="outline" className="w-full h-11" onClick={() => setIsDialogOpen(false)} disabled={isUpdating}>
                  Cancel
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden flex flex-col gap-0 rounded-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="p-6 border-b bg-muted/5 shrink-0">
              <DialogTitle className="text-xl">Edit Terminal</DialogTitle>
              <DialogDescription>Update the terminal information below.</DialogDescription>
            </DialogHeader>
            
            {editFormContent}

            <DialogFooter className="p-6 border-t bg-muted/5 shrink-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUpdating} className="h-11">
                  Cancel
              </Button>
              <LoadingButton 
                  onClick={handleTerminalUpdate} 
                  isLoading={isUpdating}
                  loadingText="Updating..."
                  className="min-w-[150px] h-11"
              >
                  Update Terminal
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}