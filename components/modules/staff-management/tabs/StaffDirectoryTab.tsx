"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { SearchField } from "@/components/shared-components/search-field"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { Users } from "lucide-react"
import { useAppToast } from "@/hooks/use-app-toast"
import { staffService } from "@/services/staff-services"
import { type StaffMember } from "@/type/staff"
import { formatDate } from "@/lib/formatter"

interface StaffDirectoryTabProps {
    onRowClick: (s: StaffMember) => void;
    refreshTrigger: number; 
}

export default function StaffDirectoryTab({ onRowClick, refreshTrigger }: StaffDirectoryTabProps) {
    const toast = useAppToast()
    const [query, setQuery] = useState("")
    const [staffList, setStaffList] = useState<StaffMember[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchStaff = useCallback(async (searchQuery: string) => {
        setIsLoading(true)
        try {
            const data = await staffService.getStaffList(searchQuery)
            const uniqueStaff = Array.from(new Map(data.map(item => [item.accId, item])).values());
            setStaffList(uniqueStaff)
        } catch (error) {
            toast.error("Error", "Failed to load staff list.")
        } finally {
            setIsLoading(false)
        }
    }, []);

    useEffect(() => { 
        fetchStaff(query) 
    }, [refreshTrigger, fetchStaff])

    const columns: TableColumn<StaffMember>[] = useMemo(() => [
        { header: "Staff ID", accessor: "accId", className: "font-medium pl-6" },
        { header: "Name", accessor: "fullName", className: "font-medium" },
        { header: "Email", accessor: "email" },
        { 
            header: "Role", accessor: "roleName", className: "text-center",
            cell: (val) => <span className="inline-flex items-center justify-center min-w-[100px] h-6 rounded-md bg-blue-50 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300">{val}</span>
        },
        { header: "Status", accessor: "status", className: "text-center", cell: (val) => <StatusBadge status={val as string} /> },
        { header: "Joined Date", accessor: "createdDate", cell: (val) => <span className="text-muted-foreground text-sm">{formatDate(val as string)}</span> },
        { 
            header: "Expiry Date", 
            accessor: "id", 
            cell: (_, row) => {
                const expiry = (row as any).expiryDate;
                return (
                    <span className={`text-sm ${expiry ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                        {expiry ? formatDate(expiry) : "Permanent"}
                    </span>
                )
            }
        },
    ], []);

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="mb-6">
                    <SearchField 
                        label="Search Directory" 
                        placeholder="Search by name, email or role" 
                        value={query} 
                        onChange={setQuery} 
                        onSearch={() => fetchStaff(query)}
                        isSearching={isLoading} 
                        inputType="email"
                    />
                </div>
                <DataTable 
                    columns={columns} 
                    data={staffList} 
                    keyExtractor={(row) => row.id}
                    isLoading={isLoading} 
                    emptyIcon={Users}
                    emptyTitle="No Staff Found"
                    onRowClick={onRowClick}
                />
            </CardContent>
        </Card>
    )
}