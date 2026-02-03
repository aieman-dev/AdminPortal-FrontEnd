"use client"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Copy, Clock, User, Terminal, CheckCircle2, FileText, AlertCircle } from "lucide-react"
import { AuditLog } from "@/type/staff"
import { useToast } from "@/hooks/use-toast"

interface ActivityDrawerProps {
  log: AuditLog | null
  isOpen: boolean
  onClose: () => void
}

export function ActivityDrawer({ log, isOpen, onClose }: ActivityDrawerProps) {
  const { toast } = useToast()

  if (!log) return null

  // --- 1. RECOVERY HELPER: Extracts valid objects from broken JSON ---
  const tryRecoverJson = (brokenJson: string) => {
      const validObjects: any[] = [];
      let braceCount = 0;
      let startIndex = -1;

      // Scan the string for complete { ... } blocks
      for (let i = 0; i < brokenJson.length; i++) {
          const char = brokenJson[i];
          
          if (char === '{') {
              if (braceCount === 0) startIndex = i;
              braceCount++;
          } else if (char === '}') {
              braceCount--;
              // If we closed a root-level object
              if (braceCount === 0 && startIndex !== -1) {
                  try {
                      // Extract substring and try parsing just this chunk
                      const potentialObj = brokenJson.substring(startIndex, i + 1);
                      validObjects.push(JSON.parse(potentialObj));
                  } catch (e) {
                      // Ignore parse errors for chunks
                  }
                  startIndex = -1;
              }
          }
      }
      return validObjects.length > 0 ? validObjects : null;
  }

  // --- 2. PARSE LOGIC ---
  const parseLogData = (rawDesc: string) => {
    const outputIndex = rawDesc.indexOf("Output:")
    
    // Action Name
    const actionPart = outputIndex > -1 ? rawDesc.substring(0, outputIndex).replace("Action:", "").trim() : rawDesc
    
    // Payload Parsing
    let payload = null
    let rawJson = ""
    let isPartial = false; // Flag to indicate if data was recovered

    if (outputIndex > -1) {
        rawJson = rawDesc.substring(outputIndex + 7).trim()
        try {
            // Try standard parse first
            payload = JSON.parse(rawJson)
        } catch (e) {
            // If standard parse fails (e.g. truncated "..."), try recovery
            const recovered = tryRecoverJson(rawJson);
            if (recovered) {
                payload = recovered;
                isPartial = true;
            } else {
                payload = "Raw text data only."
            }
        }
    }

    return { actionTitle: actionPart, payload, rawJson, isPartial }
  }

  const { actionTitle, payload, rawJson, isPartial } = parseLogData(log.description)

  const handleCopy = () => {
    if (rawJson) {
        navigator.clipboard.writeText(rawJson)
        toast({ title: "Copied", description: "Raw payload copied to clipboard." })
    }
  }

  // --- 3. RENDERER ---
  const renderReadablePayload = (data: any) => {
      // HANDLE ARRAYS (List of Roles, Packages, etc.)
      if (Array.isArray(data)) {
          return (
              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> 
                        {data.length} {isPartial ? "Recovered Items" : "Items"}
                    </div>
                    {isPartial && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-600 bg-amber-50 border-amber-200">
                            Truncated Data
                        </Badge>
                    )}
                  </div>
                  
                  {data.map((item, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm hover:bg-muted/50 transition-colors">
                          {renderReadablePayload(item)}
                      </div>
                  ))}
                  
                  {isPartial && (
                      <div className="text-xs text-muted-foreground italic pl-2 border-l-2 border-muted">
                          ... additional items were truncated by server.
                      </div>
                  )}
              </div>
          )
      }

      // HANDLE OBJECTS (Single item details)
      if (typeof data === 'object' && data !== null) {
          const entries = Object.entries(data).filter(([_, v]) => v !== null && v !== "");
          if (entries.length === 0) return <span className="text-muted-foreground italic">Empty details</span>;

          return (
              <div className="grid grid-cols-1 gap-y-2">
                  {entries.map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:gap-4 border-b border-border/30 pb-2 last:border-0 last:pb-0">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 min-w-[100px]">
                              {key.replace(/([A-Z])/g, ' $1').trim()} 
                          </span>
                          <span className="text-sm font-medium text-foreground break-all sm:text-right">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                      </div>
                  ))}
              </div>
          )
      }

      // HANDLE STRINGS (Fallback)
      return <span className="text-sm whitespace-pre-wrap">{String(data)}</span>
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[500px] p-0 border-l shadow-2xl bg-background flex flex-col h-full focus:outline-none"
      >
        {/* HEADER */}
        <div className="p-6 border-b bg-muted/10">
            <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="font-mono text-xs bg-background">{log.module || "SYSTEM"}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(log.timestamp).toLocaleString()}
                </span>
            </div>
            
            <SheetTitle className="text-lg font-bold leading-tight mb-1 break-words">{actionTitle}</SheetTitle>
            
            <SheetDescription className="flex items-center gap-2 text-sm text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> 
                <span className="text-muted-foreground">By:</span> {log.userName}
            </SheetDescription>
        </div>

        {/* CONTENT */}
        <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
                
                <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-4 text-foreground">
                        <FileText className="h-4 w-4 text-blue-600" /> Action Details
                    </h4>
                    
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        {payload && payload !== "Raw text data only." ? (
                            renderReadablePayload(payload)
                        ) : (
                            // Fallback for completely unparseable text
                            <div className="flex flex-col gap-2">
                                <span className="text-sm text-muted-foreground whitespace-pre-wrap font-mono text-xs bg-muted/30 p-3 rounded-md border border-border/50">
                                    {rawJson || "No detailed output."}
                                </span>
                                {rawJson && (
                                    <div className="flex items-center gap-2 text-amber-600 text-xs mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Data format invalid or truncated.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </ScrollArea>

        {/* FOOTER */}
        <div className="p-4 border-t bg-muted/5">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!rawJson} className="w-full gap-2 text-xs">
                <Terminal className="h-3.5 w-3.5" /> Copy Raw Payload
            </Button>
        </div>

      </SheetContent>
    </Sheet>
  )
}