"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/shared-components/search-field"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { UserPlus, Users, Activity, Shield } from "lucide-react"
import { useAppToast } from "@/hooks/use-app-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaginationControls } from "@/components/ui/pagination-controls"

// Components
import { StaffAccountModal } from "@/components/modules/staff-management/StaffAccountModal" 
import { StaffDrawer } from "@/components/modules/staff-management/StaffDrawer" 
import { ActivityDrawer } from "@/components/modules/staff-management/ActivityDrawer" 
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"

// Config & Services
import { formatDate, formatDateTime } from "@/lib/formatter";
import { staffService } from "@/services/staff-services"
import { type StaffMember, type AuditLog } from "@/type/staff"

// --- HELPERS (Formatting) ---
const formatActionName = (technicalName: string): string => {
    if (!technicalName) return "Unknown Action";
    let clean = technicalName.replace(/^(POST|GET|PUT|DELETE)\s?-\s?/i, "");
    clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
    return clean.trim();
};

const parseDescription = (rawDesc: string) => {
    if (!rawDesc) return "No details provided";
    const outputIndex = rawDesc.indexOf("Output:");
    if (outputIndex === -1) return rawDesc.replace("Action:", "").trim();
    const jsonString = rawDesc.slice(outputIndex + 7).trim(); 
    try {
        const data = JSON.parse(jsonString);
        if (Array.isArray(data)) return `Retrieved ${data.length} records.`;
        if (typeof data === 'object' && data !== null) {
            if (data.message) return data.message;
            return "Operation successful.";
        }
        return "Action completed.";
    } catch {
        return "Action completed (See details).";
    }
};

const getActionStyle = (actionType: string) => {
    const lower = actionType.toLowerCase();
    if (lower.includes("insert") || lower.includes("create")) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    if (lower.includes("update")) return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    if (lower.includes("delete") || lower.includes("void")) return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    if (lower.includes("sync")) return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400";
    return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"; 
};

interface StaffDirectoryProps {
    onRowClick: (s: StaffMember) => void;
    refreshTrigger: number; 
}

