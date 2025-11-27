// components/it-poswf/tabs/Transaction/ShopifyOrderTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { ShopifyOrder } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"

// Define a type for the table display based on the API result
interface ShopifyTableData extends ShopifyOrder {
    orderId?: string; // Add the search term for display
}


export default function ShopifyOrderTab() {
  const { toast } = useToast()
  const [orderNo, setOrderNo] = useState("")
  const [searchResult, setSearchResult] = useState<ShopifyTableData | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)


  const handleSearch = async () => {
    if (!orderNo.trim()) {
      setSearchResult(null)
      setErrorMessage("Please enter an Order ID.")
      return
    }

    setIsSearching(true)
    setSearchResult(null)
    setErrorMessage(null)

    try {
      const response = await itPoswfService.searchShopifyOrder(orderNo.trim())

      if (response.success) {
        if (response.data) {
          setSearchResult({ ...response.data, orderId: orderNo.trim() })
          toast({
              title: "Search Complete",
              description: "Transaction details retrieved successfully.",
              variant: "default",
          })
        } else {
          setSearchResult(null)
          setErrorMessage(response.message || "No transaction found for the given Order ID.")
        }
      } else {
        setErrorMessage(response.error || "Server error occurred during search.")
        toast({
            title: "Search Failed",
            description: response.error || "Server error occurred.",
            variant: "destructive",
        });
      }
    } catch (error) {
        console.error("Search Error:", error)
        setErrorMessage("An unexpected network error occurred.")
        toast({
            title: "Error",
            description: "A network error occurred during the search.",
            variant: "destructive",
        });
    } finally {
      setIsSearching(false)
    }
  }

  const orderTrxColumns: TableColumn<ShopifyTableData>[] = [
    { header: "Order ID (Searched)", accessor: "orderId", cell: (value) => <span className="font-semibold">{value}</span> },
    { header: "Transaction ID", accessor: "trxId" },
    { header: "Invoice No", accessor: "invoiceNo" },
    { header: "Amount", accessor: "amount"},
    { header: "Email", accessor: "email"},
    { header: "Purchased Date", accessor: "purchasedDate" },
    { header: "Financial Status", accessor: "financialStatus"}
  ]

  const dataForTable = searchResult ? [searchResult] : []


  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchField
            label="Shopify Order ID"
            placeholder="Enter Order ID (e.g., 4586345234678)"
            value={orderNo}
            onChange={setOrderNo}
            onSearch={handleSearch}
            isSearching={isSearching}
          />
        </CardContent>
      </Card>
      
      {errorMessage && (
        <Card>
          <CardContent className="py-4">
              <div className="text-red-600 font-medium text-sm">{errorMessage}</div>
          </CardContent>
        </Card>
      )}

      {(isSearching || dataForTable.length > 0) && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <div className="text-lg font-semibold">Transaction Details</div>
            </div>
            <DataTable
              columns={orderTrxColumns}
              data={dataForTable}
              keyExtractor={() => "shopify-trx-detail-row"} 
              emptyMessage={isSearching ? "Searching..." : "No transaction found for this Order ID."}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}