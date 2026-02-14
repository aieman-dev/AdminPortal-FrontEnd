"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, RefreshCw, Lock, ArrowRight, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordDisplayProps {
  invoiceNo: string
  currentPassword: string
  newPassword?: string | null
  onReset: () => void
  isResetting: boolean
  resetSuccess: boolean
}

export function PasswordDisplay({
  invoiceNo,
  currentPassword,
  newPassword,
  onReset,
  isResetting,
  resetSuccess,
}: PasswordDisplayProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  return (
    <Card className="overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md">
      {/* 1. Enhanced Header with Background */}
      <CardHeader className="border-b bg-muted/30 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <CardTitle className="text-base font-semibold">Security Password</CardTitle>
                    <p className="text-xs text-muted-foreground">Manage access credentials</p>
                </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invoice</span>
                <span className="font-mono text-sm font-medium">{invoiceNo}</span>
            </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 p-6">
        
        {/* Success Alert - softer design */}
        {resetSuccess && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-900 dark:text-emerald-300 flex items-center gap-4 py-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-800">
                    <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <AlertDescription className="font-medium">
                    Password successfully reset. Please update the user.
                </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* LEFT: Current Password (Visually muted) */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                    {resetSuccess ? "Previous Password" : "Current Password"}
                </Label>
                <div className="relative group">
                    <div className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 transition-all",
                        resetSuccess 
                            ? "bg-gray-100 border-gray-200 text-gray-400 dark:bg-zinc-900 dark:border-zinc-800" 
                            : "bg-white border-gray-200 text-foreground shadow-sm"
                    )}>
                        <div className="p-2 bg-muted/50 rounded-lg">
                            <Key className="h-5 w-5 opacity-50" />
                        </div>
                        <div className="flex-1">
                            <p className={cn(
                                "font-mono text-2xl tracking-widest font-semibold", 
                                resetSuccess && "line-through decoration-gray-400 decoration-2"
                            )}>
                                {currentPassword}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: New Password (Highlighted & Actionable) */}
            <div className="space-y-3">
                <Label className={cn(
                    "text-xs font-semibold uppercase tracking-wider ml-1 transition-colors",
                    resetSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}>
                    New Password
                </Label>
                
                <div className={cn(
                    "relative flex items-center gap-3 rounded-xl border p-4 transition-all duration-300",
                    resetSuccess 
                        ? "bg-emerald-50/50 border-emerald-200 ring-2 ring-emerald-500/20 dark:bg-emerald-900/10 dark:border-emerald-800" 
                        : "bg-gray-50 border-dashed border-gray-300 dark:bg-zinc-900 dark:border-zinc-800"
                )}>
                    {resetSuccess && newPassword ? (
                        <>
                           {/* Icon */}
                           <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400 animate-in zoom-in duration-300">
                                <Key className="h-5 w-5" />
                           </div>
                           
                           {/* Text */}
                           <div className="flex-1">
                               <p className="font-mono text-2xl tracking-widest font-bold text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-500">
                                   {newPassword}
                               </p>
                           </div>

                           {/* Badge & Copy Action */}
                           <div className="flex items-center gap-2">
                                <span className="hidden sm:inline-flex h-6 items-center rounded-full bg-emerald-200 px-2.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200">
                                    New
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                                    onClick={handleCopy}
                                    title="Copy Password"
                                >
                                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                           </div>
                        </>
                    ) : (
                        /* Empty State */
                        <>
                            <div className="p-2 bg-muted/30 rounded-lg">
                                <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                            </div>
                            <div className="flex-1">
                                <p className="font-mono text-xl tracking-widest text-muted-foreground/30 select-none">
                                    ------
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end border-t pt-6 mt-2">
          <Button 
            onClick={onReset} 
            disabled={isResetting} 
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/10 font-medium h-11 px-6"
          >
            {isResetting ? (
                <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset Password
                </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}