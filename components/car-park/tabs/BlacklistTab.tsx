"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ban, Unlock, Plus } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { carParkService } from "@/services/car-park-services"
import { BlockedUser } from "@/type/car-park"
import { useAppToast } from "@/hooks/use-app-toast"

export default function BlacklistTab() {
    const toast = useAppToast()
    const [searchTerm, setSearchTerm] = useState("")
    const [data, setData] = useState<BlockedUser[]>([])
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await carParkService.getBlacklist(searchTerm)
            setData(res)
        } catch (error) {
            toast.error("Error", "Failed to fetch blacklist.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const columns: TableColumn<BlockedUser>[] = [
        { header: "QrID", accessor: "qrId", className: "pl-6 font-mono" },
        { header: "Email", accessor: "email" },
        { header: "Staff No", accessor: "staffNo" },
        { header: "Car Plate", accessor: "carPlate", className: "uppercase" },
        { header: "Unit No", accessor: "unitNo" },
        { header: "Season Package", accessor: "seasonPackage" },
        { 
            header: "Action", accessor: "id", className: "text-right pr-6",
            cell: (id) => (
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                    <Unlock className="h-4 w-4 mr-2" /> Unblock
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <SearchField 
                                label="Search Blacklist"
                                placeholder="Search by Email, Plate, or QrID..."
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onSearch={fetchData}
                                isSearching={loading}
                            />
                        </div>
                        <Button className="h-11 bg-red-600 hover:bg-red-700 text-white">
                            <Ban className="h-4 w-4 mr-2" /> Block New User
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <DataTable 
                        columns={columns}
                        data={data}
                        keyExtractor={(row) => row.id}
                        isLoading={loading}
                        emptyIcon={Ban}
                        emptyTitle="No Blocked Users"
                        emptyMessage="There are currently no users in the blacklist."
                    />
                </CardContent>
            </Card>
        </div>
    )
}