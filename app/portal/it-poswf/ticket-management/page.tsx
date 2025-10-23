"use client"

import { useState } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Wallet, TrendingUp, CheckCircle2, Calendar, Key, Settings } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/it-poswf/data-table"
import { StatusBadge } from "@/components/it-poswf/status-badge"
import { BalanceCard } from "@/components/it-poswf/balance-card"
import { PasswordDisplay } from "@/components/it-poswf/password-display"
import {
  mockManualConsumeData,
  mockTerminals,
  mockExtendTicketData,
  mockPasswordData,
  mockTerminalData,
  type ManualConsumeData,
  type AvailableTicket,
  type ExtendTicketData,
  type PasswordData,
  type Terminal,
} from "@/lib/mock-data/it-poswf"
import { useToast } from "@/hooks/use-toast"
import { Pencil } from "lucide-react"

export default function TicketManagementPage() {
  const { toast } = useToast()

  // Update QR Password states
  const [qrInvoiceNo, setQrInvoiceNo] = useState("")
  const [qrSearchResult, setQrSearchResult] = useState<PasswordData | null>(null)
  const [isQrSearching, setIsQrSearching] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Manual Consume states
  const [consumeType, setConsumeType] = useState<string>("")
  const [email, setEmail] = useState("")
  const [mobileNo, setMobileNo] = useState("")
  const [invoiceNo, setInvoiceNo] = useState("")
  const [terminalId, setTerminalId] = useState<string>("")
  const [ticketType, setTicketType] = useState<string>("")
  const [ticketStatus, setTicketStatus] = useState<string>("")
  const [consumeSearchResult, setConsumeSearchResult] = useState<ManualConsumeData | null>(null)
  const [isConsumeSearching, setIsConsumeSearching] = useState(false)

  // Resync Transaction states
  const [transactionId, setTransactionId] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [showResyncSuccess, setShowResyncSuccess] = useState(false)

  // Extend Expiry states
  const [extendSearchQuery, setExtendSearchQuery] = useState("")
  const [extendSearchResult, setExtendSearchResult] = useState<ExtendTicketData[]>([])
  const [isExtendSearching, setIsExtendSearching] = useState(false)
  const [editedDates, setEditedDates] = useState<Record<string, string>>({})

  const [terminalSearchTerm, setTerminalSearchTerm] = useState("")
  const [terminals, setTerminals] = useState(mockTerminalData)
  const [isTerminalSearching, setIsTerminalSearching] = useState(false)
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Update QR Password handlers
  const handleQrSearch = async () => {
    if (!qrInvoiceNo) return
    setIsQrSearching(true)
    setResetSuccess(false)
    setTimeout(() => {
      setQrSearchResult(mockPasswordData)
      setIsQrSearching(false)
    }, 500)
  }

  const handleResetPassword = async () => {
    setIsResetting(true)
    setTimeout(() => {
      setResetSuccess(true)
      setIsResetting(false)
      if (qrSearchResult) {
        setQrSearchResult({
          ...qrSearchResult,
          currentPassword: "QR2024NEW" + Math.random().toString(36).substring(7).toUpperCase(),
        })
      }
    }, 1000)
  }

  // Manual Consume handlers
  const handleConsumeSearch = async () => {
    if (!consumeType || !email || !invoiceNo || !terminalId || !ticketType || !ticketStatus) {
      return
    }
    setIsConsumeSearching(true)
    setTimeout(() => {
      setConsumeSearchResult(mockManualConsumeData)
      setIsConsumeSearching(false)
    }, 500)
  }

  const ticketColumns: TableColumn<AvailableTicket>[] = [
    { header: "Package Name", accessor: "packageName", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Item Name", accessor: "itemName" },
    { header: "Consume Terminal", accessor: "consumeTerminal" },
    { header: "Item Type", accessor: "itemType", cell: (value) => <StatusBadge status={value} /> },
    { header: "iPoints", accessor: "ipoints", cell: (value) => value.toLocaleString() },
    { header: "Package Status", accessor: "packageStatus", cell: (value) => <StatusBadge status={value} /> },
  ]

  // Resync Transaction handlers
  const handleExecute = async () => {
    if (!transactionId.trim()) return
    setIsExecuting(true)
    setShowResyncSuccess(false)
    setTimeout(() => {
      setIsExecuting(false)
      setShowResyncSuccess(true)
      setTimeout(() => setShowResyncSuccess(false), 5000)
    }, 1000)
  }

  // Extend Expiry handlers
  const handleExtendSearch = async () => {
    if (!extendSearchQuery) return
    setIsExtendSearching(true)
    setTimeout(() => {
      setExtendSearchResult(mockExtendTicketData)
      const initialDates: Record<string, string> = {}
      mockExtendTicketData.forEach((ticket) => {
        initialDates[ticket.ticketNo] = ticket.expiryDate
      })
      setEditedDates(initialDates)
      setIsExtendSearching(false)
    }, 500)
  }

  const handleDateChange = (ticketNo: string, newDate: string) => {
    setEditedDates((prev) => ({
      ...prev,
      [ticketNo]: newDate,
    }))
  }

  const handleUpdate = (ticketNo: string) => {
    toast({
      title: "Success",
      description: `Expiry date updated for ticket ${ticketNo}`,
    })
  }

  const handleTerminalSearch = async () => {
    setIsTerminalSearching(true)
    setTimeout(() => {
      if (terminalSearchTerm) {
        const filtered = mockTerminalData.filter(
          (terminal) =>
            terminal.terminalName.toLowerCase().includes(terminalSearchTerm.toLowerCase()) ||
            terminal.uuid.toLowerCase().includes(terminalSearchTerm.toLowerCase()),
        )
        setTerminals(filtered)
      } else {
        setTerminals(mockTerminalData)
      }
      setIsTerminalSearching(false)
    }, 500)
  }

  const handleEdit = (terminal: Terminal) => {
    setEditingTerminal({ ...terminal })
    setIsDialogOpen(true)
  }

  const handleTerminalUpdate = async () => {
    if (!editingTerminal) return

    setIsUpdating(true)
    setTimeout(() => {
      const updatedTerminals = terminals.map((t) =>
        t.id === editingTerminal.id
          ? { ...editingTerminal, modifiedDate: new Date().toISOString().slice(0, 19).replace("T", " ") }
          : t,
      )
      setTerminals(updatedTerminals)
      setIsDialogOpen(false)
      setEditingTerminal(null)
      setIsUpdating(false)
      toast({
        title: "Success",
        description: "Terminal updated successfully",
      })
    }, 500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Management"
        description="Unified ticket operations - manage QR passwords, consume tickets, resync transactions, extend expiry, and update terminals"
      />

      <Tabs defaultValue="qr-password" className="space-y-6">
        <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full justify-start rounded-none">
          <TabsTrigger
            value="qr-password"
            className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative data-[state=active]:z-10"
          >
            <Key className="mr-2 h-4 w-4" />
            Update QR Password
          </TabsTrigger>
          <TabsTrigger
            value="manual-consume"
            className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Manual Consume
          </TabsTrigger>
          <TabsTrigger
            value="resync"
            className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Resync Transaction
          </TabsTrigger>
          <TabsTrigger
            value="extend-expiry"
            className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Extend Expiry
          </TabsTrigger>
          <TabsTrigger
            value="update-terminal"
            className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
          >
            <Settings className="mr-2 h-4 w-4" />
            Update Terminal
          </TabsTrigger>
        </TabsList>

        {/* Update QR Password Tab */}
        <TabsContent value="qr-password" className="mt-0 space-y-6">
          <Card>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="qr-invoice" className="text-sm font-medium">
                  Invoice Number
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="qr-invoice"
                    placeholder="Enter invoice number"
                    value={qrInvoiceNo}
                    onChange={(e) => setQrInvoiceNo(e.target.value)}
                    className="h-11"
                  />
                  <Button onClick={handleQrSearch} disabled={isQrSearching} className="h-11 px-8">
                    <Search className="mr-2 h-4 w-4" />
                    {isQrSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {qrSearchResult && (
            <PasswordDisplay
              invoiceNo={qrSearchResult.invoiceNo}
              currentPassword={qrSearchResult.currentPassword}
              onReset={handleResetPassword}
              isResetting={isResetting}
              resetSuccess={resetSuccess}
            />
          )}
        </TabsContent>

        {/* Manual Consume Tab */}
        <TabsContent value="manual-consume" className="mt-0 space-y-6">
          <Card>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="consumeType" className="text-sm font-medium">
                    Consume Type
                  </Label>
                  <Select value={consumeType} onValueChange={setConsumeType}>
                    <SelectTrigger id="consumeType" className="h-11">
                      <SelectValue placeholder="Select consume type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superapp">By Superapp</SelectItem>
                      <SelectItem value="receipt">By Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNo" className="text-sm font-medium">
                    Mobile No <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="mobileNo"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNo" className="text-sm font-medium">
                    Invoice No
                  </Label>
                  <Input
                    id="invoiceNo"
                    placeholder="Enter invoice number"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terminalId" className="text-sm font-medium">
                    Terminal ID
                  </Label>
                  <Select value={terminalId} onValueChange={setTerminalId}>
                    <SelectTrigger id="terminalId" className="h-11">
                      <SelectValue placeholder="Select terminal" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTerminals.map((terminal) => (
                        <SelectItem key={terminal.value} value={terminal.value}>
                          {terminal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticketType" className="text-sm font-medium">
                    Ticket Type
                  </Label>
                  <Select value={ticketType} onValueChange={setTicketType}>
                    <SelectTrigger id="ticketType" className="h-11">
                      <SelectValue placeholder="Select ticket type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket">Ticket</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="reward">Reward</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticketStatus" className="text-sm font-medium">
                    Ticket Status
                  </Label>
                  <Select value={ticketStatus} onValueChange={setTicketStatus}>
                    <SelectTrigger id="ticketStatus" className="h-11">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="unused">Unused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end md:col-span-2 lg:col-span-3">
                  <Button onClick={handleConsumeSearch} disabled={isConsumeSearching} className="h-11 px-8">
                    <Search className="mr-2 h-4 w-4" />
                    {isConsumeSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {consumeSearchResult && (
            <>
              <div className="grid gap-4 md:grid-cols-1">
                <BalanceCard
                  title="Credit Balance"
                  amount={consumeSearchResult.creditBalance}
                  description="Available balance for consumption"
                  icon={Wallet}
                  valueColor="text-green-600"
                />
              </div>

              <Card>
                <CardContent className="space-y-4">
                  <div className="text-sm font-medium">Available Tickets</div>
                  <DataTable
                    columns={ticketColumns}
                    data={consumeSearchResult.availableTickets}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No available tickets found"
                  />

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Amount</span>
                      </div>
                      <span className="text-lg font-semibold">
                        {consumeSearchResult.totalAmount.toLocaleString()} iPoints
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Reward Credit</span>
                      </div>
                      <span className="text-lg font-semibold text-green-600">
                        {consumeSearchResult.totalRewardCredit.toLocaleString()} Credits
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Resync Transaction Tab */}
        <TabsContent value="resync" className="mt-0 space-y-6">
          <Card>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="transaction-id" className="text-sm font-medium">
                  Transaction ID
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="transaction-id"
                    placeholder="Enter transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="h-11"
                  />
                  <Button onClick={handleExecute} disabled={isExecuting} className="h-11 px-8">
                    <Search className="mr-2 h-4 w-4" />
                    {isExecuting ? "Executing..." : "Execute"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {showResyncSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400 font-medium">
                Transaction migrated successfully
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Extend Expiry Tab */}
        <TabsContent value="extend-expiry" className="mt-0 space-y-6">
          <Card>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="extend-search" className="text-sm font-medium">
                  Invoice No. / Transaction No
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="extend-search"
                    placeholder="Enter invoice or transaction number"
                    value={extendSearchQuery}
                    onChange={(e) => setExtendSearchQuery(e.target.value)}
                    className="h-11"
                  />
                  <Button onClick={handleExtendSearch} disabled={isExtendSearching} className="h-11 px-8">
                    <Search className="mr-2 h-4 w-4" />
                    {isExtendSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {extendSearchResult.length > 0 && (
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Ticket Information
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket No</TableHead>
                        <TableHead>Ticket Name</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Last Valid Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extendSearchResult.map((ticket) => (
                        <TableRow key={ticket.ticketNo}>
                          <TableCell className="font-medium">{ticket.ticketNo}</TableCell>
                          <TableCell>{ticket.ticketName}</TableCell>
                          <TableCell>{ticket.effectiveDate}</TableCell>
                          <TableCell>
                            <Input
                              type="datetime-local"
                              value={editedDates[ticket.ticketNo] || ticket.expiryDate}
                              onChange={(e) => handleDateChange(ticket.ticketNo, e.target.value)}
                              className="h-9 w-full min-w-[200px]"
                            />
                          </TableCell>
                          <TableCell>{ticket.lastValidDate}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => handleUpdate(ticket.ticketNo)}>
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="update-terminal" className="mt-0 space-y-6">
          <Card>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="terminal-search" className="text-sm font-medium">
                  Search Terminal
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="terminal-search"
                    placeholder="Enter terminal name or UUID"
                    value={terminalSearchTerm}
                    onChange={(e) => setTerminalSearchTerm(e.target.value)}
                    className="h-11"
                  />
                  <Button onClick={handleTerminalSearch} disabled={isTerminalSearching} className="h-11 px-8">
                    <Search className="mr-2 h-4 w-4" />
                    {isTerminalSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Terminal Name</TableHead>
                      <TableHead>UUID</TableHead>
                      <TableHead>Terminal Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Modified Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terminals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No terminals found
                        </TableCell>
                      </TableRow>
                    ) : (
                      terminals.map((terminal) => (
                        <TableRow key={terminal.id}>
                          <TableCell className="font-medium">{terminal.terminalName}</TableCell>
                          <TableCell className="font-mono text-sm">{terminal.uuid}</TableCell>
                          <TableCell>{terminal.terminalType}</TableCell>
                          <TableCell>
                            <StatusBadge status={terminal.status} />
                          </TableCell>
                          <TableCell>{terminal.modifiedDate}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(terminal)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Terminal</DialogTitle>
            <DialogDescription>Update the terminal information below.</DialogDescription>
          </DialogHeader>
          {editingTerminal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Terminal Name
                </Label>
                <Input
                  id="edit-name"
                  value={editingTerminal.terminalName}
                  onChange={(e) => setEditingTerminal({ ...editingTerminal, terminalName: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-uuid" className="text-sm font-medium">
                  UUID
                </Label>
                <Input
                  id="edit-uuid"
                  value={editingTerminal.uuid}
                  onChange={(e) => setEditingTerminal({ ...editingTerminal, uuid: e.target.value })}
                  className="h-11 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-sm font-medium">
                  Terminal Type
                </Label>
                <Select
                  value={editingTerminal.terminalType}
                  onValueChange={(value: any) => setEditingTerminal({ ...editingTerminal, terminalType: value })}
                >
                  <SelectTrigger id="edit-type" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POS">POS</SelectItem>
                    <SelectItem value="Kiosk">Kiosk</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                  value={editingTerminal.status}
                  onValueChange={(value: any) => setEditingTerminal({ ...editingTerminal, status: value })}
                >
                  <SelectTrigger id="edit-status" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleTerminalUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Terminal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
