"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { EmailAutocomplete } from "@/components/ui/email-autocomplete"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface StaffAccountModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData: null; 
}

export function StaffAccountModal({ isOpen, onOpenChange, onSuccess }: StaffAccountModalProps) {
  const toast = useAppToast()
  const isMobile = useIsMobile()
  
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
        toast.info("No users found matching your query.")
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
      
      toast.success( 
        "Role Assigned", 
        `Access granted to ${selectedUser.fullName || selectedUser.email}. An automated email has been sent to them.`
      )
      
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

  // --- REUSABLE FORM CONTENT ---
  const formContent = (
    <div className="space-y-6 py-4">
      {/* Search Section */}
      <div className="space-y-3">
        <Label>Search User</Label>
        <div className="flex gap-2">
          <EmailAutocomplete 
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

      {/* Loading Skeletons */}
      {isSearching && (
        <div className="border rounded-xl p-3 mt-4 space-y-3 shadow-sm">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
        </div>
      )}

      {/* Results List */}
      {searchResults.length > 0 && !selectedUser && (
        <div className="border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-muted/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
            Select a user ({searchResults.length} found)
          </div>
          <ScrollArea className={cn(isMobile ? "h-[35vh]" : "h-[200px]")}>
            {searchResults.map((user) => (
              <div 
                key={user.accId}
                onClick={() => setSelectedUser(user)}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-0"
              >
                <Avatar className="h-9 w-9 border shadow-sm">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-semibold">
                    {user.firstName?.[0] || user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-foreground">{user.fullName || `${user.firstName} ${user.lastName}`}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email} • {user.mobileNo}</div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 shrink-0">
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
          <div className="rounded-xl border bg-indigo-50/50 dark:bg-indigo-900/10 p-4 flex items-start gap-3 shadow-sm">
             <div className="mt-0.5 bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full border border-indigo-200 dark:border-indigo-800">
                <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
             </div>
             <div className="flex-1">
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-0.5">
                    Selected User
                </div>
                <div className="font-semibold text-foreground text-sm">{selectedUser.fullName}</div>
                <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">ID: {selectedUser.accId}</div>
             </div>
             <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)} className="text-xs h-8 px-3 shrink-0 bg-background">
                Change
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        className="h-11 pr-12 text-base md:text-sm" // Increased padding for eye icon, text-base prevents iOS zoom
                        autoComplete="new-password" // Deters aggressive password managers
                        data-1p-ignore="true" // 1Password ignore
                        data-lpignore="true" // LastPass ignore
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-11 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground z-20"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
              </div>

              {/* DURATION SELECTOR */}
              <div className="space-y-2">
                <Label>Employment Duration</Label>
                <Select onValueChange={handleDurationChange} value={durationMode}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select Duration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="3_months">3 Months</SelectItem>
                    <SelectItem value="6_months">6 Months</SelectItem>
                    <SelectItem value="1_year">1 Year</SelectItem>
                    <SelectItem value="2_years">2 Years</SelectItem>
                    <SelectItem value="custom">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* EXPIRY DATE PICKER */}
              <div className="space-y-2">
                <Label>Expiry Date {durationMode === 'permanent' && <span className="text-muted-foreground font-normal text-xs">(Optional)</span>}</Label>
                <DatePicker 
                    date={expiryDate} 
                    setDate={setExpiryDate} 
                    disabled={durationMode !== 'custom'}
                    placeholder={durationMode === 'permanent' ? "Indefinite" : "Pick date"}
                    className="h-11 w-full text-base md:text-sm"
                />
              </div>
          </div>
        </div>
      )}
    </div>
  );

  // --- MOBILE RENDER (SHEET) ---
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        {/* Match ActivityDrawer's height and border radius for perfect consistency */}
        <SheetContent side="bottom" className="h-[85dvh] p-0 flex flex-col rounded-t-2xl bg-background">
          <SheetHeader className="p-6 border-b text-left bg-muted/5 shrink-0">
            <SheetTitle className="text-xl">Assign Staff Role</SheetTitle>
            <SheetDescription>Search for an existing user and grant them system access.</SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 scrollbar-hide">
            {formContent}
          </div>
          
          <SheetFooter className="p-4 border-t flex-col gap-3 shrink-0 bg-muted/5">
            <LoadingButton 
                onClick={handleAssign} 
                isLoading={isAssigning}
                loadingText="Assigning..."
                disabled={!selectedUser || !selectedRole}
                className="w-full h-11 text-base shadow-md"
            >
                Confirm Assignment
            </LoadingButton>
            <Button variant="outline" className="w-full h-11" onClick={() => onOpenChange(false)} disabled={isAssigning}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  // --- DESKTOP RENDER (DIALOG) ---
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 rounded-xl">
        <DialogHeader className="p-6 border-b bg-muted/5 shrink-0">
          <DialogTitle className="text-xl">Assign Staff Role</DialogTitle>
          <DialogDescription>Search for an existing user and grant them system access.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 scrollbar-hide">
            {formContent}
        </div>

        <DialogFooter className="p-6 border-t bg-muted/5 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning} className="h-11">
            Cancel
          </Button>
          <LoadingButton 
            onClick={handleAssign} 
            isLoading={isAssigning}
            loadingText="Assigning..."
            disabled={!selectedUser || !selectedRole}
            className="min-w-[150px] h-11"
          >
            Confirm Assignment
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}