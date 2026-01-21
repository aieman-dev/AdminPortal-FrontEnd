// app/portal/car-park/registration/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form" 
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
    Search, QrCode, Mail, Save, RefreshCw, Loader2, 
    User, Car, Building2, CreditCard, Users, MapPin, Hash, Briefcase,
    CheckCircle2, ArrowRight
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth";
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAppToast } from "@/hooks/use-app-toast"
import { CarParkPhase, CarParkUnit, CarParkPackage } from "@/type/car-park";
import { carParkService } from "@/services/car-park-services"
import { cn } from "@/lib/utils"

// --- Validation Schema ---
const registrationSchema = z.object({
    searchType: z.enum(["qr", "email"]),
    searchTerm: z.string().min(1, "Search term is required"),
    
    // User Info (Strictly Required except Company/Office)
    accId: z.number().optional(),
    userEmail: z.string().email("Invalid email"),
    name: z.string().min(1, "Full Name is required"),
    nric: z.string().min(1, "NRIC/Passport is required"),
    mobileContact: z.string().min(1, "Mobile number is required"),
    officeContact: z.string().optional(),
    companyName: z.string().optional(),
    
    plate1: z.string().min(1, "At least one car plate is required"),
    plate2: z.string().optional(),
    plate3: z.string().optional(),

    tandemName: z.string().optional(),
    tandemNric: z.string().optional(),
    tandemMobile: z.string().optional(),
    tandemPlate1: z.string().optional(),
    
    phase: z.string().min(1, "Phase is required"),
    unitNo: z.string().min(1, "Unit No is required"),
    userType: z.enum(["Staff", "Tenant", "Non-Tenant", "Owner"]),
    staffId: z.string().optional(),
    department: z.string().optional(),

    parkingType: z.enum(["Normal", "Reserved"]),
    bayNo: z.string().optional(),
    seasonPackage: z.string().optional(),
    remarks: z.string().optional(),
    isMobileQr: z.boolean().default(false),
    isHomestay: z.boolean().default(false), 
    isLpr: z.boolean().default(false),
    amanoExpiryDate: z.string().optional(),
  
    isTandem: z.boolean().default(false),
    amanoCardNo: z.string().optional(),
});

type FormValues = z.infer<typeof registrationSchema>;

