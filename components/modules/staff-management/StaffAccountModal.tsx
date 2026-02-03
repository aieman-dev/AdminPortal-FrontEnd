"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2, UserPlus, User, Eye, EyeOff } from "lucide-react"
import { useAppToast } from "@/hooks/use-app-toast"
import { STAFF_ROLES } from "@/lib/constants"
import { staffService } from "@/services/staff-services"
import { type SearchedUser } from "@/type/staff"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DatePicker } from "@/components/ui/date-picker" 
import { addMonths, addYears } from "date-fns"

interface StaffAccountModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData: null; 
}

export function StaffAccountModal({ isOpen, onOpenChange, onSuccess }: StaffAccountModalProps) {
  const toast = useAppToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([])
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null)
  
  const [selectedRole, setSelectedRole] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const [isSearching, setIsSearching] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  const [durationMode, setDurationMode] = useState("permanent")
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true)
    setSearchResults([])
    setSelectedUser(null)
    
    try {
      const results = await staffService.searchUsers(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info( "No users found matching your query." )
      }
    } catch (error) {
      toast.error("Error", "Failed to search users.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleDurationChange = (value: string) => {
      setDurationMode(value);
      const today = new Date();

      switch (value) {
          case "3_months": setExpiryDate(addMonths(today, 3)); break;
          case "6_months": setExpiryDate(addMonths(today, 6)); break;
          case "1_year": setExpiryDate(addYears(today, 1)); break;
          case "2_years": setExpiryDate(addYears(today, 2)); break;
          case "permanent": setExpiryDate(undefined); break; 
          case "custom": setExpiryDate(undefined); break; 
      }
  };

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole || !password) {
      toast.error("Incomplete", "Please select a user, a role, and enter a password.")
      return
    }

    if (durationMode === 'custom' && !expiryDate) {
        toast.error("Date Required", "Please select an expiry date.")
        return
    }

    setIsAssigning(true)
    try {
      await staffService.assignRole(selectedUser.accId, selectedRole, password, expiryDate);
      
      toast.success( "Success", `Role assigned to ${selectedUser.fullName || selectedUser.email}.`)
      
      onSuccess()
      onOpenChange(false)
      
      // Cleanup
      setSearchQuery("")
      setSearchResults([])
      setSelectedUser(null)
      setSelectedRole("")
      setPassword("")
      setDurationMode("permanent") 
      setExpiryDate(undefined)
      
    } catch (error) {
      toast.error( "Assignment Failed",  error instanceof Error ? error.message : "Could not assign role.")
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto gap-6">
        <DialogHeader>
          <DialogTitle>Assign Staff Role</DialogTitle>
          <DialogDescription>Search for an existing user and grant them system access.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* Search Section */}
          <div className="space-y-3">
            <Label>Search User</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Search by name, email or mobile..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="text-base md:text-sm"
              />
              <Button onClick={handleSearch} disabled={isSearching} variant="secondary">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Results List */}
          {searchResults.length > 0 && !selectedUser && (
            <div className="border rounded-md">
              <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                Select a user ({searchResults.length} found)
              </div>
              <ScrollArea className="h-[200px]">
                {searchResults.map((user) => (
                  <div 
                    key={user.accId}
                    onClick={() => setSelectedUser(user)}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-0"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user.firstName?.[0] || user.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{user.fullName || `${user.firstName} ${user.lastName}`}</div>
                      <div className="text-xs text-foreground truncate">{user.email} • {user.mobileNo}</div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Selected User & Role Selection */}
          {selectedUser && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-900/10 p-4 flex items-start gap-3">
                 <div className="mt-1 bg-blue-100 dark:bg-blue-900 p-1.5 rounded-full">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                 </div>
                 <div className="flex-1">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                        Selected User
                    </div>
                    <div className="font-medium">{selectedUser.fullName}</div>
                    <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">ID: {selectedUser.accId}</div>
                 </div>
                 <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="text-xs h-8 px-3 shrink-0">
                    Change
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Role Select */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Assign Role <span className="text-destructive">*</span></Label>
                    <Select onValueChange={setSelectedRole} value={selectedRole}>
                      <SelectTrigger id="role" className="h-11">
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Set Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                        <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Create password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                  </div>

                  {/* DURATION SELECTOR (NEW) */}
                  <div className="space-y-2">
                    <Label>Employment Duration</Label>
                    <Select onValueChange={handleDurationChange} value={durationMode}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select Duration" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent (No Expiry)</SelectItem>
                        <SelectItem value="3_months">3 Months (Internship)</SelectItem>
                        <SelectItem value="6_months">6 Months (Probation)</SelectItem>
                        <SelectItem value="1_year">1 Year (Contract)</SelectItem>
                        <SelectItem value="2_years">2 Years (Contract)</SelectItem>
                        <SelectItem value="custom">Custom Date...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* EXPIRY DATE PICKER (Shows calculated date or allows custom pick) */}
                  <div className="space-y-2">
                    <Label>Expiry Date {durationMode === 'permanent' && <span className="text-muted-foreground font-normal text-xs">(Optional)</span>}</Label>
                    <DatePicker 
                        date={expiryDate} 
                        setDate={setExpiryDate} 
                        disabled={durationMode !== 'custom'} // Disable unless custom mode
                        placeholder={durationMode === 'permanent' ? "Indefinite" : "Pick date"}
                        className="h-10 w-full"
                    />
                  </div>
              </div>
            </div>
          )}
        </div>
              

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={isAssigning || !selectedUser || !selectedRole}
            className="min-w-[120px]"
          >
            {isAssigning ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Assigning...
                </>
            ) : (
                "Confirm Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}