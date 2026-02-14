"use client"

import { useState, useEffect} from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Clock, User, Database, CheckCircle2, FileJson, AlertCircle } from "lucide-react"
import { AuditLog } from "@/type/staff"
import { useAppToast } from "@/hooks/use-app-toast"
import { cn } from "@/lib/utils"


interface ActivityDrawerProps {
  log: AuditLog | null
  isOpen: boolean
  onClose: () => void
}

// --- HELPER FUNCTION: PARSE TABLE AFFECTED ---
const parseAffectedTables = (raw: string | string[] | null | undefined): string[] => {
    if (!raw) return [];

    if (Array.isArray(raw)) {
        // CASE 1: It's already a real array
        return raw.map(String);
    }

    if (typeof raw === 'string') {
        try {
            // CASE 2: Try parsing as JSON array string (e.g. '["TableA", "TableB"]')
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.map(String);
            }
            return [String(parsed)];
        } catch (e) {
            // CASE 3: It's a comma-separated string (e.g. "TableA, TableB")
            // The regex removes brackets [] and quotes " if they exist
            return raw.replace(/[\[\]"]/g, '').split(',');
        }
    }

    return [];
};

export function ActivityDrawer({ log, isOpen, onClose }: ActivityDrawerProps) {
  const  toast = useAppToast()
  const [activeTab, setActiveTab] = useState("new");

  // Reset tab to "new" (or "old" if new is empty) when drawer opens
  useEffect(() => {
    if (isOpen && log) {
        setActiveTab(log.newValue ? "new" : "old");
    }
  }, [isOpen, log]);


  if (!log) return null

  // Helper to safely parse the JSON strings in newValue/oldValue
  const parseJsonField = (jsonString: string | null | undefined) => {
      if (!jsonString) return null;
      try {
          return JSON.parse(jsonString);
      } catch (e) {
          return jsonString; 
      }
  };

  const newData = parseJsonField(log.newValue);
  const oldData = parseJsonField(log.oldValue);
  const hasChanges = newData || oldData;

  const affectedTables = parseAffectedTables(log.tableAffected);

  const handleCopy = (text: string) => {
    if (!text) return;

    let contentToCopy = text;
    try {
        const parsed = JSON.parse(text);
        contentToCopy = JSON.stringify(parsed, null, 2);
    } catch (e) {
        console.warn("Could not format JSON, copying raw text.");
    }

    navigator.clipboard.writeText(contentToCopy);
    toast.info("Copied","Formatted JSON copied to clipboard." );
  }

  // Recursive renderer for JSON objects
  const renderDataView = (data: any) => {
      if (!data) return <div className="text-muted-foreground italic text-sm">No data recorded.</div>;

      if (Array.isArray(data)) {
          return (
              <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> {data.length} Items
                  </div>
                  {data.map((item, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm">
                          {renderDataView(item)}
                      </div>
                  ))}
              </div>
          )
      }

      if (typeof data === 'object') {
          return (
              <div className="grid grid-cols-1 gap-y-2">
                  {Object.entries(data).filter(([_, v]) => v !== null && v !== "").map(([key, value]) => (
                      <div key={key} className="flex flex-col border-b border-border/30 pb-2 last:border-0 last:pb-0">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                              {key.replace(/([A-Z])/g, ' $1').trim()} 
                          </span>
                          <span className="text-sm font-medium text-foreground break-all whitespace-pre-wrap">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                      </div>
                  ))}
              </div>
          )
      }

      return <span className="text-sm whitespace-pre-wrap">{String(data)}</span>
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[600px] p-0 border-l shadow-2xl bg-background flex flex-col h-full focus:outline-none"
      >
        {/* HEADER */}
        <div className="p-6 border-b bg-muted/10 shrink-0">
            <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={cn("font-mono text-xs", 
                    log.module === 'CarPark' ? "bg-slate-100 text-slate-700" :
                    log.module === 'Transaction' ? "bg-emerald-50 text-emerald-700" :
                    "bg-background"
                )}>
                    {log.module || "SYSTEM"}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(log.timestamp).toLocaleString()}
                </span>
            </div>
            
            <SheetTitle className="text-xl font-bold leading-tight mb-2 break-words">
                {log.actionType}
            </SheetTitle>
            
            <SheetDescription className="text-sm text-foreground/80 mb-2">
                {log.description}
            </SheetDescription>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> 
                    <span className="font-medium text-foreground">{log.userName}</span>
                    <span>({log.userRole || "User"})</span>
                </div>
                {log.tableAffected && (
                    <div className="flex flex-wrap gap-1.5 ml-auto justify-end max-w-[250px]">
                        {affectedTables.map((table, idx) => (
                            <Badge 
                                key={idx} 
                                variant="outline" 
                                className="font-mono text-[10px] bg-muted/50 border-indigo-200 text-indigo-700 dark:text-indigo-300 px-2 py-0.5"
                            >
                                <Database className="h-3 w-3 mr-1 opacity-70" />
                                {table.trim()}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* CONTENT */}
        <ScrollArea className="flex-1">
            <div className="p-6">
                {hasChanges ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="new" disabled={!newData}>New / Current Value</TabsTrigger>
                            <TabsTrigger value="old" disabled={!oldData}>Previous Value</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="new" className="mt-0">
                            <div className="rounded-xl border bg-card p-5 shadow-sm max-h-[50vh] overflow-y-auto scrollbar-hide border-indigo-100/50 mx-2">
                                {renderDataView(newData)}
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="old" className="mt-0">
                            <div className="rounded-xl border bg-muted/30 p-5 shadow-inner max-h-[45vh] overflow-y-auto scrollbar-hide mx-2">
                                {renderDataView(oldData)}
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                        <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No data changes recorded for this action.</p>
                    </div>
                )}
            </div>
        </ScrollArea>

        {/* FOOTER */}
        <div className="p-4 border-t bg-muted/5 flex gap-2 shrink-0">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleCopy(activeTab === "new" ? (log.newValue || "") : (log.oldValue || ""))}
                disabled={activeTab === "new" ? !log.newValue : !log.oldValue}
                className="flex-1 gap-2">
                <FileJson className="h-3.5 w-3.5" /> 
                Copy {activeTab === "new" ? "New" : "Previous"} JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
                Close
            </Button>
        </div>

      </SheetContent>
    </Sheet>
  )
}