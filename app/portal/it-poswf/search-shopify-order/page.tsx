// app/portal/it-poswf/search-shopify-order/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"
import { SearchField } from "@/components/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/it-poswf/data-table"
import { StatusBadge } from "@/components/it-poswf/status-badge"
import { ShopifyOrder } from "@/type/it-poswf" // Import the new type
import { itPoswfService } from "@/services/it-poswf-services" // Import the service
import { useToast } from "@/hooks/use-toast"

// Define a type for the table display based on the API result
interface ShopifyTableData extends ShopifyOrder {
    orderId?: string; // Add the search term for display
}


export default function SearchShopifyOrderPage() {
  const { toast } = useToast()
  const [orderNo, setOrderNo] = useState("")
  // Change state to hold the single result or null
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
      // Use the new service
      const response = await itPoswfService.searchShopifyOrder(orderNo.trim())

      if (response.success) {
        if (response.data) {
          // Map the result to include the searched orderId
          setSearchResult({ ...response.data, orderId: orderNo.trim() })
          toast({
              title: "Search Complete",
              description: "Transaction details retrieved successfully.",
              variant: "default",
          })
        } else {
          // This is the "Not Found" case returned as success by service
          setSearchResult(null)
          setErrorMessage(response.message || "No transaction found for the given Order ID.")
        }
      } else {
        // API or Network Error
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

  // Update columns to match the new API response structure
  const orderTrxColumns: TableColumn<ShopifyTableData>[] = [
    { header: "Order ID (Searched)", accessor: "orderId", cell: (value) => <span className="font-semibold">{value}</span> },
    { header: "Transaction ID", accessor: "trxId" },
    { header: "Invoice No", accessor: "invoiceNo" },
    { header: "Amount", accessor: "amount"},
    { header: "Email", accessor: "email"},
    { header: "Purchased Date", accessor: "purchasedDate" },
    { header: "Financial Status", accessor: "financialStatus"}
  ]

  // Convert the single result to an array for DataTable, or use an empty array if null
  const dataForTable = searchResult ? [searchResult] : []


  return (
    <div className="space-y-6">
      {/* Search Card */}
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
      
      {/* Error Message */}
      {errorMessage && (
        <Card>
          <CardContent className="py-4">
              <div className="text-red-600 font-medium text-sm">{errorMessage}</div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
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
              // Use a constant key as there will only be 0 or 1 rows
              keyExtractor={() => "shopify-trx-detail-row"} 
              emptyMessage={isSearching ? "Searching..." : "No transaction found for this Order ID."}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}