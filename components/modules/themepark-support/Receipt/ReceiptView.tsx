"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Printer, ArrowLeft, CheckCircle2, Building2, FileText, Calendar, User, ShoppingBag, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency, formatDateTime } from "@/lib/formatter"
import { APP_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"

export interface ReceiptItem {
    name: string;
    qty?: number;
    amount: number;
}

export interface ReceiptData {
    invoiceNo: string;
    referenceLabel?: string;
    date: string;
    customerName?: string;
    customerEmail?: string;
    items: ReceiptItem[];
    totalAmount: number;
    status: "Paid" | "Consumed" | "Voided";
}

interface ReceiptViewProps {
    data: ReceiptData;
    onBack?: () => void;
}

export function ReceiptView({ data, onBack }: ReceiptViewProps) {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    };

    return (
        // 1. Reduced min-height and padding for a tighter fit
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 animate-in fade-in zoom-in-95 duration-500">
            
            {/* ACTION BAR - Reduced margin-bottom (mb-4) */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-4 print:hidden">
                <Button variant="outline" onClick={onBack || (() => router.back())} className="gap-2 h-9 px-4 text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9 px-4 text-xs shadow-md shadow-indigo-500/20">
                    <Printer className="h-3.5 w-3.5" /> Print Receipt
                </Button>
            </div>

            {/* RECEIPT CARD */}
            <Card className={cn(
                "w-full max-w-4xl overflow-hidden transition-all duration-300 shadow-2xl",
                
                // 2. High Contrast for Dark Mode
                "bg-white dark:bg-zinc-900 border-none ring-1 ring-black/5 dark:ring-white/10",
                
                "print:shadow-none print:border print:ring-0 print:w-full print:max-w-none print:bg-white print:text-black"
            )}>
                {/* Decorative Top Bar */}
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 print:hidden" />

                <div className="flex flex-col md:flex-row min-h-[450px]">

                    {/* === LEFT PANEL (Info & Branding) === */}
                    <div className={cn(
                        "md:w-5/12 p-6 flex flex-col justify-between relative overflow-hidden",
                        // 3. Subtle Gradient for visual separation
                        "bg-gradient-to-br from-indigo-50/80 to-white dark:from-zinc-900 dark:to-zinc-950",
                        "border-b md:border-b-0 md:border-r border-border/50",
                        "print:w-1/2 print:border-none print:bg-white"
                    )}>
                        {/* Background Blur Effect */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                        <div className="relative z-10 space-y-6">
                            {/* Logo Area */}
                            <div className="flex items-start gap-3">
                                <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-border/50 flex items-center justify-center shrink-0">
                                    <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-extrabold tracking-tight text-foreground uppercase">{APP_NAME}</h1>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Official Receipt</p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                        data.status === "Voided"
                                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50"
                                    )}
                                >
                                    {data.status === "Voided" ? <XCircle className="w-3 h-3 mr-1.5"/> : <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                                    {data.status}
                                </Badge>
                            </div>

                            {/* Details Grid - Compact */}
                            <div className="space-y-4 pt-2">
                                <DetailRow 
                                    icon={FileText} 
                                    label={data.referenceLabel || "Invoice Number"}
                                    value={data.invoiceNo} 
                                    isMono 
                                />
                                <DetailRow 
                                    icon={Calendar} 
                                    label="Date Issued" 
                                    value={formatDateTime(data.date)} 
                                />
                                {data.customerEmail && (
                                    <DetailRow 
                                        icon={User} 
                                        label="Customer" 
                                        value={data.customerName || "Guest"} 
                                        subValue={data.customerEmail} 
                                    />
                                )}
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="mt-auto pt-8 relative z-10 print:hidden">
                            <p className="text-[9px] text-muted-foreground/50 font-medium uppercase tracking-widest">
                                System Generated • {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>

                    {/* === RIGHT PANEL (Items & Total) === */}
                    <div className="md:w-7/12 flex flex-col bg-white dark:bg-zinc-900 print:w-1/2 print:bg-white">
                        
                        {/* List Header */}
                        <div className="p-5 border-b border-border/50 bg-muted/5 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground/80">
                                <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Order Summary</span>
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 border px-2 py-0.5 rounded-full">
                                {data.items.length} Items
                            </span>
                        </div>

                        {/* Scrollable Items */}
                        <ScrollArea className="flex-1 p-0 h-[300px] md:h-auto min-h-[250px]">
                            <div className="p-5 space-y-1">
                                {data.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start group p-2.5 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border/30">
                                        <div className="space-y-0.5 pr-4">
                                            <p className="text-sm font-medium text-foreground leading-snug">{item.name}</p>
                                            {item.qty && item.qty > 1 && (
                                                <Badge variant="secondary" className="h-4 px-1 text-[9px] font-mono text-muted-foreground bg-muted/50 border-border/50 font-normal">
                                                    Qty: {item.qty}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="font-mono text-sm font-bold text-foreground/90">
                                            {formatCurrency(item.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Totals Footer - Distinct Background */}
                        <div className="p-6 bg-muted/5 border-t border-border/50 mt-auto print:bg-transparent print:border-t-2">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium text-foreground">{formatCurrency(data.totalAmount)}</span>
                                </div>
                                
                                <Separator className="border-dashed bg-border/60" />

                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Paid</span>
                                        <span className="text-[9px] text-muted-foreground/50 font-medium">Inc. all taxes</span>
                                    </div>
                                    <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none tracking-tight">
                                        {data.totalAmount > 0 ? formatCurrency(data.totalAmount) : "Consumed"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

function DetailRow({ icon: Icon, label, value, subValue, isMono }: { icon: any, label: string, value: string, subValue?: string, isMono?: boolean }) {
    return (
        <div className="flex items-start gap-3 group">
            <div className="mt-0.5 p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-border/50 shadow-sm text-muted-foreground group-hover:text-indigo-500 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/50 transition-colors">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
                <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-0.5">{label}</p>
                <p className={cn("text-sm font-medium text-foreground", isMono && "font-mono tracking-tight")}>{value}</p>
                {subValue && <p className="text-xs text-muted-foreground break-all mt-0.5">{subValue}</p>}
            </div>
        </div>
    )
}