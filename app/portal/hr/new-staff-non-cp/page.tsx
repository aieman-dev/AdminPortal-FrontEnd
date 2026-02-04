"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, RotateCcw, Save, User, Briefcase, Mail, Loader2, CheckCircle2 } from "lucide-react"

import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppToast } from "@/hooks/use-app-toast"

// Validation Schema
const staffTagSchema = z.object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(1, "Name is required"),
    staffId: z.string().min(1, "Staff ID is required"),
    department: z.string().min(1, "Department is required"),
})

type StaffTagValues = z.infer<typeof staffTagSchema>

export default function NewStaffNonCPPage() {
    const toast = useAppToast()
    const [isVerifying, setIsVerifying] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<StaffTagValues>({
        resolver: zodResolver(staffTagSchema),
        defaultValues: {
            email: "",
            fullName: "",
            staffId: "",
            department: ""
        }
    })

    const { register, setValue, watch, handleSubmit, reset, formState: { errors } } = form
    const emailValue = watch("email")

    // Mock Verify Action
    const handleVerify = async () => {
        if (!emailValue) {
            toast.error("Input Required", "Please enter an email address first.")
            return
        }

        setIsVerifying(true)
        
        // Simulate API call delay
        setTimeout(() => {
            setIsVerifying(false)
            
            // Hardcoded Mock Data (Simulating success)
            setValue("fullName", "Aimeen Intern") 
            setIsVerified(true)
            toast.success("User Verified", "Account details found.")
        }, 800)
    }

    const handleClear = () => {
        reset()
        setIsVerified(false)
        toast.info("Reset", "Form cleared.")
    }

    const onSubmit = async (data: StaffTagValues) => {
        setIsSubmitting(true)
        
        // Simulate Submission
        setTimeout(() => {
            console.log("Submitting:", data);
            setIsSubmitting(false)
            toast.success("Success", "Staff tag created successfully.")
            handleClear()
        }, 1500)
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
                                    className="h-11 min-w-[120px] bg-black hover:bg-gray-800 text-white shadow-sm"
                                >
                                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    {isVerifying ? "Verifying..." : "Verify"}
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    onClick={handleClear}
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
                                    placeholder="Name retrieved from account..." 
                                    readOnly 
                                    className="bg-muted/40 h-11 border-dashed" 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Staff ID Number <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        {...register("staffId")} 
                                        placeholder="e.g. S12345" 
                                        className="pl-9 h-11" 
                                    />
                                </div>
                                {errors.staffId && <p className="text-xs text-red-500 font-medium">{errors.staffId.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2 md:w-1/2">
                            <Label>Department <span className="text-red-500">*</span></Label>
                            <Select onValueChange={(val) => setValue("department", val)}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hr">Human Resources</SelectItem>
                                    <SelectItem value="it">IT / MIS</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                    <SelectItem value="ops">Operations</SelectItem>
                                    <SelectItem value="sales">Sales & Marketing</SelectItem>
                                </SelectContent>
                            </Select>
                             {errors.department && <p className="text-xs text-red-500 font-medium">{errors.department.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. SUBMIT BUTTON */}
                <div className="flex justify-end pt-2">
                    <Button 
                        size="lg" 
                        onClick={handleSubmit(onSubmit)} 
                        disabled={!isVerified || isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[180px] h-12 shadow-lg transition-transform active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        Submit Tag
                    </Button>
                </div>
            </div>
        </div>
    )
}