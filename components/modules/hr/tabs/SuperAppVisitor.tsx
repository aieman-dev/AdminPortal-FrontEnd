"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Users, Pencil } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { hrService } from "@/services/hr-services"
import { Account } from "@/type/hr"
import { formatDateTime } from "@/lib/formatter"

export default function SuperAppVisitorTab() {
    const router = useRouter()
    const toast = useAppToast()
    
    const [data, setData] = useState<Account[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isSearching, setIsSearching] = useState(false)

    const fetchVisitor = useCallback(async (query: string) => {
        if (!query.trim()) { setData([]); return; }
        setIsSearching(true)
        try {
            const items = await hrService.searchSuperAppAccounts(query.trim())
            setData(items)
            if (items.length > 0) toast.info("Results", `Found ${items.length} accounts.`)
        } catch (e) {
            toast.error("Error", "Failed to fetch accounts.")
        } finally {
            setIsSearching(false)
        }
    }, [toast])

    useAutoSearch((query) => {
        setSearchTerm(query)
        fetchVisitor(query)
    })

    const handleEdit = (accId: string) => {
        // Redirects to Car Park Module Detail for now
        router.push(`/portal/hr/superapp-visitor/${accId}`)
    }

    const columns: TableColumn<Account>[] = useMemo(() => [
        { header: "Acc ID", accessor: "accId", className: "pl-6 w-[80px]", cell: (v) => <span className="font-mono text-muted-foreground">{v}</span> },
        { header: "Name", accessor: "firstName", className: "font-medium" },
        { header: "Email", accessor: "email" },
        { header: "Mobile", accessor: "mobile" },
        { header: "Status", accessor: "accountStatus", cell: (v) => <StatusBadge status={v as string} /> },
        { header: "Date", accessor: "createdDate", cell: (v) => formatDateTime(v as string) },
        {
            header: "Action", accessor: "accId", className: "text-right pr-6",
            cell: (_, row) => (
                <Button variant="ghost" size="sm" onClick={() => handleEdit(row.accId)}>
                    <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Edit
                </Button>
            )
        }
    ], [])

    return (
        <div className="space-y-4">
            <Card>
                <CardContent>
                    <SearchField 
                        label="Search Visitor Accounts"
                        placeholder="Search by Email Address"
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onSearch={() => fetchVisitor(searchTerm)}
                        isSearching={isSearching}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-0">
                    <DataTable 
                        columns={columns} 
                        data={data} 
                        keyExtractor={(r) => r.accId}
                        isLoading={isSearching}
                        emptyIcon={Users}
                        emptyTitle="No Visitors Found"
                        emptyMessage={searchTerm ? "No records found." : "Enter an email to search."}
                    />
                </CardContent>
            </Card>
        </div>
    )
}