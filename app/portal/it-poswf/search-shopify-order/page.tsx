"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"
import { SearchField } from "@/components/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/it-poswf/data-table"
import { StatusBadge } from "@/components/it-poswf/status-badge"
import { mockShopifyOrders, type ShopifyOrder } from "@/lib/mock-data/it-poswf"

export default function SearchShopifyOrderPage() {
  const [orderNo, setOrderNo] = useState("")
  const [searchResult, setSearchResult] = useState<ShopifyOrder[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    setIsSearching(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (orderNo.trim()) {
      // Filter mock data based on order number
      const filtered = mockShopifyOrders.filter((order) =>
        order.orderName.toLowerCase().includes(orderNo.toLowerCase()),
      )
      setSearchResult(filtered.length > 0 ? filtered : [])
    } else {
      setSearchResult(mockShopifyOrders)
    }
    setIsSearching(false)
  }

  const orderColumns: TableColumn<ShopifyOrder>[] = [
    { header: "Order Name", accessor: "orderName", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Order Email", accessor: "orderEmail" },
    { header: "Total Price", accessor: "totalPrice", cell: (value) => <span className="font-semibold">{value}</span> },
    { header: "Payment Status", accessor: "paymentStatus", cell: (value) => <StatusBadge status={value} /> },
    {
      header: "Created Date",
      accessor: "createdDate",
      cell: (value) => <span className="text-muted-foreground">{value}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardContent>
          <SearchField
            label="Shopify Order No"
            placeholder="Enter order number (e.g., #1001)"
            value={orderNo}
            onChange={setOrderNo}
            onSearch={handleSearch}
            isSearching={isSearching}
          />
        </CardContent>
      </Card>

      {/* Results Table */}
      {searchResult && (
        <Card>
          <CardContent className="space-y-4">
            {searchResult.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  <div className="text-lg font-semibold">Order Results</div>
                </div>
                <DataTable
                  columns={orderColumns}
                  data={searchResult}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No orders found matching your search"
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No orders found matching your search.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
