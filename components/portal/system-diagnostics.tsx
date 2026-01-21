"use client"

import { useState, useEffect } from "react"
import { Activity, CheckCircle2, XCircle, Server, Wifi, Play, Loader2, AlertTriangle, Copy, RefreshCw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppToast } from "@/hooks/use-app-toast"

interface DiagnosticProps {
    autoRun?: boolean; 
    className?: string;
    errorDetails?: any;
}

export function SystemDiagnostics({ autoRun = false, className, errorDetails }: DiagnosticProps) {
  const toast = useAppToast()
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResult(null);
    try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = await res.json();
        setResult(data);
    } catch (error) {
        setResult({ status: "error", checks: [], message: "Failed to run diagnostics" });
    } finally {
        setIsRunning(false);
    }
  }

  useEffect(() => {
      if (autoRun) runDiagnostics();
  }, [autoRun]);

  const handleCopyReport = () => {
      if (!result) return;

      const errorSection = errorDetails 
        ? `\n[Error Details]\n${typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : errorDetails}`
        : '';
      
      const text = `[System Diagnostic Report]
        Time: ${new Date().toLocaleString()}
        Status: ${result.status.toUpperCase()}

        Checks:
        ${result.checks.map((c: any) => `- ${c.name}: ${c.status} (${c.latency})`).join('\n')}

        ${result.status === 'critical' ? 'Recommendation: Check Backend Service or VPN.' : ''}`;
      
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.info("Copied", "Diagnostic report copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
  }

  const getLatencyColor = (latencyStr: string) => {
      const ms = parseInt(latencyStr);
      if (isNaN(ms)) return "text-muted-foreground";
      if (ms < 200) return "text-green-600 font-bold";
      if (ms < 800) return "text-amber-600 font-bold";
      return "text-red-600 font-bold";
  };

  return (
    <Card className={`w-full border-2 ${result?.status === 'critical' ? 'border-red-100 dark:border-red-900/30' : 'border-muted/50'} ${className}`}>
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-muted/10 px-4 py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" /> 
                System Health
            </CardTitle>
            
            <div className="flex gap-2">
                {/* Re-Scan Button */}
                <Button variant="ghost" size="icon" onClick={runDiagnostics} disabled={isRunning} className="h-7 w-7">
                    <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                </Button>
                
                {/* Manual Trigger (if not autoRun) */}
                {!autoRun && !result && !isRunning && (
                    <Button variant="outline" size="sm" onClick={runDiagnostics} className="h-7 text-xs px-2">
                        <Play className="h-3 w-3 mr-1" /> Run Scan
                    </Button>
                )}
            </div>
        </CardHeader>
        
        <CardContent>
            {/* Empty State */}
            {!result && !isRunning && (
                <div className="text-sm text-muted-foreground py-4 text-center bg-muted/20 rounded-md">
                    Click "Run Scan" to check backend connectivity.
                </div>
            )}

            {/* Loading state */}
            {isRunning && (
                <div className="py-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Pinging Backend Services...</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                        <div className="h-full bg-indigo-500 animate-progress origin-left w-full"></div>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    
                    {/* Status Header */}
                    <div className="flex items-center justify-between">
                        <Badge variant={result.status === "healthy" ? "outline" : "destructive"} 
                               className={`${result.status === "healthy" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                            {result.status?.toUpperCase() || "UNKNOWN"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                    </div>

                    {/* Service Checks */}
                    <div className="space-y-2">
                        {result.checks && result.checks.map((check: any) => (
                            <div key={check.id} className="flex items-center justify-between p-2 rounded-md bg-card border shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-full ${check.status === "UP" ? "bg-green-100" : "bg-red-100"}`}>
                                        {check.id === 'backend' ? <Server className={`h-3.5 w-3.5 ${check.status === "UP" ? "text-green-600" : "text-red-600"}`} /> 
                                        : <Wifi className={`h-3.5 w-3.5 ${check.status === "UP" ? "text-green-600" : "text-red-600"}`} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold">{check.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{check.message}</span>
                                    </div>
                                </div>
                                <div className={`text-xs font-mono ${getLatencyColor(check.latency)}`}>
                                    {check.latency}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Actions Footer */}
                    <div className="flex flex-col gap-2 pt-2">
                        {/* Recommendation Logic */}
                        {result.status === 'critical' && (
                            <div className="flex gap-2 p-3 bg-red-50 text-red-800 text-xs rounded-md border border-red-100">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold block mb-1">Recommendation:</span>
                                    {result.checks.find((c:any) => c.id === 'backend')?.status === 'DOWN' 
                                    ? "Backend Service is unreachable. Restart the .NET Service or check VPN." 
                                    : "System is degraded. Check server logs."}
                                </div>
                            </div>
                        )}

                        {/* Copy Button */}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full gap-2 text-xs h-8"
                            onClick={handleCopyReport}
                        >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? "Copied" : "Copy Report for Support"}
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  )
}