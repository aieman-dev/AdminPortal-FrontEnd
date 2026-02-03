"use client"

import { useState } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Clock } from "lucide-react"
import { SearchField } from "@/components/shared-components/search-field"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { BalanceCard } from "@/components/shared-components/balance-card"
import { itPoswfService } from "@/services/themepark-support"
import { type BalanceDetail, type BalanceTransaction } from "@/type/themepark-support"
import { formatCurrency } from "@/lib/formatter";
import { useToast } from "@/hooks/use-toast"

export default function ActivateBalancePage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [searchResult, setSearchResult] = useState<BalanceDetail | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!email) return

    setIsSearching(true)
    setSearchResult(null)

    try {
      // Use real service instead of mock data
      const response = await itPoswfService.getAccountBalanceDetails(email.trim());
      
      if (response.success && response.data) {
        setSearchResult(response.data)
        toast({ 
            title: "Search Complete", 
            description: "Balance details retrieved successfully." 
        })
      } else {
        toast({
            title: "Search Failed",
            description: response.error || "No balance details found for this email.",
            variant: "destructive"
        })
      }
    } catch (error) {
        console.error("Search Error:", error)
        toast({
            title: "Network Error",
            description: "Failed to connect to the server.",
            variant: "destructive"
        })
    } finally {
      setIsSearching(false)
    }
  }

  const transactionColumns: TableColumn<BalanceTransaction>[] = [
    { header: "Invoice No", accessor: "invoiceNo", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Name", accessor: "name" },
    { header: "Amount", accessor: "amount", cell: (value) => formatCurrency(value) },
    { header: "Trx Type", accessor: "trxType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Created Date", accessor: "createdDate" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Activate Balance" description="Search and manage user balance information" />

      {/* Search Section */}
      <Card>
        <CardContent>
          <SearchField
            label="Email Address"
            placeholder="Enter user email"
            value={email}
            onChange={setEmail}
            onSearch={handleSearch}
            isSearching={isSearching}
          />
        </CardContent>
      </Card>

      {/* Balance Information */}
      {searchResult && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <BalanceCard
              title="Credit Balance"
              amount={searchResult.currentBalance}
              description="Available balance"
              icon={Wallet}
              valueColor="text-green-600"
            />
            <BalanceCard
              title="Expired Balance"
              amount={searchResult.expiredBalance}
              description="Expired credits"
              icon={Clock}
              valueColor="text-red-600"
            />
          </div>

          {/* Transaction History Table */}
          <Card>
            <CardContent className="space-y-4">
              <div className="text-sm font-medium">Transaction History</div>
              <DataTable
                columns={transactionColumns}
                data={searchResult.history}
                keyExtractor={(row) => row.invoiceNo}
                emptyMessage="No transactions found"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}