"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Trash2, Plus } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { carParkService } from "@/services/car-park-services"
import { WhitelistedUser } from "@/type/car-park"
import { useAppToast } from "@/hooks/use-app-toast"
import { FeatureUnderConstruction } from "@/components/portal/feature-under-construction"

export default function WhitelistTab() {
    /* 
    const toast = useAppToast()
    const [searchTerm, setSearchTerm] = useState("")
    const [data, setData] = useState<WhitelistedUser[]>([])
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await carParkService.getWhitelist(searchTerm)
            setData(res)
        } catch (error) {
            toast.error("Error", "Failed to fetch whitelist.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const columns: TableColumn<WhitelistedUser>[] = useMemo (() =>[
        { header: "QrID", accessor: "qrId", className: "pl-6 font-mono" },
        { header: "Email", accessor: "email" },
        { header: "Staff No", accessor: "staffNo" },
        { header: "Car Plate", accessor: "carPlate", className: "uppercase" },
        { header: "Reason/Remarks", accessor: "remarks" },
        { 
            header: "Action", accessor: "id", className: "text-right pr-6",
            cell: (id) => (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
            )
        }
    ], []);
     */

    return (
        <>
        {/*
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <SearchField 
                                label="Search Whitelist"
                                placeholder="Search by Email, Plate, or QrID..."
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onSearch={fetchData}
                                isSearching={loading}
                            />
                        </div>
                        <Button className="h-11 bg-green-600 hover:bg-green-700 text-white">
                            <Plus className="h-4 w-4 mr-2" /> Add to Whitelist
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
                        emptyIcon={ShieldCheck}
                        emptyTitle="No Whitelisted Users"
                        emptyMessage="No users have been explicitly whitelisted."
                    />
                </CardContent>
            </Card>
        </div>
        */}
        <FeatureUnderConstruction 
            title="Whitelist Management"
            description="The whitelist logic is currently under review to support the new multi-tier exemption feature. This module is temporarily halted."
            badgeText="Under Construction"
        />
     </>
    )
}