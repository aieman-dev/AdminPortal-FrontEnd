"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
    Users, Pencil, Filter, 
    Briefcase, UserCircle 
} from "lucide-react"

import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useAppToast } from "@/hooks/use-app-toast"
import { usePagination } from "@/hooks/use-pagination"

// --- 1. MOCK DATA ---
const MOCK_STAFF_DATA = [
    { id: 1, name: "EDD", staffNo: "ICP2254", department: "THUB", email: "edd@icity.com" },
    { id: 2, name: "IRIS", staffNo: "ICP001", department: "HR", email: "iris@icity.com" },
    { id: 3, name: "kuanhoong", staffNo: "VC001", department: "IT", email: "kuanhoong@icity.com" },
    { id: 4, name: "LOW JIE YEE", staffNo: "ICP1300", department: "MIS", email: "jieyee@icity.com" },
    { id: 5, name: "TESTING", staffNo: "ICP2343", department: "IT", email: "test.user@icity.com" },
    { id: 6, name: "Aimeen Intern", staffNo: "MIS07", department: "MIS", email: "xxaimeenshafiq@gmail.com" },
    { id: 7, name: "Siti Aminah", staffNo: "HR005", department: "HR", email: "siti.aminah@icity.com" },
    { id: 8, name: "John Doe", staffNo: "FIN101", department: "FINANCE", email: "john.doe@icity.com" },
    { id: 9, name: "Jane Smith", staffNo: "OPS202", department: "OPERATIONS", email: "jane.smith@icity.com" },
    { id: 10, name: "Michael Tan", staffNo: "MKT303", department: "MARKETING", email: "michael.tan@icity.com" },
    { id: 11, name: "Sarah Lee", staffNo: "SAL001", department: "SALES", email: "sarah.lee@icity.com" },
    { id: 12, name: "David Wong", staffNo: "SEC999", department: "SECURITY", email: "david.wong@icity.com" },
];

// Helper to color code departments
const getDeptColor = (dept: string) => {
    const d = dept.toUpperCase();
    if (d === 'MIS' || d === 'IT') return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (d === 'HR') return "bg-pink-50 text-pink-700 border-pink-200";
    if (d === 'FINANCE') return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (d === 'THUB') return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function StaffListingPage() {
    const router = useRouter()
    const toast = useAppToast()
    const pagination = usePagination({ pageSize: 10 })

    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // --- 2. FILTERING LOGIC ---
    const filteredData = useMemo(() => {
        const lowerQuery = searchTerm.toLowerCase();
        return MOCK_STAFF_DATA.filter(item => 
            item.name.toLowerCase().includes(lowerQuery) ||
            item.staffNo.toLowerCase().includes(lowerQuery) ||
            item.department.toLowerCase().includes(lowerQuery) ||
            item.email.toLowerCase().includes(lowerQuery)
        );
    }, [searchTerm]);

    // --- 3. PAGINATION LOGIC & RUNNING NUMBER ---
    const displayData = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.pageSize;
        const sliced = filteredData.slice(start, start + pagination.pageSize);
        
        // Add dynamic running number based on current page
        return sliced.map((item, index) => ({
            ...item,
            no: start + index + 1
        }));
    }, [filteredData, pagination.currentPage, pagination.pageSize]);

    useEffect(() => {
        pagination.setMetaData(
            Math.ceil(filteredData.length / pagination.pageSize),
            filteredData.length
        );
    }, [filteredData]);

    const handleSearch = () => {
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            setIsLoading(false);
            if (searchTerm && filteredData.length === 0) {
                toast.info("No Results", "No staff members found.");
            }
        }, 300);
    }

    const handleEdit = (staffId: string) => {
        toast.info("Edit Action", `Opening editor for ${staffId}...`);
    }

    // --- 4. COLUMNS CONFIGURATION (New Standard) ---
    const columns: TableColumn<typeof displayData[0]>[] = [
        { 
            header: "No", 
            accessor: "no", 
            className: "pl-6 w-[60px] text-muted-foreground font-mono text-xs",
            cell: (val) => val
        },
        { 
            header: "Staff Name", 
            accessor: "name", 
            className: "font-medium min-w-[180px]",
            cell: (val) => <span className="text-sm font-semibold text-foreground">{val}</span>
        },
        { 
            header: "Email", 
            accessor: "email",
            cell: (val) => <span className="text-muted-foreground">{val}</span>
        },
        { 
            header: "Staff No", 
            accessor: "staffNo", 
            cell: (val) => (
                <span className="font-mono text-xs font-medium text-foreground bg-muted/40 px-2 py-1 rounded border">
                    {val}
                </span>
            )
        },
        { 
            header: "Department", 
            accessor: "department",
            cell: (val) => (
                <Badge variant="outline" className={`font-medium ${getDeptColor(val as string)}`}>
                    {val}
                </Badge>
            )
        },
        {
            header: "Action",
            accessor: "id",
            className: "text-right pr-6",
            cell: (_, row) => (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEdit(row.staffNo)}
                    className="h-8 gap-2 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                title="All Staff Directory" 
                description="View and manage the master list of all staff members." 
            >
                <div className="flex gap-2">
                    <Button variant="outline" className="h-9 gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                    <Button className="h-9 gap-2 bg-black hover:bg-zinc-800 text-white shadow-sm" onClick={() => router.push("/portal/hr/new-staff-non-cp")}>
                        <Users className="h-4 w-4" /> Add Staff
                    </Button>
                </div>
            </PageHeader>

            <Card>
                <CardContent>
                    <SearchField 
                        label="Search Directory"
                        placeholder="Search by Name, Staff ID, Email or Department..."
                        value={searchTerm}
                        onChange={(val) => {
                            setSearchTerm(val);
                            pagination.setCurrentPage(1); // Reset page on search
                        }}
                        onSearch={handleSearch}
                        isSearching={isLoading}
                    />
                </CardContent>
            </Card>

            <Card className="min-h-[500px] flex flex-col">
                <CardContent className="p-0 flex-1">
                    <DataTable 
                        columns={columns}
                        data={displayData}
                        keyExtractor={(row) => String(row.id)}
                        isLoading={isLoading}
                        emptyIcon={Users}
                        emptyTitle="No Staff Found"
                        emptyMessage={searchTerm ? `No results for "${searchTerm}"` : "The directory is currently empty."}
                    />
                </CardContent>
                
                {pagination.totalPages > 0 && (
                    <div className="p-4 border-t bg-muted/5">
                        <PaginationControls 
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            totalRecords={pagination.totalRecords}
                            pageSize={pagination.pageSize}
                            onPageChange={pagination.setCurrentPage} 
                        />
                    </div>
                )}
            </Card>
        </div>
    )
}