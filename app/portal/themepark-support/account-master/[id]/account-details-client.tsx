"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { StatusBadge } from "@/components/shared-components/status-badge"
import { BalanceCard } from "@/components/shared-components/balance-card"
import { CheckCircle2, Wallet, Clock, SearchX, FileText, User, ShieldAlert, ArrowLeft, Mail, ArrowRightLeft, Power } from "lucide-react"
import type { Account, BalanceDetail, BalanceTransaction } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePagination } from "@/hooks/use-pagination" 
import { PaginationControls } from "@/components/ui/pagination-controls"

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

  const trxPager = usePagination({ pageSize: 50 });

  const [balanceDetail, setBalanceDetail] = useState<BalanceDetail | null>(null);

  const [newEmail, setNewEmail] = useState("")
  const [newAccId, setNewAccId] = useState("")
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const handleAction = (type: ActionType) => {
    // 1. Modal Actions
    if (type === "reset-password" || type === "activate" || type === "inactive") {
      setActionType(type)
      setIsConfirmOpen(true)
    } 
    // 2. Form Actions (Right Panel Swap)
    else {
      setNewEmail("");
      setNewAccId("");
      setActionType(type)
    }
  }

  const handleBackToHistory = () => {
      setActionType(null);
      setNewEmail("");
      setNewAccId("");
  }

  const handleConfirmAction = async () => {
    setIsProcessing(true)
    setIsConfirmOpen(false)
    
    try {
        const accId = account.accId;
        let successToastMessage = "";

        if (actionType === "reset-password") {
            const response = await itPoswfService.resetAccountPassword(accId)
            if (response.success && response.data) {
                successToastMessage = `Password reset requested successfully.`;
            } else {
                throw new Error(response.error || "Reset failed.");
            }
        } else if (actionType === "inactive") {
            const response = await itPoswfService.updateAccountStatus(accId, "Inactive")
            if (response.success) {
                setAccount(prev => ({ ...prev, accountStatus: "Inactive" }));
                successToastMessage = "Account successfully set to Inactive";
            } else {
                throw new Error(response.error || "Inactivation failed.");
            }
        } else if (actionType === "activate") {
             const response = await itPoswfService.updateAccountStatus(accId, "Active")
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
        toast({ title: "Action Failed", description: errorMsg, variant: "destructive" });
        setSuccessMessage("");
        setShowSuccess(false);

    } finally {
        setIsProcessing(false)
        if(["reset-password", "inactive", "activate"].includes(actionType || "")) {
             setActionType(null);
        }
    }
  }

  const fetchBalanceDetails = async () => {
      const email = account.email;
      if (!email || email === 'N/A') return;

      try {
        setBalanceError(null);
        const response = await itPoswfService.getAccountBalanceDetails(email);
        
        if (response.success && response.data) {
          setBalanceDetail(response.data);
        } else {
          setBalanceDetail(null);
          if (response.error?.includes("403") || response.error?.includes("401")) {
             setBalanceError("Access Denied: Unable to view balance details.");
          }
        }
      } catch (error) {
        setBalanceDetail(null);
      }
    };

    useEffect(() => { fetchBalanceDetails(); }, [account.email])

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
            setActionType(null); 
            setTimeout(() => setShowSuccess(false), 5000);
        } else {
            throw new Error(response.error || "Email change failed.");
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Error.";
        toast({ title: "Action Failed", description: errorMsg, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleExchangeTransaction = async () => {
    if (!newEmail.trim()) return
    setIsProcessing(true)
    try {
        const response = await itPoswfService.exchangeTransactions(account.accId, newEmail.trim(), newAccId.trim() || undefined);
        if (response.success) {
            const msg = `Transaction exchange requested successfully.`;
            setSuccessMessage(msg);
            toast({ title: "Success", description: msg });
            setShowSuccess(true);
            setNewEmail("");
            setNewAccId("");
            setActionType(null); 
            setTimeout(() => setShowSuccess(false), 5000);
        } else {
            throw new Error(response.error || "Transaction exchange failed.");
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Error.";
        toast({ title: "Action Failed", description: errorMsg, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleActivateAccount = () => handleAction("activate")

  const handleActivateExpiredBalance = async () => {
    if (expiredBalance <= 0) {
         toast({ title: "Action Blocked", description: "Expired balance is zero.", variant: "default" });
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
            setActionType(null); 
            setTimeout(() => setShowSuccess(false), 5000);
        } else {
            throw new Error(response.error || "Balance activation failed.");
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Error.";
        toast({ title: "Action Failed", description: errorMsg, variant: "destructive" });
    } finally {
        setIsProcessing(false)
    }
  }

  const currentBalance = balanceDetail?.currentBalance ?? 0.0;
  const expiredBalance = balanceDetail?.expiredBalance ?? 0.0;
  const balanceHistory: BalanceTransaction[] = balanceDetail?.history ?? [];

  const paginatedTransactions = useMemo(() => {
      if (!account.transactions) return [];
      const start = (trxPager.currentPage - 1) * trxPager.pageSize;
      return account.transactions.slice(start, start + trxPager.pageSize);
  }, [account.transactions, trxPager.currentPage, trxPager.pageSize]);

  const totalTrxPages = Math.ceil((account.transactions?.length || 0) / trxPager.pageSize);

  const transactionColumns: TableColumn<any>[] = [
      { header: "Invoice No", accessor: "invoiceNo", className: "font-medium pl-6" },
      { header: "Name", accessor: "name" },
      { header: "Amount", accessor: "amount", cell: (val) => `RM ${Number(val).toFixed(2)}` },
      { header: "Type", accessor: "trxType", cell: (val) => <StatusBadge status={val} /> },
      { header: "Created Date", accessor: "createdDate" }
  ];

  const balanceHistoryColumns: TableColumn<BalanceTransaction>[] = [
      { header: "Invoice No", accessor: "invoiceNo", className: "font-medium" },
      { header: "Name", accessor: "name" },
      { header: "Amount", accessor: "amount", cell: (val) => `RM ${Number(val).toFixed(2)}` },
      { header: "Type", accessor: "trxType", cell: (val) => <StatusBadge status={val} className="h-5 text-[10px]" /> },
      { header: "Date", accessor: "createdDate", className: "text-xs text-muted-foreground" }
  ];

  // --- RENDER CONTENT FOR RIGHT PANEL ---
  const renderRightPanelContent = () => {
      // 1. Change Email Form
      if (actionType === "change-email") {
          return (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-6 px-6 pt-6 shrink-0">
                      <Button variant="ghost" size="icon" onClick={handleBackToHistory} className="mr-1">
                          <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Mail className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold">Change Email Address</h3>
                  </div>
                  
                  <div className="px-6 flex-1 max-w-lg">
                    <div className="space-y-4 p-6 border rounded-lg bg-muted/10">
                        <div className="space-y-2">
                            <Label htmlFor="new-email">New Email Address</Label>
                            <Input id="new-email" type="email" placeholder="Enter new email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-11" />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                             <Button variant="outline" onClick={handleBackToHistory}>Cancel</Button>
                             <Button onClick={handleChangeEmail} disabled={isProcessing || !newEmail.trim()}>
                                {isProcessing ? "Saving..." : "Save Change"}
                             </Button>
                        </div>
                    </div>
                  </div>
              </div>
          );
      }

      // 2. Exchange Transaction Form
      if (actionType === "exchange") {
          return (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-6 px-6 pt-6 shrink-0">
                      <Button variant="ghost" size="icon" onClick={handleBackToHistory} className="mr-1">
                          <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold">Exchange Transaction</h3>
                  </div>
                  
                  <div className="px-6 flex-1 max-w-lg">
                    <div className="space-y-4 p-6 border rounded-lg bg-muted/10">
                        <div className="space-y-2">
                            <Label htmlFor="exchange-email">New Email Address</Label>
                            <Input id="exchange-email" type="email" placeholder="Enter new email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="exchange-accid">New Account ID (Optional)</Label>
                            <Input id="exchange-accid" placeholder="Enter account ID" value={newAccId} onChange={(e) => setNewAccId(e.target.value)} className="h-11" />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                             <Button variant="outline" onClick={handleBackToHistory}>Cancel</Button>
                             <Button onClick={handleExchangeTransaction} disabled={isProcessing || !newEmail.trim()}>
                                {isProcessing ? "Exchanging..." : "Confirm Exchange"}
                             </Button>
                        </div>
                    </div>
                  </div>
              </div>
          );
      }

      // 3. Activate Balance Form
      if (actionType === "activate-balance") {
          return (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-4 px-6 pt-6 shrink-0">
                      <Button variant="ghost" size="icon" onClick={handleBackToHistory} className="mr-1">
                          <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Power className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold">Activate Balance</h3>
                  </div>

                  <div className="px-6 flex-1 overflow-y-auto scrollbar-hide pb-6">
                    <div className="space-y-6">
                        {balanceError ? (
                            <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg border border-red-100">
                                <p className="font-semibold mb-1">Unable to load balance.</p>
                                <p className="text-sm">{balanceError}</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <BalanceCard title="Credit Balance" amount={currentBalance} description="Available balance" icon={Wallet} valueColor="text-green-600" />
                                    <BalanceCard title="Expired Balance" amount={expiredBalance} description="Expired credits" icon={Clock} valueColor="text-red-600" />
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Recent Balance History</div>
                                    <div className="border rounded-lg max-h-[300px] overflow-y-auto bg-card">
                                        <DataTable columns={balanceHistoryColumns} data={balanceHistory} keyExtractor={(row, idx) => `${row.invoiceNo}-${idx}`} emptyMessage="No balance history." />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={handleBackToHistory}>Back</Button>
                                    <Button onClick={handleActivateExpiredBalance} disabled={isProcessing || expiredBalance <= 0} className="w-[180px]">
                                        {isProcessing ? "Activating..." : "Activate Expired"}
                                    </Button>
                                </div>
                                {expiredBalance <= 0 && <p className="text-right text-xs text-muted-foreground">Balance must be expired to activate.</p>}
                            </>
                        )}
                    </div>
                  </div>
              </div>
          );
      }

      // 4. DEFAULT: Transaction History Table
      return (
        <>
            <div className="flex items-center gap-2 mb-4 px-6 pt-6 shrink-0">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Transaction History</h3>
            </div>

            <div className="px-6 pb-0 flex-1 overflow-y-auto scrollbar-hide max-h-[70vh] lg:max-h-none">
                <div className="rounded-lg border bg-card">
                    <DataTable 
                        columns={transactionColumns}
                        data={paginatedTransactions}
                        keyExtractor={(row, idx) => `${row.invoiceNo}-${idx}`}
                        emptyIcon={SearchX}
                        emptyTitle="No Transactions"
                        emptyMessage="This account has no transaction history."
                    />
                </div>
            </div>

            <div className="shrink-0 p-4 lg:p-6 bg-background lg:bg-transparent">
                <PaginationControls 
                    currentPage={trxPager.currentPage}
                    totalPages={totalTrxPages}
                    totalRecords={account.transactions?.length || 0}
                    pageSize={trxPager.pageSize}
                    onPageChange={trxPager.setCurrentPage}
                />
            </div>
        </>
      );
  };

  return (
    <div className="flex flex-col h-auto lg:h-[calc(100vh-90px)] w-full max-w-[1600px] mx-auto overflow-visible lg:overflow-hidden bg-background space-y-4 lg:space-y-0 pb-24 lg:pb-0">
      
      {/* 1. HEADER */}
      <div className="shrink-0 flex items-center justify-between border-b px-0 lg:px-4 py-3 bg-background/95 backdrop-blur z-20 lg:mb-4">
          <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/portal">Dashboard</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/portal/themepark-support/account-master">Account Master</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Account Details ({account.accId})</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
      </div>

      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950 mb-4 lg:mb-0">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-600 dark:text-green-400 font-medium">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* 2. MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:min-h-0">
        
        {/* === LEFT PANEL === */}
        <div className="lg:col-span-4 h-full flex flex-col gap-6 lg:min-h-0 lg:overflow-y-auto scrollbar-hide pr-1">
             
             {/* Account Info */}
             <Card>
                <CardHeader className="pb-3 border-b bg-muted/10">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" /> Account Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Account ID</span><span className="font-mono font-medium">{account.accId}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Email</span><span className="font-medium">{account.email}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Name</span><span className="font-medium">{account.firstName}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Mobile</span><span className="font-medium">{account.mobile}</span></div>
                        <div className="flex justify-between items-center pt-1"><span className="text-muted-foreground">Status</span><StatusBadge status={account.accountStatus} /></div>
                    </div>
                </CardContent>
             </Card>

             {/* Actions */}
             <Card className="flex-1">
                <CardHeader className="pb-3 border-b bg-muted/10">
                    <CardTitle className="text-base flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-orange-600" /> Account Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <Button variant="outline" className="h-auto min-h-10 whitespace-normal" onClick={handleActivateAccount} disabled={isProcessing || account.accountStatus === "Active"}>Activate Account</Button>
                        <Button variant="outline" className="h-auto min-h-10 whitespace-normal" onClick={() => handleAction("inactive")} disabled={isProcessing || account.accountStatus === "Inactive"}>Inactive Account</Button>
                        <Button variant="outline" className={`h-auto min-h-10 whitespace-normal ${actionType === 'exchange' ? 'border-indigo-500 bg-indigo-50' : ''}`} onClick={() => handleAction("exchange")} disabled={isProcessing}>Exchange Transaction</Button>
                        <Button variant="outline" className={`h-auto min-h-10 whitespace-normal ${actionType === 'activate-balance' ? 'border-indigo-500 bg-indigo-50' : ''}`} onClick={() => handleAction("activate-balance")} disabled={isProcessing}>Activate Balance</Button>
                        <Button variant="outline" className="h-auto min-h-10 whitespace-normal" onClick={() => handleAction("reset-password")} disabled={isProcessing}>Reset Password</Button>
                        <Button variant="outline" className={`h-auto min-h-10 whitespace-normal ${actionType === 'change-email' ? 'border-indigo-500 bg-indigo-50' : ''}`} onClick={() => handleAction("change-email")} disabled={isProcessing}>Change Email</Button>
                    </div>
                </CardContent>
             </Card>
        </div>

        {/* === RIGHT PANEL === */}
        <div className="lg:col-span-8 h-full flex flex-col min-h-0">
             <Card className="h-full flex flex-col border-0 lg:border transition-all duration-300">
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                    {renderRightPanelContent()}
                </CardContent>
             </Card>
        </div>

      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                  {actionType === "reset-password" ? "Reset Password" 
                  : actionType === "inactive" ? "Inactive Account" 
                  : actionType === "activate" ? "Activate Account" 
                  : "Confirm Action"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                  {actionType === "reset-password" 
                      ? "Are you sure you want to reset this account's password? The default password will be set to 123456."
                  : actionType === "inactive"
                      ? "Are you sure you want to inactive this account? The user will not be able to access their account."
                  : actionType === "activate"
                      ? "Are you sure you want to activate this account? The user will regain access."
                  : "Are you sure you want to proceed?"}
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