// components/modules/simulation/TransactionSimulator.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/formatter"
import { 
    Calculator, ArrowRight, CheckCircle2, AlertTriangle, 
    Wallet, History, RotateCcw, Play 
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- MOCK DATA ---
const MOCK_USER = {
    name: "Simulation User",
    email: "sim.user@icity.com",
    currentBalance: 150.00,
    status: "Active"
}

export function TransactionSimulator() {
    // 1. State for Inputs
    const [amount, setAmount] = useState<string>("")
    const [isSimMode, setIsSimMode] = useState(true)
    
    // 2. State for Simulation Result
    const [simResult, setSimResult] = useState<{
        prevBalance: number;
        deduction: number;
        newBalance: number;
        isAllowed: boolean;
    } | null>(null)

    const [isLive, setIsLive] = useState(false) // Fake "Live" processing state

    // 3. The "Dry Run" Logic
    const runSimulation = () => {
        const val = parseFloat(amount) || 0;
        const newBal = MOCK_USER.currentBalance - val;
        
        setSimResult({
            prevBalance: MOCK_USER.currentBalance,
            deduction: val,
            newBalance: newBal,
            isAllowed: newBal >= 0
        })
    }

    const reset = () => {
        setSimResult(null)
        setAmount("")
        setIsLive(false)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: Input Form */}
            <Card className={cn("transition-all duration-500", isSimMode ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-green-500")}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Transaction Input</CardTitle>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-bold uppercase", isSimMode ? "text-amber-600" : "text-gray-400")}>Simulate</span>
                            <Switch checked={!isSimMode} onCheckedChange={(c) => { setIsSimMode(!c); reset(); }} />
                            <span className={cn("text-xs font-bold uppercase", !isSimMode ? "text-green-600" : "text-gray-400")}>Live</span>
                        </div>
                    </div>
                    <CardDescription>
                        {isSimMode ? "Predict outcomes without affecting database." : "REAL MODE: Actions will be committed."}
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    {/* Mock User Profile */}
                    <div className="p-4 bg-muted/30 rounded-lg border flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">{MOCK_USER.name}</p>
                            <p className="text-xs text-muted-foreground">{MOCK_USER.email}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Current Wallet</p>
                            <p className="text-xl font-bold text-indigo-600">{formatCurrency(MOCK_USER.currentBalance)}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Deduction Amount (RM)</Label>
                        <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="text-lg font-medium"
                        />
                    </div>
                </CardContent>

                <CardFooter className="bg-muted/10 border-t p-6 flex justify-between">
                    <Button variant="ghost" onClick={reset}>Reset</Button>
                    
                    {isSimMode ? (
                        <Button onClick={runSimulation} className="bg-amber-500 hover:bg-amber-600 text-white w-40">
                            <Calculator className="mr-2 h-4 w-4" /> Calculate Impact
                        </Button>
                    ) : (
                        <Button className="bg-green-600 hover:bg-green-700 text-white w-40">
                            <Play className="mr-2 h-4 w-4" /> Commit Live
                        </Button>
                    )}
                </CardFooter>
            </Card>


            {/* RIGHT COLUMN: The "Impact Card" (The Simulation Result) */}
            <div className="space-y-6">
                
                {/* 1. STATE: WAITING */}
                {!simResult && (
                    <div className="h-full border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground p-12">
                        <History className="h-12 w-12 mb-4 opacity-20" />
                        <p>Enter an amount and run simulation to see impact analysis.</p>
                    </div>
                )}

                {/* 2. STATE: RESULT CALCULATED */}
                {simResult && (
                    <Card className={cn(
                        "overflow-hidden shadow-lg animate-in slide-in-from-right-4 duration-500 border-2", 
                        simResult.isAllowed ? "border-green-100 dark:border-green-900/30" : "border-red-100 dark:border-red-900/30"
                    )}>
                        {/* Simulation Header */}
                        <div className={cn(
                            "p-4 flex items-center justify-between",
                            simResult.isAllowed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                        )}>
                            <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
                                {simResult.isAllowed ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                {simResult.isAllowed ? "Transaction Valid" : "Insufficient Funds"}
                            </div>
                            <Badge variant="outline" className="bg-white/50 border-transparent text-current">
                                Projected Result
                            </Badge>
                        </div>

                        <CardContent className="p-6 space-y-6">
                            
                            {/* VISUAL MATH */}
                            <div className="flex items-center justify-between text-sm">
                                <div className="text-center">
                                    <div className="text-muted-foreground mb-1">Current</div>
                                    <div className="font-mono text-lg">{formatCurrency(simResult.prevBalance)}</div>
                                </div>
                                <div className="text-muted-foreground">-</div>
                                <div className="text-center">
                                    <div className="text-muted-foreground mb-1">Cost</div>
                                    <div className="font-mono text-lg text-red-500">{formatCurrency(simResult.deduction)}</div>
                                </div>
                                <ArrowRight className="text-muted-foreground" />
                                <div className="text-center">
                                    <div className="text-muted-foreground mb-1">Projected</div>
                                    <div className={cn("font-mono text-xl font-bold", simResult.isAllowed ? "text-green-600" : "text-red-600")}>
                                        {formatCurrency(simResult.newBalance)}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* PRE-FLIGHT CHECKLIST */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pre-Flight Checks</h4>
                                
                                <CheckItem label="User Status Active" pass={true} />
                                <CheckItem label="Sufficient Balance" pass={simResult.isAllowed} />
                                <CheckItem label="Terminal Online" pass={true} />
                            </div>

                            {/* ERROR MESSAGE IF FAILED */}
                            {!simResult.isAllowed && (
                                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-md border border-red-100">
                                    <strong>Blocker:</strong> User does not have enough credit balance to perform this transaction. Transaction will fail if attempted.
                                </div>
                            )}

                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

function CheckItem({ label, pass }: { label: string, pass: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/80">{label}</span>
            {pass ? (
                <span className="text-green-600 flex items-center text-xs font-bold gap-1"><CheckCircle2 size={14} /> PASS</span>
            ) : (
                <span className="text-red-600 flex items-center text-xs font-bold gap-1"><AlertTriangle size={14} /> FAIL</span>
            )}
        </div>
    )
}