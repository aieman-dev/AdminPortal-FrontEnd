// components/staff-management/StaffAccountModal.tsx

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Interface only needs minimal fields as it's only used for creation now
interface StaffAccountModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData: null; // Explicitly enforce that this is only for creation
}

const StaffDepartments = ["IT", "Finance", "Package Operations", "HR", "Marketing"]
const StaffRoles = ["IT Admin", "MIS Superadmin", "Package Manager", "Package Creator", "View Only"]

const getInitialState = () => ({
    fullName: "",
    email: "",
    employeeId: "", 
    department: "",
    role: "",
    initialPassword: "", 
    isActive: true,
    forceChange: true,
})

export function StaffAccountModal({ isOpen, onOpenChange, onSuccess, initialData }: StaffAccountModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState(getInitialState())
  const [isLoading, setIsLoading] = useState(false)
  
  // Reset form when opening for a new creation
  useEffect(() => {
    if (isOpen) {
        setFormData(getInitialState());
    }
  }, [isOpen]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const generatePassword = () => {
      const length = 10;
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < length; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setFormData(prev => ({ ...prev, initialPassword: password }))
  }

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.department || !formData.role || !formData.initialPassword) {
      toast({ title: "Input Error", description: "Please fill all required fields.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log("CREATE STAFF ACCOUNT Payload:", formData)

    setIsLoading(false)
    onOpenChange(false)
    onSuccess() 
  }

  return (
    // FIX: Apply WIDER class for the dialog
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a new staff member account</DialogTitle>
          <DialogDescription>Enter the user's details and set initial access permissions for the system.</DialogDescription>
        </DialogHeader>

        {/* FIX: Apply MAX HEIGHT and overflow for the content area */}
        <div className="grid gap-6 py-4 max-h-[500px] overflow-y-auto"> 
          <h4 className="text-base font-semibold border-b pb-2">I. Staff Details</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
              <Input id="fullName" placeholder="Enter full name" value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address (Login ID) <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" placeholder="Enter staff email address" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID (Optional)</Label>
              <Input id="employeeId" placeholder="e.g. EMP12345" value={formData.employeeId} onChange={(e) => handleChange("employeeId", e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => handleChange("department", value)} value={formData.department}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {StaffDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          <h4 className="text-base font-semibold border-b pb-2 pt-4">II. Access & Permissions</h4>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2 col-span-full">
                <Label htmlFor="role">Role / Access Level <span className="text-destructive">*</span></Label>
                <Select onValueChange={(value) => handleChange("role", value)} value={formData.role}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select access role" />
                  </SelectTrigger>
                  <SelectContent>
                     {StaffRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             
             <div className="flex items-center justify-between col-span-full">
                <Label htmlFor="isActive">Account Status (Active)</Label>
                <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => handleChange("isActive", checked)} />
             </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="initialPassword">Initial Password <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
                <Input id="initialPassword" type="text" placeholder="Set temporary password" value={formData.initialPassword} onChange={(e) => handleChange("initialPassword", e.target.value)} />
                <Button variant="outline" onClick={generatePassword} type="button" disabled={isLoading} className="shrink-0">
                    <Key className="h-4 w-4 mr-2" /> Generate
                </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="forceChange" checked={formData.forceChange} onCheckedChange={(checked) => handleChange("forceChange", checked as boolean)} />
            <Label htmlFor="forceChange" className="text-sm font-medium">User must change password upon first login</Label>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}