// --- STAFF DIRECTORY ---
function StaffDirectoryTab({ onRowClick, refreshTrigger }: StaffDirectoryProps) {
    const toast = useAppToast()
    const [query, setQuery] = useState("")
    const [staffList, setStaffList] = useState<StaffMember[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchStaff = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await staffService.getStaffList(query)
            const uniqueStaff = Array.from(new Map(data.map(item => [item.accId, item])).values());
            setStaffList(uniqueStaff)
        } catch (error) {
            toast.error( "Error",  "Failed to load staff list.")
            console.error("Fetch error", error);
        } finally {
            setIsLoading(false)
        }
    }, [query]);

    useEffect(() => { 
        fetchStaff() 
    }, [refreshTrigger, fetchStaff])

    const columns: TableColumn<StaffMember>[] = useMemo(() => [
        { header: "Staff ID", accessor: "accId", className: "font-medium pl-6" },
        { header: "Name", accessor: "fullName", className: "font-medium" },
        { header: "Email", accessor: "email" },
        { 
            header: "Role", accessor: "roleName", className: "text-center",
            cell: (val) => <span className="inline-flex items-center justify-center min-w-[100px] h-6 rounded-md bg-blue-50 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300">{val}</span>
        },
        { header: "Status", accessor: "status", className: "text-center", cell: (val) => <StatusBadge status={val} /> },
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
            <CardContent>
                <div className="mb-6">
                    <SearchField 
                        label="Search Directory" 
                        placeholder="Search by name, email or role..." 
                        value={query} 
                        onChange={setQuery} 
                        onSearch={fetchStaff} 
                        isSearching={isLoading} 
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

// --- ACTIVITY AUDIT ---
function ActivityAuditTab({ onRowClick }: { onRowClick: (log: AuditLog) => void }) {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const pager = usePagination({ pageSize: 15 });

    const fetchLogs = async (pageNum: number) => {
        setIsLoading(true)
        if (pageNum !== pager.currentPage) pager.setCurrentPage(pageNum);

        try {
            const data = await staffService.getAllAuditLogs(pageNum, pager.pageSize)
            if (data) {
                setLogs(data.logs)
                const calcTotalPages = Math.ceil(data.totalRecords / data.pageSize);
                pager.setMetaData(calcTotalPages, data.totalRecords);
            }
        } catch (e) { console.error(e) } 
        finally { setIsLoading(false) }
    }

    useEffect(() => { fetchLogs(1) }, [])

    const columns: TableColumn<AuditLog>[] = [
        { 
            header: "Activity", accessor: "actionType", className: "w-[250px] pl-6",
            cell: (val, row) => {
                const readable = formatActionName(row.actionType);
                const style = getActionStyle(row.actionType);
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style}`}>
                        {readable}
                    </span>
                );
            }
        },
        { 
            header: "User", accessor: "userName", 
            cell: (val, row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{val || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">ID: {row.userId}</span>
                </div>
            )
        },
        { 
            header: "Description / Details", accessor: "description", 
            cell: (val) => {
                const cleanText = parseDescription(val as string);
                return <span className="text-sm text-foreground truncate max-w-[400px]" title={cleanText}>{cleanText}</span>
            }
        },
        { 
            header: "Module", accessor: "module", className: "text-center",
            cell: (val) => <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">{val || "SYSTEM"}</span>
        },
        { 
            header: "Timestamp", accessor: "timestamp", className: "text-right pr-6",
            cell: (val) => (
                <div className="flex flex-col items-end">
                    <span className="text-xs font-medium">{formatDate(val as string)}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{new Date(val as string).toLocaleTimeString()}</span>
                </div>
            )
        }
    ];

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" /> Live System Audit
                </CardTitle>
                <CardDescription>Real-time log of all actions performed by staff members.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable 
                    columns={columns} 
                    data={logs} 
                    keyExtractor={(row, i) => `${row.id}-${i}`}
                    isLoading={isLoading} 
                    emptyIcon={Shield}
                    emptyTitle="No Activity Logs"
                    onRowClick={onRowClick}
                />
                <PaginationControls 
                    currentPage={pager.currentPage} 
                    totalPages={pager.totalPages} 
                    onPageChange={fetchLogs} 
                    totalRecords={pager.totalRecords} 
                    pageSize={pager.pageSize}
                />
            </CardContent>
        </Card>
    )
}

// --- MAIN PAGE ---
export default function UsersStaffManagementPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <PageHeader 
          title="Staff Management" 
          description="Manage system access and monitor user activities."
      >
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Role
        </Button>
      </PageHeader>

      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="directory" className="gap-2"><Users className="h-4 w-4" /> Staff Directory</TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><Shield className="h-4 w-4" /> Activity Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="animate-in fade-in-50 duration-300 mt-0">
            <StaffDirectoryTab 
                refreshTrigger={refreshKey} 
                onRowClick={(staff) => {
                    setSelectedStaff(staff);
                    setIsDrawerOpen(true);
                }} />
        </TabsContent>

        <TabsContent value="audit" className="animate-in fade-in-50 duration-300 mt-0">
            <ActivityAuditTab onRowClick={(log) => {
                setSelectedLog(log);
                setIsActivityDrawerOpen(true);
            }} />
        </TabsContent>
      </Tabs>

      <StaffAccountModal 
          isOpen={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen}
          onSuccess={() => setRefreshKey(k => k + 1)}
          initialData={null} 
      />

      <StaffDrawer 
          isOpen={isDrawerOpen}
          staff={selectedStaff}
          onClose={() => setIsDrawerOpen(false)} 
          onUpdate={() => setRefreshKey(k => k + 1)}
      />

      <ActivityDrawer
          isOpen={isActivityDrawerOpen}
          log={selectedLog}
          onClose={() => setIsActivityDrawerOpen(false)}
      />
    </div>
  )
}