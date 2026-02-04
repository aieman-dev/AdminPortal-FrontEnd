"use client"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Clock, User, Database, CheckCircle2, FileJson, AlertCircle } from "lucide-react"
import { AuditLog } from "@/type/staff"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ActivityDrawerProps {
  log: AuditLog | null
  isOpen: boolean
  onClose: () => void
}

export function ActivityDrawer({ log, isOpen, onClose }: ActivityDrawerProps) {
  const { toast } = useToast()

  if (!log) return null

  // Helper to safely parse the JSON strings in newValue/oldValue
  const parseJsonField = (jsonString: string | null | undefined) => {
      if (!jsonString) return null;
      try {
          return JSON.parse(jsonString);
      } catch (e) {
          return jsonString; // Return as plain text if parse fails
      }
  };

  const newData = parseJsonField(log.newValue);
  const oldData = parseJsonField(log.oldValue);
  const hasChanges = newData || oldData;

  const handleCopy = (text: string) => {
    if (text) {
        navigator.clipboard.writeText(text)
        toast({ title: "Copied", description: "Data copied to clipboard." })
    }
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
                    <div className="flex items-center gap-1.5 ml-auto font-mono bg-muted px-1.5 py-0.5 rounded">
                        <Database className="h-3 w-3" /> {log.tableAffected}
                    </div>
                )}
            </div>
        </div>

        {/* CONTENT */}
        <ScrollArea className="flex-1">
            <div className="p-6">
                {hasChanges ? (
                    <Tabs defaultValue={newData ? "new" : "old"} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="new" disabled={!newData}>New / Current Value</TabsTrigger>
                            <TabsTrigger value="old" disabled={!oldData}>Previous Value</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="new" className="mt-0">
                            <div className="rounded-xl border bg-card p-5 shadow-sm">
                                {renderDataView(newData)}
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="old" className="mt-0">
                            <div className="rounded-xl border bg-muted/30 p-5 shadow-inner">
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
            <Button variant="outline" size="sm" onClick={() => handleCopy(log.newValue || "")} disabled={!log.newValue} className="flex-1 gap-2">
                <FileJson className="h-3.5 w-3.5" /> Copy JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
                Close
            </Button>
        </div>

      </SheetContent>
    </Sheet>
  )
}