"use client"

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, Save, RotateCcw } from "lucide-react";
import { DashboardAction } from "@/config/dashboard";
import { SIDEBAR_NAVIGATION } from "@/config/navigation";
import { useAppToast } from "@/hooks/use-app-toast";
import { cn } from "@/lib/utils";

interface Props {
    actions: DashboardAction[];
}

const STORAGE_KEY = "user_quick_actions_v1";
const MAX_ITEMS = 6;

export function QuickAccess({ actions: defaultActions }: Props) {
    const router = useRouter();
    const toast = useAppToast();
    
    const [currentActions, setCurrentActions] = useState<DashboardAction[]>(defaultActions);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
    
    const allOptions = useMemo(() => {
        const options: DashboardAction[] = [];
        SIDEBAR_NAVIGATION.forEach(nav => {
            if (nav.href && !nav.children) {
                options.push({ label: nav.name, path: nav.href, icon: nav.icon || Settings2, color: "text-slate-600" });
            }
            if (nav.children) {
                nav.children.forEach(child => {
                    options.push({ label: child.name, path: child.href, icon: nav.icon || Settings2, color: "text-slate-600" });
                });
            }
        });
        return options;
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const savedPaths: string[] = JSON.parse(saved);
                const recoveredActions = savedPaths
                    .map(path => {
                        const inDefault = defaultActions.find(d => d.path === path);
                        if (inDefault) return inDefault;
                        return allOptions.find(o => o.path === path);
                    })
                    .filter(Boolean) as DashboardAction[];
                
                if (recoveredActions.length > 0) setCurrentActions(recoveredActions);
            } catch (e) { console.error(e); }
        }
    }, [defaultActions, allOptions]);

    const openEdit = () => {
        setSelectedPaths(currentActions.map(a => a.path));
        setIsEditOpen(true);
    };

    const toggleSelection = (path: string) => {
        // 1. Check if we are removing the item (always allowed)
        if (selectedPaths.includes(path)) {
            setSelectedPaths(prev => prev.filter(p => p !== path));
            return;
        }
        // 2. Check limit BEFORE setting state
        if (selectedPaths.length >= MAX_ITEMS) {
            toast.error("Limit Reached", `You can only select up to ${MAX_ITEMS} items.`);
            return;
        }
        // 3. Add item
        setSelectedPaths(prev => [...prev, path]);
        };

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPaths));
        const newActions = selectedPaths
            .map(path => defaultActions.find(d => d.path === path) || allOptions.find(o => o.path === path))
            .filter(Boolean) as DashboardAction[];

        setCurrentActions(newActions);
        setIsEditOpen(false);
        toast.success("Saved", "Quick actions updated.");
    };

    const handleReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        setCurrentActions(defaultActions);
        setSelectedPaths(defaultActions.map(a => a.path));
        setIsEditOpen(false);
        toast.info("Reset", "Restored default actions.");
    };

    if (!currentActions || currentActions.length === 0) return null;

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
                {/* FIX: Increased width to 600px for better spacing */}
                <DialogContent className="sm:max-w-4xl h-[80vh] sm:h-auto flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Customize Quick Access</DialogTitle>
                        <DialogDescription>Select up to {MAX_ITEMS} items to display on your dashboard.</DialogDescription>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                            {allOptions.map((option) => {
                                const isSelected = selectedPaths.includes(option.path);
                                const displayName = SHORT_NAMES[option.label] || option.label;
                                return (
                                    <div 
                                        key={option.path} 
                                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isSelected ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-muted"}`}
                                        onClick={() => toggleSelection(option.path)}
                                    >
                                        <Checkbox checked={isSelected} id={option.path} className="mt-1 pointer-events-none" />

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
                    </ScrollArea>

                    <DialogFooter className="gap-2 sm:gap-2 mt-2">
                        <Button variant="outline" onClick={handleReset} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset Default</Button>
                        <Button onClick={handleSave} disabled={selectedPaths.length === 0} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"><Save className="h-4 w-4" /> Save Changes ({selectedPaths.length}/{MAX_ITEMS})</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}