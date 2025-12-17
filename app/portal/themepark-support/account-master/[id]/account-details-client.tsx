"use client"

import { useState, useEffect } from "react"
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
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { BalanceCard } from "@/components/themepark-support/it-poswf/balance-card"
import { ArrowLeft, CheckCircle2, Wallet, Clock } from "lucide-react"
import type { Account, BalanceDetail } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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
  const { toast } = useToast()

  const [balanceDetail, setBalanceDetail] = useState<BalanceDetail | null>(null);

  const [newEmail, setNewEmail] = useState("")
  const [newAccId, setNewAccId] = useState("")

  const handleAction = (type: ActionType) => {
    if (type === "reset-password" || type === "activate" || type === "inactive") {
      setActionType(type)
      setIsConfirmOpen(true)
    } else {
      setActionType(type)
    }
  }

  const handleConfirmAction = async () => {
    setIsProcessing(true)
    setIsConfirmOpen(false)
    
    try {
        const accId = account.accId;
        let response;
        let successToastMessage = "";

        if (actionType === "reset-password") {
            response = await itPoswfService.resetAccountPassword(accId)
            if (response.success && response.data) {
                successToastMessage = `Password reset requested successfully.`;
            } else {
                throw new Error(response.error || "Reset failed.");
            }
        } else if (actionType === "inactive") {
            response = await itPoswfService.updateAccountStatus(accId, "Inactive")
            if (response.success) {
                setAccount(prev => ({ ...prev, accountStatus: "Inactive" }));
                successToastMessage = "Account successfully set to Inactive";
            } else {
                throw new Error(response.error || "Inactivation failed.");
            }
        } else if (actionType === "activate") {
             response = await itPoswfService.updateAccountStatus(accId, "Active")
            if (response.success) {
                setAccount(prev => ({ ...prev, accountStatus: "Active" }));
                successToastMessage = "Account activated successfully";
            } else {
                throw new Error(response.error || "Activation failed.");
            }
        }
        
        setSuccessMessage(successToastMessage);
        setShowSuccess(true)
        toast({ title: "Success", description: successToastMessage });
        setTimeout(() => setShowSuccess(false), 5000)

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
            title: "Action Failed",
            description: errorMsg,
            variant: "destructive"
        });
        setSuccessMessage("");
        setShowSuccess(false);

    } finally {
        setIsProcessing(false)
        setActionType(null)
    }
  }

  const fetchBalanceDetails = async () => {
      const email = account.email;
      if (!email || email === 'N/A') return;

      try {
        const response = await itPoswfService.getAccountBalanceDetails(email);
        
        if (response.success && response.data) {
          setBalanceDetail(response.data);
        } else {
          setBalanceDetail(null);
          console.error("Failed to load balance details:", response.error);
        }
      } catch (error) {
        setBalanceDetail(null);
        console.error("Network error fetching balance:", error);
      }
    };

    useEffect(() => {
    fetchBalanceDetails();
  }, [account.email])

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return

    setIsProcessing(true)
    try {
        const response = await itPoswfService.updateAccountEmail(account.accId, newEmail.trim());

        if (response.success) {
            setAccount(prev => ({ ...prev, email: newEmail.trim() }));
            const msg = `Email changed successfully to ${newEmail}`;
            setSuccessMessage(msg);
            toast({ title: "Success", description: msg });
            setShowSuccess(true);
            setNewEmail("");
            fetchBalanceDetails();
            setTimeout(() => setShowSuccess(false), 5000);
        } else {
            throw new Error(response.error || "Email change failed.");
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
            title: "Action Failed",
            description: errorMsg,
            variant: "destructive"
        });
    } finally {
        setIsProcessing(false);
        setActionType(null);
    }
  }

  const handleExchangeTransaction = async () => {
    if (!newEmail.trim()) return

    setIsProcessing(true)
    try {
        const response = await itPoswfService.exchangeTransactions(
            account.accId, 
            newEmail.trim(), 
            newAccId.trim() || undefined
        );

        if (response.success) {
            const msg = `Transaction exchange requested successfully to ${newEmail}${newAccId ? ` (${newAccId})` : ""}.`;
            setSuccessMessage(msg);
            toast({ title: "Success", description: msg });
            setShowSuccess(true);
            setNewEmail("");
            setNewAccId("");
            setTimeout(() => setShowSuccess(false), 5000);
        } else {
            throw new Error(response.error || "Transaction exchange failed.");
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
            title: "Action Failed",
            description: errorMsg,
            variant: "destructive"
        });
    } finally {
        setIsProcessing(false);
        setActionType(null);
    }
  }

  const handleActivateAccount = () => handleAction("activate")

  const handleActivateExpiredBalance = async () => {
    if (expiredBalance <= 0) {
         toast({
            title: "Action Blocked",
            description: "Expired balance is zero. Nothing to activate.",
            variant: "default"
        });
        setActionType(null);
        return;
    }
    setIsProcessing(true)
    try {
        const response = await itPoswfService.activateExpiredBalance(account.accId, account.email);
        
        if (response.success) {
            const msg = "Expired balance activation requested successfully.";
            setSuccessMessage(msg);
            toast({ title: "Success", description: msg });
            setShowSuccess(true);
            fetchBalanceDetails();
            setTimeout(() => setShowSuccess(false), 5000);
        } else {
            throw new Error(response.error || "Balance activation failed.");
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
            title: "Action Failed",
            description: errorMsg,
            variant: "destructive"
        });
    } finally {
        setIsProcessing(false)
        setActionType(null)
    }
  }

  const currentBalance = balanceDetail?.currentBalance ?? 0.0;
  const expiredBalance = balanceDetail?.expiredBalance ?? 0.0;
  const balanceHistory = balanceDetail?.history ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/portal">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href="/portal/themepark-support/account-master">Account Master</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Account Details ({account.accId})</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
      </div>

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
          <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-hide">
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
            {/* Reordered Actions: Reset Password, Change Email, Exchange Trx, Activate Balance, Active, Inactive */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => handleAction("reset-password")} disabled={isProcessing}>
                Reset Password
              </Button>
              <Button variant="outline" onClick={() => handleAction("change-email")} disabled={isProcessing}>
                Change Email
              </Button>
              <Button variant="outline" onClick={() => handleAction("exchange")} disabled={isProcessing}>
                Exchange Transaction
              </Button>
              <Button
                variant="outline"
                onClick={() => setActionType("activate-balance")}
                disabled={isProcessing}
              >
                Activate Balance
              </Button>
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
            </div>

            {/* Change Email Form */}
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

            {/* Exchange Transaction Form */}
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
                  disabled={isProcessing || !newEmail.trim()}
                  className="w-full"
                >
                  {isProcessing ? "Exchanging..." : "Exchange Transaction"}
                </Button>
              </div>
            )}

            {/* Activate Balance Section */}
            {actionType === "activate-balance" && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="text-sm font-medium">Activate Balance</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <BalanceCard
                    title="Credit Balance"
                    amount={currentBalance}
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
                  <div className="overflow-x-auto border rounded-lg max-h-64 overflow-y-auto scrollbar-hide">
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
                        {balanceHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          balanceHistory.map((transaction, index) => (
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

                <Button 
                    onClick={handleActivateExpiredBalance} 
                    disabled={isProcessing || expiredBalance <= 0} 
                    className="w-full"
                >
                  {isProcessing ? "Activating..." : "Activate Expired Balance"}
                </Button>
                {expiredBalance <= 0 && (
                     <p className="text-center text-sm text-red-500">
                        Expired balance is RM 0.00. Button is disabled.
                     </p>
                 )}
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
                    : "Activate Account"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === "reset-password"
                  ? "Are you sure you want to reset this account's password? The default password will be set to 123456."
                  : actionType === "inactive"
                    ? "Are you sure you want to inactive this account? The user will not be able to access their account."
                    : "Are you sure you want to activate this account? The user will regain access."}
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