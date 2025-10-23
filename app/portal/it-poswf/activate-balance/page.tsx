"use client"

import { useState } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Clock } from "lucide-react"
import { SearchField } from "@/components/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/it-poswf/data-table"
import { StatusBadge } from "@/components/it-poswf/status-badge"
import { BalanceCard } from "@/components/it-poswf/balance-card"
import { mockBalanceData, type BalanceData, type Transaction } from "@/lib/mock-data/it-poswf"

export default function ActivateBalancePage() {
  const [email, setEmail] = useState("")
  const [searchResult, setSearchResult] = useState<BalanceData | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!email) return

    setIsSearching(true)
    // Simulate API call
    setTimeout(() => {
      setSearchResult(mockBalanceData)
      setIsSearching(false)
    }, 500)
  }

  const transactionColumns: TableColumn<Transaction>[] = [
    { header: "Invoice No", accessor: "invoiceNo", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Name", accessor: "name" },
    { header: "Amount", accessor: "amount", cell: (value) => `$${value.toFixed(2)}` },
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
              amount={searchResult.creditBalance}
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
                data={searchResult.transactions}
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
