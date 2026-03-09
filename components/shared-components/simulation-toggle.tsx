"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { FlaskConical, AlertTriangle, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Props {
    isSimulating: boolean;
    onToggle: (val: boolean) => void;
}

export function SimulationToggle({ isSimulating, onToggle }: Props) {
    const [isOpen, setIsOpen] = useState(false)

    // Handle the switch click intercept
    const handleRequestChange = () => {
        setIsOpen(true)
    }

    // Execute the toggle only after confirmation
    const handleConfirm = () => {
        onToggle(!isSimulating)
        setIsOpen(false)
    }

    return (
        <>
            <div className={cn(
                "flex items-center justify-between gap-3 px-4 py-2 rounded-lg border transition-all duration-300 w-full md:w-auto",
                isSimulating 
                    ? "bg-amber-50 border-amber-200 shadow-inner dark:bg-amber-950/30 dark:border-amber-800" 
                    : "bg-background border-border"
            )}>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-1.5 rounded-full transition-colors",
                        isSimulating ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                    )}>
                        <FlaskConical size={16} />
                    </div>
                    <div className="flex flex-col">
                        <Label 
                            onClick={handleRequestChange}
                            className={cn("text-xs font-bold uppercase tracking-wider cursor-pointer", isSimulating ? "text-amber-700" : "text-muted-foreground")}
                        >
                            {isSimulating ? "Simulation Mode" : "Live Mode"}
                        </Label>
                    </div>
                </div>
                
                {/* We control the checked state, but intercept the change event manually via the div/label click or overlay */}
                <Switch 
                    checked={isSimulating} 
                    onCheckedChange={handleRequestChange} 
                    className="data-[state=checked]:bg-amber-500"
                />
            </div>

            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {isSimulating ? (
                                <>
                                    <Play className="h-5 w-5 text-green-600" /> Return to Live Mode?
                                </>
                            ) : (
                                <>
                                    <FlaskConical className="h-5 w-5 text-amber-600" /> Enter Simulation Mode?
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isSimulating ? (
                                <span>
                                    You are about to exit Simulation Mode. <br/><br/>
                                    <strong>Warning:</strong> Any further transactions will be <strong>REAL</strong>, will deduct actual credits, and will be recorded in the database.
                                </span>
                            ) : (
                                <span>
                                    You are entering Simulation Mode. <br/><br/>
                                    In this mode, transactions are calculated mathematically but <strong>NOT saved</strong> to the database. No money will be deducted.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleConfirm}
                            className={isSimulating ? "bg-green-600 hover:bg-green-700" : "bg-amber-500 hover:bg-amber-600"}
                        >
                            {isSimulating ? "Yes, Go Live" : "Yes, Start Simulation"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}