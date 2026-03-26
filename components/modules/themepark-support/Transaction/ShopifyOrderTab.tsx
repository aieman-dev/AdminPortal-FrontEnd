// components/it-poswf/tabs/Transaction/ShopifyOrderTab.tsx
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Search, SearchX, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Label } from "@/components/ui/label"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { ShopifyOrder } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useAppToast } from "@/hooks/use-app-toast"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group"
import { useAutoSearch } from "@/hooks/use-auto-search"

interface ShopifyTableData extends ShopifyOrder {
    orderName?: string;
}

export default function ShopifyOrderTab() {
  const toast = useAppToast()
  const searchParams = useSearchParams() 
  const urlQuery = searchParams.get('search')
  const [orderName, setOrderName] = useState("")
  const [searchResult, setSearchResult] = useState<ShopifyTableData | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 3. CORE SEARCH LOGIC
  const performSearch = useCallback(async (query: string) => {
    const rawInput = query.trim().replace(/#/g, '');
    
    if (!rawInput) return;

    setOrderName(rawInput);

    const formattedQuery = `#${rawInput}`;

    setIsSearching(true)
    setSearchResult(null)
    setErrorMessage(null)

    try {
      const response = await itPoswfService.searchShopifyOrder(formattedQuery)

      if (response.success) {
        if (response.data) {
          setSearchResult({ ...response.data, orderName: formattedQuery })
          toast.success("Search Complete", "Transaction details retrieved successfully.");
        } else {
          setSearchResult(null)
          setErrorMessage(response.message || `No transaction found for order ${formattedQuery}.`)
        }
      } else {
        setErrorMessage(response.error || "Server error occurred during search.")
        toast.error("Search Failed", response.error || "Server error occurred.");
      }
    } catch (error) {
        console.error("Search Error:", error)
        setErrorMessage("An unexpected network error occurred.")
        toast.error("Error", "A network error occurred during the search.");
    } finally {
      setIsSearching(false)
    }
  }, []) 

  useAutoSearch(performSearch);

  // 4. MANUAL BUTTON HANDLER
  const handleSearch = () => {
      performSearch(orderName);
  }

  useEffect(() => {
    const handleTabRefresh = () => {
        if (orderName) {
            performSearch(orderName);
        }
    };

    window.addEventListener('refresh-active-tab', handleTabRefresh);
    return () => window.removeEventListener('refresh-active-tab', handleTabRefresh);
  }, [orderName]);

  const orderTrxColumns: TableColumn<ShopifyTableData>[] = useMemo(() => [
    { header: "Order Name (Searched)", accessor: "orderName", cell: (value) => <span className="font-semibold">{value}</span> },
    { header: "Transaction ID", accessor: "trxId" },
    { header: "Invoice No", accessor: "invoiceNo" },
    { header: "Amount", accessor: "amount"},
    { header: "Email", accessor: "email"},
    { header: "Purchased Date", accessor: "purchasedDate" },
    { header: "Financial Status", accessor: "financialStatus"}
  ], []);

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
              
              <InputGroup className="h-11">
                <InputGroupAddon>
                    <InputGroupText>#</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput 
                    id="shopify-order-input"
                    className="h-11"
                    placeholder="29174" 
                    value={orderName}
                    onChange={(e) => setOrderName(e.target.value.replace(/#/g, ''))} 
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={isSearching}
                />
              </InputGroup>

            </div>
            <div className="flex items-end">
              <LoadingButton 
                  onClick={handleSearch} 
                  isLoading={isSearching} 
                  loadingText="Searching..."
                  icon={Search}
                  disabled={!orderName.trim()}
                  className="h-11 px-8"
              >
                  Search
              </LoadingButton>
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
          <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <div className="text-lg font-semibold">Transaction Details</div>
              </div>
            </div>
            <CardContent className="p-0">
              <DataTable
                columns={orderTrxColumns}
                data={dataForTable}
                keyExtractor={() => "shopify-trx-detail-row"} 
                isLoading={isSearching}
                emptyIcon={SearchX}
                emptyTitle="No Order Found"
                emptyMessage={`No transaction found for order #${orderName}`}
              />
          </CardContent>
        </Card>
      )}
    </div>
  )
}