export default function NewRegistrationPage() {
    const { user } = useAuth();
    const toast = useAppToast();
    const [isVerifying, setIsVerifying] = useState(false);

    const [phases, setPhases] = useState<CarParkPhase[]>([]);
    const [units, setUnits] = useState<CarParkUnit[]>([]);
    const [seasonPackages, setSeasonPackages] = useState<CarParkPackage[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [formDataToSubmit, setFormDataToSubmit] = useState<FormValues | null>(null);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = "auto"; };
    }, []);

    // 1. Load Phases on Mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [phaseData, packageData] = await Promise.all([
                    carParkService.getPhases(),
                    carParkService.getPackages()
                ]);
                setPhases(phaseData);
                setSeasonPackages(packageData);
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        loadData();
    }, []);

    // 2. Handle Phase Selection
    const handlePhaseChange = async (value: string) => {
        // Update form
        setValue("phase", value, { shouldValidate: true });
        
        // Reset Unit
        setValue("unitNo", ""); 
        setUnits([]);
        
        // Fetch Units
        setLoadingUnits(true);
        try {
            const data = await carParkService.getUnits(value);
            setUnits(data);
        } catch (error) {
            console.error("Failed to load units");
        } finally {
            setLoadingUnits(false);
        }
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(registrationSchema) as any,
        defaultValues: {
            searchType: "email",
            searchTerm: "",
            userEmail: "",
            name: "",
            nric: "",
            mobileContact: "",
            plate1: "",
            userType: "Owner",
            parkingType: "Reserved",
            bayNo: "",
            seasonPackage: "",
            remarks: "",
            isMobileQr: false,
            isHomestay: false, 
            isLpr: false,
            amanoExpiryDate: "",
            isTandem: false,
            phase: "",
            unitNo: "",
            staffId: "",
            department: ""
            
        }
    });

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;
    
    const searchType = watch("searchType");
    const isTandemChecked = watch("isTandem");
    const userType = watch("userType");
    const parkingType = watch("parkingType");

    // --- Handlers ---
    const handleVerify = async () => {
        const type = form.getValues("searchType");
        const term = form.getValues("searchTerm");

        if (!term || !type) { 
        toast.info("Input Required", "Please select a search mode and enter a term."); 
        return; 
    }

        setIsVerifying(true);
        try {
            const result = await carParkService.verifyUser(type, term);
            if (result.success && result.data) {
                const d = result.data;
                setValue("accId", d.accId);
                setValue("userEmail", d.email, { shouldValidate: true });
                setValue("name", d.name, { shouldValidate: true });
                setValue("mobileContact", d.mobile, { shouldValidate: true });

                toast.success("Verified", "User data populated.");
            }
        } catch (error) {
            toast.error("Failed", "User not found.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleClear = () => {
        reset({
            searchType: "email",
            searchTerm: "",
            userType: "Owner",
            parkingType: "Reserved",
            isTandem: false
        });
        toast.info("Reset", "Form cleared.");
    };

    // Step 1: Validate and Open Modal
    const onPreSubmit: SubmitHandler<FormValues> = (data) => {
        setFormDataToSubmit(data);
        setIsConfirmOpen(true);
    };

    // Step 2: Actually Submit
    const handleFinalSubmit = async () => {
        if (!formDataToSubmit) return;
        setIsSubmitting(true);
        try {
            const adminId = user?.id || 0;
            await carParkService.submitRegistration(formDataToSubmit, adminId);
            toast.success("Registration Successful", "New season pass created.");
            setIsConfirmOpen(false);
        } catch (error) {
            toast.error("Error", error instanceof Error ? error.message : "Submission failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Modern Styles ---
    // Using a more distinct input style with white bg and shadow-sm
    const inputClass = "h-9 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 text-sm shadow-sm transition-all";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-[1400px] mx-auto overflow-hidden bg-gray-50/50 dark:bg-zinc-950/50">
            
            {/* 1. STICKY HEADER */}
            <div className="flex-shrink-0 px-8 py-5 bg-background/80 backdrop-blur-md border-b z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-500">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">New Registration</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage parking access and user details</p>
                </div>

                {/* SEARCH TOGGLE & BAR */}
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border shadow-sm w-full md:w-auto">
                    
                    {/* Toggle Switch */}
                    <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setValue("searchType", "email")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2",
                                searchType === 'email' 
                                    ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Mail size={14} /> Email
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue("searchType", "qr")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2",
                                searchType === 'qr' 
                                    ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <QrCode size={14} /> QR
                        </button>
                    </div>
                    
                    <div className="w-px h-6 bg-border" />
                    
                    <div className="relative">
                        <Input 
                            placeholder={searchType === "email" ? "user@example.com" : "QR Code"} 
                            {...register("searchTerm")}
                            className="h-9 border-0 bg-transparent focus-visible:ring-0 w-full md:w-[280px] text-sm shadow-none pl-0"
                            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                        />
                    </div>

                    <Button 
                        type="button" 
                        onClick={handleVerify} 
                        disabled={isVerifying} 
                        size="sm" 
                        className="h-8 px-5 bg-black hover:bg-gray-800 text-white font-medium rounded-lg shadow-sm transition-transform active:scale-95"
                    >
                        {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                    </Button>
                </div>
            </div>

            {/* 2. SCROLLABLE FORM AREA */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
                <div className="max-w-5xl mx-auto space-y-8 pb-10">
                    
                    {/* === CARD 1: PRIMARY HOLDER INFO === */}
                    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                        <CardHeader className="px-8 pt-8 pb-4 border-b border-border/40">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                        <User className="h-5 w-5" />
                                    </div>
                                    Primary Holder Information
                                </CardTitle>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">Active Status</Badge>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="p-8 grid gap-8">
                            {/* Account Email */}
                            <div>
                                <Label className={labelClass}>Account Email</Label>
                                <Input {...register("userEmail")} readOnly className={`${inputClass} bg-gray-50/50 border-dashed text-gray-500 cursor-not-allowed`} />
                            </div>

                            {/* Personal Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <Label className={labelClass}>Full Name <span className="text-red-500">*</span></Label>
                                    <Input {...register("name")} className={inputClass} placeholder="Full Name" />
                                    {errors.name && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.name.message}</span>}
                                </div>
                                <div>
                                    <Label className={labelClass}>NRIC / Passport <span className="text-red-500">*</span></Label>
                                    <Input {...register("nric")} className={inputClass} placeholder="ID Number" />
                                    {errors.nric && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.nric.message}</span>}
                                </div>
                                <div>
                                    <Label className={labelClass}>Company Name</Label>
                                    <Input {...register("companyName")} className={inputClass} placeholder="Company (Optional)" />
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className={labelClass}>Mobile No. (H/P) <span className="text-red-500">*</span></Label>
                                    <Input {...register("mobileContact")} type="tel" className={inputClass} placeholder="+60..." />
                                    {errors.mobileContact && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.mobileContact.message}</span>}
                                </div>
                                <div> 
                                    <Label className={labelClass}>Office Contact</Label>
                                    <Input {...register("officeContact")} type="tel" className={inputClass} placeholder="+60" />
                                </div>
                            </div>

                            <Separator />

                            {/* Unit & Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className={labelClass}><MapPin className="h-3 w-3 inline mr-1" /> Phase</Label>
                                            <Select onValueChange={handlePhaseChange} value={watch("phase")}>
                                                <SelectTrigger className={cn(inputClass, "w-full")}>
                                                    <span className="truncate text-left block w-full"> 
                                                        <SelectValue placeholder="Select Phase" />
                                                    </span>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {phases.map((p) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.phase && <span className="text-[10px] text-red-500">{errors.phase.message}</span>}
                                        </div>
                                        <div>
                                            <Label className={labelClass}><Hash className="h-3 w-3 inline mr-1" /> Unit No.</Label>
                                            <Select onValueChange={(v) => setValue("unitNo", v, { shouldValidate: true })}
                                                disabled={!watch("phase") || loadingUnits}
                                                value={watch("unitNo")}
                                                >
                                                <SelectTrigger className={inputClass}>
                                                    <SelectValue placeholder={loadingUnits ? "Loading..." : "Select Unit"} />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {units.map((u) => (
                                                        <SelectItem key={u.id} value={String(u.id)}>
                                                            {u.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.unitNo && <span className="text-[10px] text-red-500">{errors.unitNo.message}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className={labelClass}>User Type</Label>
                                    <div className="flex flex-wrap gap-3 pt-1">
                                        {["Staff", "Tenant", "Non-Tenant", "Owner"].map((t) => {
                                            const isActive = userType === t;
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setValue("userType", t as any)}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all duration-200",
                                                        isActive 
                                                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300" 
                                                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                                                    )}
                                                >
                                                    <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-indigo-600" : "bg-gray-300")} />
                                                    {t}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {userType === "Staff" && (
                                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 space-y-4">
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input {...register("staffId")} placeholder="Staff ID Number" className={`${inputClass} pl-10`} />
                                            </div>

                                            <Select onValueChange={(v) => setValue("department", v)} value={watch("department")}>
                                                <SelectTrigger className={inputClass}>
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="HR">Human Resources</SelectItem>
                                                    <SelectItem value="IT">IT / MIS</SelectItem>
                                                    <SelectItem value="Finance">Finance</SelectItem>
                                                    <SelectItem value="Operations">Operations</SelectItem>
                                                    <SelectItem value="Management">Management</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* === CARD 2: PARKING CONFIGURATION === */}
                    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: '100ms' }}>
                        <CardHeader className="px-8 pt-8 pb-4 border-b border-border/40">
                            <CardTitle className="text-lg font-semibold flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                    <Car className="h-5 w-5" />
                                </div>
                                Parking Configuration
                            </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="p-8 space-y-8">
                            
                            {/* Parking Mode & Card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <div>
                                    <Label className={labelClass}>Parking Mode</Label>
                                    <div className="flex bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-lg w-fit mt-1 h-12 items-stretch">
                                        <button 
                                            type="button" 
                                            onClick={() => setValue("parkingType", "Normal")}
                                            className={cn(
                                                "px-6 text-xs font-semibold rounded-md transition-all shadow-sm flex items-center justify-center",
                                                 parkingType === "Normal" 
                                                    ? "bg-white text-emerald-600" 
                                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                                            )}
                                        >
                                            Normal
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setValue("parkingType", "Reserved")}
                                            className={cn(
                                                "px-6 text-xs font-semibold rounded-md transition-all shadow-sm flex flex-col items-center justify-center leading-tight",
                                                parkingType === "Reserved" 
                                                    ? "bg-white text-emerald-600" 
                                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                                            )}
                                        >
                                            <span>Reserved</span>
                                            {parkingType === "Reserved" && (
                                                <span className="text-[9px] font-normal opacity-70">Surface / Basement</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                        <Label className={labelClass}>Bay No</Label>
                                        <Input {...register("bayNo")} 
                                        className={inputClass} 
                                        placeholder="e.g. B-102" 
                                        disabled={parkingType === "Normal"}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className={labelClass}>Season Package</Label>
                                        <Select onValueChange={(v) => setValue("seasonPackage", v)} value={watch("seasonPackage")}>
                                            <SelectTrigger className={inputClass}>
                                                <span className="truncate text-left block w-full pr-4">
                                                    <SelectValue placeholder="Select Package" />
                                                </span>
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[250px] max-w-[350px]">
                                                {seasonPackages.map((pkg) => (
                                                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                                                        {pkg.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className={labelClass}>Amano Card No</Label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input {...register("amanoCardNo")}
                                             className={`${inputClass} pl-9 font-mono`}
                                              placeholder="Scan Card ID" 
                                              disabled={!watch("isMobileQr")}
                                              />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className={labelClass}>Amano Expiry Date</Label>
                                        <DatePicker 
                                            date={watch("amanoExpiryDate") ? new Date(watch("amanoExpiryDate")!) : undefined} 
                                            setDate={(d) => setValue("amanoExpiryDate", d ? d.toISOString() : "")} 
                                            className="h-9 w-full"
                                            placeholder="Select Expiry Date"
                                            disabled={!watch("isMobileQr")}
                                        />
                                    </div>

                                    {/* CHECKBOX GROUP */}
                                    <div className="space-y-3 pt-2">
                                        
                                        <div className="flex items-center gap-2">
                                             <Checkbox 
                                                id="mobile-qr" 
                                                checked={watch("isMobileQr")}
                                                onCheckedChange={(c) => setValue("isMobileQr", !!c)}
                                            />
                                            <Label htmlFor="mobile-qr" className="cursor-pointer font-normal text-sm text-foreground">Is conversion to MOBILE QR?</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                             <Checkbox 
                                                id="is-homestay" 
                                                checked={watch("isHomestay")}
                                                onCheckedChange={(c) => setValue("isHomestay", !!c)}
                                            />
                                            <Label htmlFor="is-homestay" className="cursor-pointer font-normal text-sm text-foreground">Is Homestay?</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                             <Checkbox 
                                                id="is-lpr" 
                                                checked={watch("isLpr")}
                                                onCheckedChange={(c) => setValue("isLpr", !!c)}
                                            />
                                            <Label htmlFor="is-lpr" className="cursor-pointer font-normal text-sm text-foreground">Is LPR?</Label>
                                        </div>
                                    </div>
                                </div>
                            
                            {/* REMARKS (Full Width) */}
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Remarks</Label>
                                <Input {...register("remarks")} className={inputClass} placeholder="Any additional comments..." />
                            </div>

                            {/* Vehicles */}
                            <div>
                                <Label className={labelClass}>Registered Vehicles</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                    <div>
                                        <Input {...register("plate1")} className={`${inputClass} uppercase border-indigo-200 bg-indigo-50/10 focus:bg-white`} placeholder="Plate 1 (Required)" />
                                        {errors.plate1 && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.plate1.message}</span>}
                                    </div>
                                    <Input {...register("plate2")} className={`${inputClass} uppercase`} placeholder="Plate 2" disabled />
                                    <Input {...register("plate3")} className={`${inputClass} uppercase`} placeholder="Plate 3" disabled />
                                </div>
                            </div>

                            {/* Tandem Section (Distinct Container) */}
                            <div className={cn(
                                "rounded-xl border-2 transition-all duration-300 overflow-hidden",
                                isTandemChecked 
                                    ? "bg-indigo-50/40 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30" 
                                    : "bg-gray-50/50 border-dashed border-gray-200"
                            )}>
                                <div className="p-4 flex items-center justify-between border-b border-gray-200/50">
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            id="tandem-check" 
                                            checked={isTandemChecked}
                                            onCheckedChange={(c) => setValue("isTandem", !!c)}
                                            className="h-5 w-5 border-2 border-indigo-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <Label htmlFor="tandem-check" className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer select-none flex items-center gap-2">
                                            <Users className="h-4 w-4 text-indigo-500" /> Enable Tandem (Second Holder)?
                                        </Label>
                                    </div>
                                    <Badge variant={isTandemChecked ? "default" : "secondary"} className="text-[10px] px-3">
                                        {isTandemChecked ? "Enabled" : "Optional"}
                                    </Badge>
                                </div>

                                <div className={`p-6 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${!isTandemChecked ? "opacity-40 pointer-events-none grayscale blur-[1px]" : "opacity-100"}`}>
                                    <div>
                                        <Label className={labelClass}>Second Holder Name</Label>
                                        <Input {...register("tandemName")} className={inputClass} disabled={!isTandemChecked} />
                                    </div>
                                    <div>
                                        <Label className={labelClass}>NRIC / Passport</Label>
                                        <Input {...register("tandemNric")} className={inputClass} disabled={!isTandemChecked} />
                                    </div>
                                    <div>
                                        <Label className={labelClass}>Contact No.</Label>
                                        <Input {...register("tandemMobile")} className={inputClass} disabled={!isTandemChecked} />
                                    </div>
                                    <div>
                                        <Label className={labelClass}>Second Holder Vehicle</Label>
                                        <Input {...register("tandemPlate1")} className={`${inputClass} uppercase`} placeholder="Tandem Plate" disabled={!isTandemChecked} />
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-4 pt-4 pb-12">
                        <Button type="button" 
                        variant="outline" 
                        onClick={handleClear} 
                        className="h-11 px-8 rounded-xl border-gray-300 hover:bg-gray-100 text-gray-600"
                        >
                        <RefreshCw className="mr-2 h-4 w-4" />
                            Clear Form
                        </Button>

                        <Button type="submit"
                         onClick={handleSubmit(onPreSubmit)} 
                         disabled={isSubmitting} 
                         className="h-11 px-10 rounded-xl bg-black hover:bg-gray-800 text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                         >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                            Proceed to Registration
                        </Button>
                    </div>

                </div>
            </div>

            {/* CONFIRMATION DIALOG */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <CheckCircle2 className="h-6 w-6 text-green-600" /> Confirm Registration
                        </DialogTitle>
                        <DialogDescription>
                            Please review the details below before submitting.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {formDataToSubmit && (
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase">Full Name</p>
                                    <p className="font-medium">{formDataToSubmit.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase">NRIC</p>
                                    <p className="font-medium">{formDataToSubmit.nric}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase">Contact</p>
                                    <p className="font-medium">{formDataToSubmit.mobileContact}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase">Email</p>
                                    <p className="font-medium">{formDataToSubmit.userEmail}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase">Unit</p>
                                    <p className="font-medium">{formDataToSubmit.phase} - {formDataToSubmit.unitNo}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase">User Type</p>
                                    <Badge variant="outline">{formDataToSubmit.userType}</Badge>
                                </div>
                            </div>

                            <div className="bg-muted/30 p-3 rounded-lg border space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-xs font-semibold">Primary Vehicle:</span>
                                    <span className="font-mono font-bold text-indigo-700">{formDataToSubmit.plate1}</span>
                                </div>
                                {formDataToSubmit.plate2 && (
                                    <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Vehicle 2:</span>
                                        <span className="font-mono text-xs">{formDataToSubmit.plate2}</span>
                                    </div>
                                )}
                                {formDataToSubmit.plate3 && (
                                    <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Vehicle 3:</span>
                                        <span className="font-mono text-xs">{formDataToSubmit.plate3}</span>
                                    </div>
                                )}
                            </div>

                            {formDataToSubmit.isTandem && (
                                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1">
                                        <Users className="h-3 w-3" /> Tandem Enabled
                                    </p>
                                    <p className="text-xs text-indigo-700">Holder: {formDataToSubmit.tandemName || "N/A"}</p>
                                    <p className="text-xs text-indigo-700 font-mono mt-1">Plate: {formDataToSubmit.tandemPlate1 || "N/A"}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isSubmitting}>Back to Edit</Button>
                        <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="min-w-[140px] bg-black hover:bg-gray-800 text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Confirm Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}