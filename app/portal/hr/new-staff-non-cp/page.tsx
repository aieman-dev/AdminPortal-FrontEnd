"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, RotateCcw, Save, User, Briefcase, Mail, Loader2, CheckCircle2, UserPlus } from "lucide-react"

import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppToast } from "@/hooks/use-app-toast"
import { hrService } from "@/services/hr-services"
import { CarParkDepartment } from "@/type/hr"

// Validation Schema
const staffTagSchema = z.object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(1, "Name is required"),
    accId: z.number().optional(),
    staffNo: z.string().min(1, "Staff ID is required"),
    department: z.string().min(1, "Department is required"),
})

type StaffTagValues = z.infer<typeof staffTagSchema>

export default function NewStaffNonCPPage() {
    const toast = useAppToast()
    const [isVerifying, setIsVerifying] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [departments, setDepartments] = useState<CarParkDepartment[]>([])

    const form = useForm<StaffTagValues>({
        resolver: zodResolver(staffTagSchema),
        defaultValues: {
            email: "",
            fullName: "",
            staffNo: "",
            department: ""
        }
    })

    const { register, setValue, watch, handleSubmit, reset, formState: { errors } } = form
    const emailValue = watch("email")

    //Fetch Departments on Mount
    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const data = await hrService.getDepartments();
                setDepartments(data);
            } catch (error) {
                console.error("Failed to load departments", error);
                toast.error("Error", "Could not load departments");
            }
        };
        loadDepartments();
    }, []);


    //Verify Action
    const handleVerify = async () => {
        if (!emailValue) {
            toast.error("Input Required", "Please enter an email address first.")
            return
        }

        setIsVerifying(true)
        
        try {
            const result = await hrService.verifyUser("email", emailValue);
            
            if (result.success && result.data) {
                setValue("fullName", result.data.name);
                setValue("accId", Number(result.data.accId));
                setIsVerified(true);
                toast.success("User Verified", `Account verified: ${result.data.name}`);
            }
        } catch (error) {
            toast.error("Verification Failed", "User account not found or invalid.");
            setIsVerified(false);
        } finally {
            setIsVerifying(false)
        }
    }


    const handleClear = (showToast = true) => {
        reset()
        setIsVerified(false)
        if (showToast) {
            toast.info("Reset", "Form cleared.")
        }
    }


    const onSubmit = async (data: StaffTagValues) => {
        if (!isVerified) {
             toast.error("Verification Required", "Please verify the account first.");
             return;
        }
        setIsSubmitting(true)
        
        try {
            await hrService.submitStaffTag(data)

            toast.success("Success", "Staff created successfully.")
            handleClear(false)
        } catch (error) {
            toast.error("Error", error instanceof Error ? error.message : "Failed to create staff.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <PageHeader 
                title="New Staff Tagging" 
                description="Link a SuperApp account to a staff member without assigning parking." 
            />

            <div className="grid gap-6">
                
                {/* 1. VERIFICATION CARD */}
                <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30 border-b pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Search className="h-4 w-4 text-indigo-600" /> 
                            Account Lookup
                        </CardTitle>
                        <CardDescription>Enter the user's SuperApp email to verify their account exists.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full space-y-2">
                                <Label>SuperApp Email <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        {...register("email")}
                                        placeholder="user@example.com" 
                                        className="pl-9 h-11"
                                        disabled={isVerified}
                                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button 
                                    type="button"
                                    onClick={handleVerify} 
                                    disabled={isVerifying || isVerified || !emailValue}
                                    className="h-11 min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                >
                                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    {isVerifying ? "Verifying..." : "Verify"}
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    onClick={() => handleClear()}
                                    className="h-11 min-w-[100px]"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" /> Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. DETAILS CARD (Conditional Opacity) */}
                <Card className={`border shadow-sm transition-all duration-500 ${!isVerified ? "opacity-60 pointer-events-none grayscale-[0.5]" : "opacity-100"}`}>
                    <CardHeader className="bg-muted/30 border-b pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4 text-indigo-600" /> 
                            Staff Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Staff Full Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    {...register("fullName")} 
                                    placeholder="Name retrieved from account" 
                                    readOnly 
                                    className="bg-muted/40 h-11 border-dashed" 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Staff ID Number <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        {...register("staffNo")} 
                                        placeholder="ICITY-1234" 
                                        className="pl-9 h-11" 
                                    />
                                </div>
                                {errors.staffNo && <p className="text-xs text-red-500 font-medium">{errors.staffNo.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2 md:w-1/2">
                            <Label>Department <span className="text-red-500">*</span></Label>
                            <Select onValueChange={(val) => setValue("department", val)}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept, idx) => (
                                        <SelectItem key={`${dept.code}-${idx}`} value={dept.code}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             {errors.department && <p className="text-xs text-red-500 font-medium">{errors.department.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. SUBMIT BUTTON */}
                <div className="flex justify-end pt-2">
                    <LoadingButton 
                        size="lg" 
                        onClick={handleSubmit(onSubmit)} 
                        isLoading={isSubmitting}
                        loadingText="Creating Staff..."
                        icon={UserPlus}
                        disabled={!isVerified}
                        className="h-11 px-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                    >
                        Confirm Registration
                    </LoadingButton>
                </div>
            </div>
        </div>
    )
}