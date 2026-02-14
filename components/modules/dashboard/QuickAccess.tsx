"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, Save, RotateCcw } from "lucide-react";
import { MasterAction } from "@/config/dashboard"; 
import { useAppToast } from "@/hooks/use-app-toast";
import { cn } from "@/lib/utils";


interface Props {
    availableActions: MasterAction[];
}

const STORAGE_KEY = "user_quick_actions_v1";
const MAX_ITEMS = 6;

export function QuickAccess({ availableActions }: Props) {
    const router = useRouter();
    const toast = useAppToast();
    
    // Default: Show first 6 available actions
    const [currentActions, setCurrentActions] = useState<MasterAction[]>([]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    //  Load preferences BUT filter against permitted actions
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        
        if (saved) {
            try {
                const savedIds: string[] = JSON.parse(saved);
                const validActions = savedIds
                    .map(id => availableActions.find(a => a.id === id))
                    .filter(Boolean) as MasterAction[];
                
                if (validActions.length > 0) {
                    setCurrentActions(validActions);
                    return;
                }
            } catch (e) { 
                console.error("Failed to load quick actions", e); 
            }
        }
        
        setCurrentActions(availableActions.slice(0, 4));
    }, [availableActions]);

    // Open Edit Modal
    const openEdit = () => {
        setSelectedIds(currentActions.map(a => a.id));
        setIsEditOpen(true);
    };

    // Toggle Checkbox
    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(p => p !== id));
        } else {
            if (selectedIds.length >= MAX_ITEMS) {
                toast.error("Limit Reached", `You can only select up to ${MAX_ITEMS} items.`);
                return;
            }
            setSelectedIds(prev => [...prev, id]);
        }
    };

    // Save Changes
    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
        
        // Convert IDs back to Action Objects
        const newActions = selectedIds
            .map(id => availableActions.find(a => a.id === id))
            .filter(Boolean) as MasterAction[];

        setCurrentActions(newActions);
        setIsEditOpen(false);
        toast.success("Saved", "Quick access updated.");
    };

    //  Reset to Default
    const handleReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        
        const defaults = availableActions.slice(0, 4);
        setCurrentActions(defaults);
        setSelectedIds(defaults.map(a => a.id));
        
        setIsEditOpen(false);
        toast.info("Reset", "Restored default view.");
    };

    if (availableActions.length === 0) return null;

    const SHORT_NAMES: Record<string, string> = {
    "Transaction Master": "Transactions",
    "Attraction Master": "Attractions",
    "Ticket Master": "Tickets",
    "Account Master": "Accounts",
    "Package Management": "Packages",
    "New Registration": "New Reg",
    "Season Parking": "Parking",
    "SuperApp Visitor": "Visitors",
    "App New SuperApp": "SuperApp",
    "Whitelist / Blacklist": "Access Lists",
    "Staff Management": "Staff",
};

    return (
        <>
            <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">Quick Access</CardTitle>
                    <Button variant="ghost" size="icon" onClick={openEdit} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Settings2 className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                    {currentActions.map((btn) => (
                        <motion.div key={btn.path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                                variant="outline" 
                                className="w-full h-auto py-3 flex flex-col gap-2 items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all" 
                                onClick={() => router.push(btn.path)}
                            >
                                <btn.icon className={cn("h-5 w-5", btn.color)} />
                                <span className="text-xs font-normal truncate w-full text-center px-1">{btn.label}</span>
                            </Button>
                        </motion.div>
                    ))}
                </CardContent>
            </Card>

            {/* EDIT DIALOG */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="w-[95vw] sm:max-w-4xl h-[90dvh] sm:h-auto flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-4 shrink-0 border-b">
                        <DialogTitle>Customize Quick Access</DialogTitle>
                        <DialogDescription>Select up to {MAX_ITEMS} items to display on your dashboard.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 py-2">
                            {availableActions.map((option) => {
                                const isSelected = selectedIds.includes(option.id);
                                const displayName = SHORT_NAMES[option.label] || option.label;
                                return (
                                    <div 
                                        key={option.id} 
                                        className={cn(
                                            "flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer select-none",
                                            isSelected ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-muted"
                                        )}
                                        onClick={() => toggleSelection(option.id)}
                                    >
                                        <Checkbox checked={isSelected} id={option.id} className="mt-1 pointer-events-none" />

                                        <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
                                            <div className={cn("p-2 bg-background rounded-md shadow-sm border shrink-0", isSelected ? "border-indigo-200" : "")}>
                                                <option.icon className={cn("h-4 w-4", option.color)} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium leading-none truncate">
                                                    {displayName}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground truncate">{option.label}</span> 
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <DialogFooter className="p-4 shrink-0 border-t bg-muted/20 flex flex-col sm:flex-row gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleReset} 
                            className="w-full sm:w-auto gap-2 order-2 sm:order-1"
                        >
                            <RotateCcw className="h-4 w-4" /> Reset Default
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={selectedIds.length === 0} 
                            className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white order-1 sm:order-2"
                        >
                            <Save className="h-4 w-4" /> Save Changes ({selectedIds.length}/{MAX_ITEMS})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}