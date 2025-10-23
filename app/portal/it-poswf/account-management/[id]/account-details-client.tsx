"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StatusBadge } from "@/components/it-poswf/status-badge"
import { BalanceCard } from "@/components/it-poswf/balance-card"
import { ArrowLeft, CheckCircle2, Wallet, Clock } from "lucide-react"
import type { Account } from "@/types/account" // Import the Account type

type ActionType = "activate" | "inactive" | "reset-password" | "exchange" | "change-email" | "activate-balance" | null

interface AccountDetailsClientProps {
  account: Account
}

export function AccountDetailsClient({ account: initialAccount }: AccountDetailsClientProps) {
  const router = useRouter()
  const [account, setAccount] = useState<Account>(initialAccount)
  const [actionType, setActionType] = useState<ActionType>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  const [creditBalance] = useState(1250.0)
  const [expiredBalance] = useState(350.0)

  const [newEmail, setNewEmail] = useState("")
  const [newAccId, setNewAccId] = useState("")

  const handleAction = (type: ActionType) => {
    if (type === "reset-password" || type === "inactive") {
      setActionType(type)
      setIsConfirmOpen(true)
    } else {
      setActionType(type)
    }
  }

  const handleConfirmAction = async () => {
    setIsProcessing(true)
    setIsConfirmOpen(false)

    setTimeout(() => {
      if (actionType === "reset-password") {
        setSuccessMessage("Password reset successfully. Default password: 123456")
      } else if (actionType === "inactive") {
        setSuccessMessage("Inactive account successfully")
        setAccount({ ...account, accountStatus: "Inactive" })
      }
      setShowSuccess(true)
      setIsProcessing(false)
      setActionType(null)
      setTimeout(() => setShowSuccess(false), 5000)
    }, 1000)
  }

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return

    setIsProcessing(true)
    setTimeout(() => {
      setAccount({ ...account, email: newEmail })
      setSuccessMessage(`Email changed successfully to ${newEmail}`)
      setShowSuccess(true)
      setIsProcessing(false)
      setActionType(null)
      setNewEmail("")
      setTimeout(() => setShowSuccess(false), 5000)
    }, 1000)
  }

  const handleExchangeTransaction = async () => {
    if (!newEmail.trim() || !newAccId.trim()) return

    setIsProcessing(true)
    setTimeout(() => {
      setSuccessMessage(`Transaction exchanged successfully to ${newEmail} (${newAccId})`)
      setShowSuccess(true)
      setIsProcessing(false)
      setActionType(null)
      setNewEmail("")
      setNewAccId("")
      setTimeout(() => setShowSuccess(false), 5000)
    }, 1000)
  }

  const handleActivateAccount = async () => {
    setIsProcessing(true)
    setTimeout(() => {
      setAccount({ ...account, accountStatus: "Active" })
      setSuccessMessage("Account activated successfully")
      setShowSuccess(true)
      setIsProcessing(false)
      setTimeout(() => setShowSuccess(false), 5000)
    }, 1000)
  }

  const handleActivateExpiredBalance = async () => {
    setIsProcessing(true)
    setTimeout(() => {
      setSuccessMessage("Expired balance activated successfully")
      setShowSuccess(true)
      setIsProcessing(false)
      setActionType(null)
      setTimeout(() => setShowSuccess(false), 5000)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Account Management
      </Button>

      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-600 dark:text-green-400 font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Account Details</h3>
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Account ID</div>
              <div className="font-medium">{account.accId}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{account.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">First Name</div>
              <div className="font-medium">{account.firstName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Mobile</div>
              <div className="font-medium">{account.mobile}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created Date</div>
              <div className="font-medium">{account.createdDate}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div>
                <StatusBadge status={account.accountStatus} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {account.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  account.transactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{transaction.invoiceNo}</TableCell>
                      <TableCell>{transaction.name}</TableCell>
                      <TableCell>RM {transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={transaction.trxType} />
                      </TableCell>
                      <TableCell>{transaction.createdDate}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleActivateAccount}
                disabled={isProcessing || account.accountStatus === "Active"}
              >
                Activate Account
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction("inactive")}
                disabled={isProcessing || account.accountStatus === "Inactive"}
              >
                Inactive Account
              </Button>
              <Button variant="outline" onClick={() => handleAction("reset-password")} disabled={isProcessing}>
                Reset Password
              </Button>
              <Button variant="outline" onClick={() => handleAction("exchange")} disabled={isProcessing}>
                Exchange Transaction
              </Button>
              <Button variant="outline" onClick={() => handleAction("change-email")} disabled={isProcessing}>
                Change Email
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setActionType("activate-balance")
                }}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Activating..." : "Activate Balance"}
              </Button>
            </div>

            {actionType === "change-email" && (
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="text-sm font-medium">Change Email</h4>
                <div className="space-y-2">
                  <Label htmlFor="new-email" className="text-sm font-medium">
                    New Email
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button onClick={handleChangeEmail} disabled={isProcessing || !newEmail.trim()} className="w-full">
                  {isProcessing ? "Changing..." : "Change Email"}
                </Button>
              </div>
            )}

            {actionType === "exchange" && (
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="text-sm font-medium">Exchange Transaction</h4>
                <div className="space-y-2">
                  <Label htmlFor="exchange-email" className="text-sm font-medium">
                    New Email
                  </Label>
                  <Input
                    id="exchange-email"
                    type="email"
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange-accid" className="text-sm font-medium">
                    New Account ID
                  </Label>
                  <Input
                    id="exchange-accid"
                    placeholder="Enter new account ID"
                    value={newAccId}
                    onChange={(e) => setNewAccId(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button
                  onClick={handleExchangeTransaction}
                  disabled={isProcessing || !newEmail.trim() || !newAccId.trim()}
                  className="w-full"
                >
                  {isProcessing ? "Exchanging..." : "Exchange Transaction"}
                </Button>
              </div>
            )}

            {actionType === "activate-balance" && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="text-sm font-medium">Activate Balance</h4>

                <div className="grid gap-4 md:grid-cols-2">
                  <BalanceCard
                    title="Credit Balance"
                    amount={creditBalance}
                    description="Available balance"
                    icon={Wallet}
                    valueColor="text-green-600"
                  />
                  <BalanceCard
                    title="Expired Balance"
                    amount={expiredBalance}
                    description="Expired credits"
                    icon={Clock}
                    valueColor="text-red-600"
                  />
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Transaction History</div>
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Trx Type</TableHead>
                          <TableHead>Created Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {account.transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          account.transactions.map((transaction, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{transaction.invoiceNo}</TableCell>
                              <TableCell>{transaction.name}</TableCell>
                              <TableCell>RM {transaction.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <StatusBadge status={transaction.trxType} />
                              </TableCell>
                              <TableCell>{transaction.createdDate}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Button onClick={handleActivateExpiredBalance} disabled={isProcessing} className="w-full">
                  {isProcessing ? "Activating..." : "Activate Expired Balance"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isConfirmOpen && (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType === "reset-password"
                  ? "Reset Password"
                  : actionType === "inactive"
                    ? "Inactive Account"
                    : "Activate Expired Balance"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === "reset-password"
                  ? "Are you sure you want to reset this account's password? The default password will be set to 123456."
                  : actionType === "inactive"
                    ? "Are you sure you want to inactive this account? The user will not be able to access their account."
                    : "Are you sure you want to activate the expired balance? This will convert expired credits to active balance."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAction}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
