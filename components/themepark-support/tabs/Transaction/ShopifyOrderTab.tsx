// components/it-poswf/tabs/Transaction/ShopifyOrderTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag,Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { ShopifyOrder } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"

// Define a type for the table display based on the API result
interface ShopifyTableData extends ShopifyOrder {
    orderName?: string; // Add the search term for display
}


export default function ShopifyOrderTab() {
  const { toast } = useToast()
  const [orderName, setOrderName] = useState("")
  const [searchResult, setSearchResult] = useState<ShopifyTableData | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)


  const handleSearch = async () => {
    const rawInput = orderName.trim().replace(/#/g, '');

    if (!rawInput.trim()) {
      setSearchResult(null)
      setErrorMessage("Please enter an Order Name.")
      return
    }

    const formattedQuery = `#${rawInput}`;

    setIsSearching(true)
    setSearchResult(null)
    setErrorMessage(null)

    try {
      const response = await itPoswfService.searchShopifyOrder(formattedQuery)

      if (response.success) {
        if (response.data) {
          setSearchResult({ ...response.data, orderName: formattedQuery })
          toast({
              title: "Search Complete",
              description: "Transaction details retrieved successfully.",
              variant: "default",
          })
        } else {
          setSearchResult(null)
          setErrorMessage(response.message || `No transaction found for order ${formattedQuery}.`)
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
    { header: "Order Name (Searched)", accessor: "orderName", cell: (value) => <span className="font-semibold">{value}</span> },
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
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="shopify-order-input" className="text-sm font-medium">
                Shopify Order Name
              </Label>
              <div className="relative">
                {/* Hardcoded # Symbol */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold select-none">
                  #
                </span>
                <Input
                  id="shopify-order-input"
                  type="text"
                  placeholder="29174" 
                  value={orderName}
                  // Force remove # if user pastes it, ensuring state is pure numbers/text
                  onChange={(e) => setOrderName(e.target.value.replace(/#/g, ''))} 
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-11 pl-7" // Added padding-left (pl-7) to make room for the #
                  disabled={isSearching}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isSearching || !orderName.trim()} className="h-11 px-8">
                <Search className="mr-2 h-4 w-4" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
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