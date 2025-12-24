"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2, UserPlus, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { STAFF_ROLES } from "@/lib/constants"
import { staffService } from "@/services/staff-services"
import { type SearchedUser } from "@/type/staff"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface StaffAccountModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData: null; 
}

export function StaffAccountModal({ isOpen, onOpenChange, onSuccess }: StaffAccountModalProps) {
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([])
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  
  const [isSearching, setIsSearching] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true)
    setSearchResults([])
    setSelectedUser(null)
    
    try {
      const results = await staffService.searchUsers(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast({ description: "No users found matching your query." })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to search users.", variant: "destructive" })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole) {
      toast({ title: "Incomplete", description: "Please select a user and a role.", variant: "destructive" })
      return
    }

    setIsAssigning(true)
    try {
      await staffService.assignRole(selectedUser.accId, selectedRole);
      
      toast({ 
        title: "Success", 
        description: `Role assigned to ${selectedUser.fullName || selectedUser.email}.`,
        variant: "success"
      })
      
      onSuccess()
      onOpenChange(false)
      
      // Cleanup
      setSearchQuery("")
      setSearchResults([])
      setSelectedUser(null)
      setSelectedRole("")
      
    } catch (error) {
      toast({ 
        title: "Assignment Failed", 
        description: error instanceof Error ? error.message : "Could not assign role.", 
        variant: "destructive" 
      })
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