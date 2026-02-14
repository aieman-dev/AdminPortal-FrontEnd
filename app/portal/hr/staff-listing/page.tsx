"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Users, Pencil, Filter, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmailAutocomplete } from "@/components/ui/email-autocomplete"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { useAppToast } from "@/hooks/use-app-toast"
import { usePagination } from "@/hooks/use-pagination"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { getDeptColor } from "@/lib/constants"
import { StaffEditSheet } from "@/components/modules/hr/sheet/StaffEditSheet"
import { hrService } from "@/services/hr-services"
import { StaffListItem, StaffDetail, UpdateStaffPayload } from "@/type/hr"
import { cn } from "@/lib/utils"


export default function StaffListingPage() {
    const router = useRouter()
    const toast = useAppToast()
    const pagination = usePagination({ pageSize: 20 })

    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<StaffListItem[]>([])

    // Selection state for Drawer
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isFetchingDetail, setIsFetchingDetail] = useState(false)

    // --- FETCH LOGIC (Server Side Pagination) ---
    const fetchStaffList = useCallback(async (page: number, query: string) => {
        setIsLoading(true);
        if (page !== pagination.currentPage) pagination.setCurrentPage(page);

        try {
            const response = await hrService.getStaffList(page, pagination.pageSize, query);
            
            setData(response.items);
            pagination.setMetaData(response.totalPages, response.totalCount);
            
        } catch (error) {
            toast.error("Error", "Failed to load staff list.");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [pagination.pageSize, toast]);


    // Auto-Search Hook
    useAutoSearch((query) => {
        setSearchTerm(query);
        fetchStaffList(1, query);
    });

    const handleSearchClick = () => {
        fetchStaffList(1, searchTerm);
    };


    // --- HANDLERS ---
    
    const handleOpenSheet = async (row: StaffListItem) => {
        setIsFetchingDetail(true);
        try {
            // Fetch full details before opening sheet
            const detail = await hrService.getStaffDetail(row.staffId);
            if (detail) {
                setSelectedStaff(detail);
                setIsSheetOpen(true);
            } else {
                toast.error("Not Found", "Could not retrieve staff details.");
            }
        } catch (error) {
            toast.error("Error", "Failed to fetch details.");
        } finally {
            setIsFetchingDetail(false);
        }
    }

    const handleSaveStaff = async (formData: { fullName: string; staffNo: string; department: string }) => {
        if (!selectedStaff) return;

        try {
            const payload: UpdateStaffPayload = {
                staffId: selectedStaff.staffId,
                name: formData.fullName,
                staffNo: formData.staffNo,
                departmentCode: formData.department
            };

            await hrService.updateStaff(payload);
            
            fetchStaffList(pagination.currentPage, searchTerm);

        } catch (error) {
             console.error("Update Error:", error);
             throw error; 
        }
    }


    const handleDeleteStaff = async (id: string) => {
         try {
            await hrService.deleteStaff(id);
            
            fetchStaffList(pagination.currentPage, searchTerm);

        } catch (error) {
             console.error("Delete Error:", error);
             throw error; 
        }
    }

    const columns: TableColumn<StaffListItem>[] = useMemo (() => [
        { header: "Staff ID", accessor: "staffId", className: "pl-6 w-[80px] font-medium text-muted-foreground", cell: (val) => <span className="font-mono text-xs">{val}</span>
        },
        { header: "Name", accessor: "staffName", className: "font-medium min-w-[180px]" },
        { header: "Email", accessor: "email", className: "font-medium min-w-[180px]" },
        { header: "Staff No", accessor: "staffNo", cell: (val) => <span className="inline-flex items-center justify-center w-[110px] font-mono text-xs font-medium text-foreground bg-muted/40 px-2 py-1 rounded border">{val}</span> },
        { header: "Department", accessor: "department", cell: (val) => <Badge variant="outline" className={cn("flex items-center justify-center w-[60px] font-medium", getDeptColor(val as string))}>{val}</Badge> },
        {
            header: "Action",
            accessor: "staffId",
            className: "text-right pr-6",
            cell: (_, row) => (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={isFetchingDetail && selectedStaff?.staffId === row.staffId}
                    onClick={(e) => {
                        e.stopPropagation(); 
                        handleOpenSheet(row);
                    }}
                    className="h-8 gap-2 text-muted-foreground"
                >
                    {isFetchingDetail ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Pencil className="h-3.5 w-3.5" />}
                     Edit
                </Button>
            )
        }
    ], []);

    return (
        <div className="space-y-6">
            <PageHeader title="All Staff Directory" description="View and manage the master list of all staff members." >
                <div className="flex gap-2">
                    <Button className="h-9 gap-2 bg-primary text-primary-foreground hover:opacity-90 transition-colors shadow-sm" onClick={() => router.push("/portal/hr/new-staff-non-cp")}>
                        <Users className="h-4 w-4" /> Add Staff
                    </Button>
                </div>
            </PageHeader>

            <Card>
                <CardContent>
                    <SearchField 
                        label="Search Directory"
                        placeholder="Search by Name, Staff No or Department"
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onSearch={handleSearchClick}
                        isSearching={isLoading}
                        inputType="email"
                    />
                </CardContent>
            </Card>

            <Card className="min-h-[500px] flex flex-col overflow-hidden">
                <CardContent className="p-0 flex-1">
                    <DataTable 
                        columns={columns}
                        data={data}
                        keyExtractor={(row) => String(row.staffId)}
                        isLoading={isLoading}
                        emptyIcon={Users}
                        emptyTitle="No Staff Found"
                        onRowClick={(row) => handleOpenSheet(row)}
                        pagination={{
                            currentPage: pagination.currentPage,
                            totalPages: pagination.totalPages,
                            totalRecords: pagination.totalRecords,
                            pageSize: pagination.pageSize,
                            onPageChange: (p) => fetchStaffList(p, searchTerm)
                        }}
                    />
                </CardContent>
            </Card>

            <StaffEditSheet 
                isOpen={isSheetOpen} 
                onClose={() => setIsSheetOpen(false)} 
                staff={selectedStaff}
                onSave={handleSaveStaff}
                onDelete={handleDeleteStaff}
            />
        </div>
    )
}