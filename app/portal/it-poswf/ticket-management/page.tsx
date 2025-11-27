// app/portal/it-poswf/ticket-management/page.tsx
"use client"

import { useState, useEffect } from "react" // Added useEffect
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Search, Wallet, TrendingUp, CheckCircle2, Calendar, Key, Settings, XCircle, PackageIcon, Pencil } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/it-poswf/data-table"
import { StatusBadge } from "@/components/it-poswf/status-badge"
import { BalanceCard } from "@/components/it-poswf/balance-card"
import { PasswordDisplay } from "@/components/it-poswf/password-display"
import {
  type ManualConsumeData,
  type AvailableTicket,
  type ExtendTicketData,
  type PasswordData,
  type Terminal,
  type VoidTransaction,
  type ManualConsumeSearchPayload,
  type ConsumeExecuteItem,
  type ConsumeExecutePayload,
} from "@/type/it-poswf"
import { type Package } from "@/type/packages"
import {ItPoswfPackage } from "@/type/it-poswf"
import { itPoswfService } from "@/services/it-poswf-services"
import { packageService } from "@/services/package-services"
import { useToast } from "@/hooks/use-toast"


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
  const [isUpdatingTicketNo, setIsUpdatingTicketNo] = useState<string | null>(null);

  // Void Transaction states
  const [voidInvoiceNo, setVoidInvoiceNo] = useState("")
  const [voidSearchResult, setVoidSearchResult] = useState<VoidTransaction[]>([])
  const [isVoidSearching, setIsVoidSearching] = useState(false)
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false)
  const [voidingTransaction, setVoidingTransaction] = useState<VoidTransaction | null>(null)
  const [isVoiding, setIsVoiding] = useState(false)

  // Package Listing states
  const [packageSearchTerm, setPackageSearchTerm] = useState("")
  const [packages, setPackages] = useState<ItPoswfPackage[]>([])
  const [isPackageSearching, setIsPackageSearching] = useState(false)
  const [editingPackage, setEditingPackage] = useState<ItPoswfPackage | null>(null)
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false)
  const [isPackageUpdating, setIsPackageUpdating] = useState(false)
  const [packageRemark, setPackageRemark] = useState("")

  // Update Terminal states
  const [terminalSearchTerm, setTerminalSearchTerm] = useState("")
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [allTerminals, setAllTerminals] = useState<Terminal[]>([]);
  const [isTerminalSearching, setIsTerminalSearching] = useState(false)
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)


  // NEW useEffect: Fetch all terminals on mount for the Manual Consume dropdown
  useEffect(() => {
    const fetchTerminalsList = async () => {
        try {
            const response = await itPoswfService.fetchAllTerminals();
            if (response.success && response.data) {
                setAllTerminals(response.data);
            } else {
                console.error("Failed to fetch terminal list:", response.error);
                toast({ title: "Error", description: "Failed to load terminal dropdown list.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Network error fetching terminals:", error);
        }
    };
    fetchTerminalsList();
  }, []); 

  const formatDateTime = (dateString: string | undefined): string => {
    // Return N/A for null, undefined, or the sentinel "0001-01-01..." date
    if (!dateString || dateString === '0001-01-01T00:00:00') return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date

    // Format to a user-friendly display including date and time
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(',', ''); // Remove comma for cleaner display (e.g., 24 Nov 2025 3:45 PM)
  };

  // Update QR Password handlers
  const handleQrSearch = async () => {
    if (!qrInvoiceNo) return
   setIsQrSearching(true)
    setResetSuccess(false)
    setQrSearchResult(null); // Clear previous result
    
    try {
        const response = await itPoswfService.searchQrPassword(qrInvoiceNo.trim());
        
        if (response.success && response.data) {
            setQrSearchResult(response.data);
            toast({ title: "Success", description: "QR Password retrieved." });
        } else {
            setQrSearchResult(null);
            toast({
                title: "Search Failed",
                description: response.error || "No password found for this invoice.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("QR Search Error:", error);
        toast({
            title: "Network Error",
            description: "Failed to connect to the search service.",
            variant: "destructive"
        });
    } finally {
      setIsQrSearching(false);
    }
  }

  const handleResetPassword = async () => {
    if (!qrInvoiceNo) return
    setIsResetting(true)
    setResetSuccess(false)
    
    try {
        // We use the same search field value (qrInvoiceNo) as the identifier for reset
        const response = await itPoswfService.resetQrPassword(qrInvoiceNo.trim());
        
        if (response.success && response.data) {
            // Update the UI with the new password returned from the API
            setQrSearchResult(response.data);
            setResetSuccess(true);
            toast({ title: "Success", description: "QR Password has been reset." });
        } else {
            setResetSuccess(false);
            toast({
                title: "Reset Failed",
                description: response.error || "Could not reset password.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("QR Reset Error:", error);
        toast({
            title: "Network Error",
            description: "Failed to connect to the reset service.",
            variant: "destructive"
        });
    } finally {
      setIsResetting(false);
      // Success message will be shown via the `resetSuccess` state in PasswordDisplay component
    }
  }

  // Manual Consume handlers
  const handleConsumeSearch = async () => {
    // All fields are currently required to start the search
    //const allFields = consumeType && email && invoiceNo && terminalId && ticketType && ticketStatus;
    //if (!allFields) {
        //toast({
            //title: "Input Required",
            //description: "Please fill in all required search criteria.",
            //variant: "default",
        //});
        //return;
    //}
    
    setIsConsumeSearching(true);
    setConsumeSearchResult(null);

    const searchPayload: ManualConsumeSearchPayload = {
        searchType: consumeType.toUpperCase(),
        email: email.trim(),
        mobile: mobileNo.trim() || "", // Send empty string if optional field is empty
        invoiceNo: invoiceNo.trim() || "",
        terminalID: terminalId,
        ticketType: ticketType.toUpperCase(),
        ticketStatus: ticketStatus.toUpperCase(),
    };

    try {
        const response = await itPoswfService.searchManualConsume(searchPayload);

        if (response.success && response.data) {
            setConsumeSearchResult(response.data);
            toast({ title: "Search Complete", description: "Manual consume details retrieved." });
        } else {
            setConsumeSearchResult(null);
            toast({
                title: "Search Failed",
                description: response.error || "No data found matching the search criteria.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("Manual Consume Search Error:", error);
        toast({
            title: "Network Error",
            description: "Failed to connect to the search service.",
            variant: "destructive"
        });
    } finally {
        setIsConsumeSearching(false);
    }
  }

    const handleConsumeExecute = async () => {
        if (!consumeSearchResult || consumeSearchResult.tickets.length === 0) {
            toast({ title: "Action Blocked", description: "No available tickets to consume.", variant: "default" });
            return;
        }
        
        // 1. Map all available tickets/credits into the required complex execution payload format
        const itemsToConsume = consumeSearchResult.tickets;
        
        // NOTE: Assuming 1 unit of each item is consumed for this process flow
        const mappedItems: ConsumeExecuteItem[] = itemsToConsume.map(item => {
            // FIX: Use ItemPoint and TicketItemID from the new PascalCase structure
            const unitPrice = item.ItemPoint; 
            return {
                itemID: item.TicketItemID || 1, 
                quantity: 1, 
                unitPrice: unitPrice, 
                amtBeforeTax: unitPrice,
                amount: unitPrice,
            };
        });

        //  Derive main payload fields
        // NOTE: accID, rrQRID, totalAmount, creditBalance must come from search/context
        const MOCK_ACC_ID = 1; 
        const MOCK_RRQRID = "1825076"; 
        // FIX: The terminal ID is a string (e.g., "terminal-001"), so we convert it to a number or fall back.
        const numericTerminalId = Number(terminalId.split('-').pop() || terminalId) || 474; 
        const totalAmount = mappedItems.reduce((sum, item) => sum + item.amount, 0);

        setIsExecuting(true);
        
        const executePayload: ConsumeExecutePayload = {
            consumeBySuperApp: consumeType === "superapp",
            accID: MOCK_ACC_ID,
            rrQRID: MOCK_RRQRID,
            terminalID: numericTerminalId, 
            totalAmount: totalAmount,
            items: mappedItems,
            custEmail: email.trim(),
            txtMobileNo: mobileNo.trim() || "+60103921432",
            creditBalance: consumeSearchResult.creditBalance,
            // FIX: Use ItemName for correct PascalCase field access
            itemNamesForEmail: itemsToConsume.map(i => i.ItemName).join(', '), 
        };
        
        try {
            const response = await itPoswfService.executeManualConsume(executePayload);
            
            if (response.success) {
                setConsumeSearchResult(null);
                setEmail("");
                setInvoiceNo("");
                toast({ 
                    title: "Consumption Success", 
                    description: `Consumption executed successfully. New Invoice: ${response.data?.invoiceNo || 'N/A'}`,
                    variant: "default"
                });
            } else {
                throw new Error(response.error || "Consumption failed.");
            }
        } catch (error) {
            console.error("Consume Execute Error:", error);
            toast({
                title: "Consumption Failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred during execution.",
                variant: "destructive"
            });
        } finally {
            setIsExecuting(false);
        }
    }

  const ticketColumns: TableColumn<AvailableTicket>[] = [
    { header: "Package Name", accessor: "PackageName", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Item Name", accessor: "ItemName" },
    { header: "Consume Terminal", accessor: "ConsumeTerminal" },
    { header: "Item Type", accessor: "TicketType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Item Points", accessor: "ItemPoint", cell: (value) => value.toLocaleString() },
    { header: "Package Status", accessor: "PackageStatus", cell: (value) => <StatusBadge status={value} /> },
  ]

  // Resync Transaction handlers
  const handleExecute = async () => {
    if (!transactionId.trim()) return
    setIsExecuting(true)
    setShowResyncSuccess(false)
    // MOCK: This endpoint is not yet hooked up to a real service.
    setTimeout(() => { 
      setIsExecuting(false)
      setShowResyncSuccess(true)
      toast({ title: "Success", description: `Transaction Resync (MOCK) executed for ID: ${transactionId}` });
      setTimeout(() => setShowResyncSuccess(false), 5000)
    }, 1000)
  }

  // Extend Expiry handlers (Fully Integrated - No changes needed)
  const handleExtendSearch = async () => {
    if (!extendSearchQuery) return
    setIsExtendSearching(true)
    setExtendSearchResult([]) 
    setEditedDates({}) 

    try {
      const response = await itPoswfService.findExtendableTickets(extendSearchQuery.trim());

      if (response.success && response.data) {
        const liveTickets = response.data;
        setExtendSearchResult(liveTickets); 
        
        const initialDates: Record<string, string> = {}
        liveTickets.forEach((ticket) => {
          initialDates[ticket.ticketNo] = ticket.expiryDate.slice(0, 16) 
        })
        setEditedDates(initialDates)
        
        if (liveTickets.length === 0) {
             toast({
                title: "Search Complete",
                description: "No extendable tickets found for this invoice/transaction.",
            });
        }
      } else {
        setExtendSearchResult([])
        toast({
          title: "Search Failed",
          description: response.error || "Could not retrieve ticket list.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Extend Expiry Search Error:", error);
      setExtendSearchResult([]);
      toast({
        title: "Network Error",
        description: "Failed to connect to the search service.",
        variant: "destructive"
      });
    } finally {
      setIsExtendSearching(false)
    }
  }
  
  const handleDateChange = (ticketNo: string, newDate: string) => {
    setEditedDates((prev) => ({
      ...prev,
      [ticketNo]: newDate,
    }))
  }

  const handleUpdate = async (ticketNo: string) => {
    const originalTicket = extendSearchResult.find(t => t.ticketNo === ticketNo);
    const newExpiryDate = editedDates[ticketNo];

    if (!originalTicket || !newExpiryDate) {
        toast({ title: "Error", description: "Missing ticket data or new expiry date.", variant: "destructive" });
        return;
    }
    
    setIsUpdatingTicketNo(ticketNo);

    try {
        const payload = {
            TrxNo: extendSearchQuery.trim(), 
            ticketsToUpdate: [{
                ticketNo: originalTicket.ticketNo,
                ticketName: originalTicket.ticketName,
                effectiveDate: originalTicket.effectiveDate, 
                expiryDate: newExpiryDate + ":00", 
                lastValidDate: originalTicket.lastValidDate, 
            }],
        };

        const response = await itPoswfService.updateTicketExpiry(payload);

        if (response.success && response.data) {
            setExtendSearchResult(prev => prev.map(t => 
                t.ticketNo === ticketNo ? { ...t, expiryDate: newExpiryDate + ":00" } : t
            ));
            
            toast({
                title: "Success",
                description: `Expiry date updated for ticket ${ticketNo}.`,
            });
        } else {
            throw new Error(response.error || "Update failed.");
        }
    } catch (error) {
        console.error("Update Error:", error);
        toast({
            title: "Update Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred during update.",
            variant: "destructive"
        });
    } finally {
        setIsUpdatingTicketNo(null);
    }
  }

  // Void Transaction handlers (Fully Integrated - No changes needed)
  const handleVoidSearch = async () => {
    if (!voidInvoiceNo) return
   setIsVoidSearching(true)
    setVoidSearchResult([])

    try {
      const response = await itPoswfService.searchVoidTransactions(voidInvoiceNo.trim());

      if (response.success && response.data) {
        setVoidSearchResult(response.data);
        if (response.data.length === 0) {
          toast({
            title: "Search Complete",
            description: "No voidable transactions found for this invoice.",
          });
        }
      } else {
        setVoidSearchResult([]);
        toast({
          title: "Search Failed",
          description: response.error || "Could not retrieve transactions.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Void Search Error:", error);
      setVoidSearchResult([]);
      toast({
        title: "Network Error",
        description: "Failed to connect to the transaction search service.",
        variant: "destructive"
      });
    } finally {
      setIsVoidSearching(false)
    }
  }

  const handleVoidClick = (transaction: VoidTransaction) => {
    setVoidingTransaction(transaction)
    setIsVoidConfirmOpen(true)
  }

  const handleVoidConfirm = async () => {
    if (!voidingTransaction) return

    setIsVoiding(true)
    
    try {
      const payload = {
        TrxID: Number(voidingTransaction.trxID), 
        InvoiceNo: voidingTransaction.invoiceNo,
        BalanceQty: -1, 
        trxType: voidingTransaction.transactionType,
        itemType: voidingTransaction.itemType,
        Action: "Void" as const,
      };

      const response = await itPoswfService.executeVoidTransaction(payload);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to communicate with API.");
      }
      
      setVoidSearchResult((prev) => 
        prev.map((t) => (t.id === voidingTransaction.id ? { ...t, status: "Voided" } : t))
      )
      
      const responseMessage = response.data?.messaged || "Void request processed successfully.";

      toast({
        title: "Success",
        description: `Transaction ${voidingTransaction.trxID} has been voided successfully. Message: ${responseMessage}`,
      })

    } catch (error) {
      console.error("Void Error:", error);
      toast({
        title: "Void Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsVoidConfirmOpen(false)
      setVoidingTransaction(null)
      setIsVoiding(false)
    }
  }

  // Package Listing handlers
  const handlePackageSearch = async () => {
    if (!packageSearchTerm.trim() && packages.length > 0) {
            return; 
        }

        setIsPackageSearching(true)
        setPackages([]) // Clear previous results
        
        try {
            // CRITICAL FIX: Use the new, dedicated service function
            const { packages: livePackages } = await packageService.getItPoswfPackages(
                packageSearchTerm.trim()
            );
            
            setPackages(livePackages);
            
            if (livePackages.length > 0) {
                toast({ title: "Search Complete", description: `Found ${livePackages.length} packages.` });
            } else {
                toast({ title: "Search Complete", description: "No packages found matching the criteria." });
            }

        } catch (error) {
            console.error("Package Search Error:", error);
            toast({
                title: "Package Search Failed",
                description: "Failed to fetch package data.",
                variant: "destructive"
            });
        } finally {
            setIsPackageSearching(false)
        }
    }

  const handlePackageEdit = (pkg: ItPoswfPackage) => {
    setEditingPackage({ ...pkg })
    setPackageRemark("")
    setIsPackageDialogOpen(true)
  }

  const handlePackageUpdate = async () => {
    if (!editingPackage) return

    setIsPackageUpdating(true)
    
    try {
        // 1. Call the new live service function
        await packageService.updateItPoswfPackage(
            editingPackage.packageId,
            editingPackage.lastValidDate,
            packageRemark
        );

        // 2. Update the local UI state on success
        const updatedPackages = packages.map((p) =>
            p.id === editingPackage.id
                ? {
                    ...editingPackage,
                    lastModifiedBy: "current.user@themepark.com", // Static user for now
                    modifiedDate: new Date().toISOString().slice(0, 19).replace("T", " "),
                  }
                : p,
        );
        
        setPackages(updatedPackages);
        setIsPackageDialogOpen(false);
        setEditingPackage(null);
        setPackageRemark("");
        
        toast({
            title: "Success",
            description: "Package updated successfully.",
        });

    } catch (error) {
        console.error("Package Update Error:", error);
        toast({
            title: "Update Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
            variant: "destructive",
        });
    } finally {
        setIsPackageUpdating(false);
    }
  }

  // Terminal Update handlers
  const handleTerminalSearch = async () => {
    setIsTerminalSearching(true)
    setTerminals([]) 

    try {
        // FIX: Use the live service instead of setTimeout/mock data
        const response = await itPoswfService.searchTerminals(terminalSearchTerm.trim());

        if (response.success && response.data) {
            setTerminals(response.data);
            if (response.data.length === 0) {
                toast({ title: "Search Complete", description: "No terminals found." });
            }
        } else {
            setTerminals([]);
            toast({
                title: "Search Failed",
                description: response.error || "Could not retrieve terminals.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("Terminal Search Error:", error);
        toast({ title: "Network Error", description: "Failed to connect to search service.", variant: "destructive" });
    } finally {
        setIsTerminalSearching(false)
    }
  }

  const handleEdit = (terminal: Terminal) => {
    setEditingTerminal({ ...terminal })
    setIsDialogOpen(true)
  }

  const handleTerminalUpdate = async () => {
    if (!editingTerminal || !editingTerminal.uuid.trim()) {
        toast({ title: "Validation Error", description: "UUID cannot be empty.", variant: "destructive" });
        return;
    }

    setIsUpdating(true);
    
    try {
        const terminalID = editingTerminal.id; 
        const newUUID = editingTerminal.uuid;

        // 1. Call the new API service to update the UUID
        const response = await itPoswfService.updateTerminalUUID(terminalID, newUUID);

        if (response.success) {
            // 2. Update the local UI state on success
            const updatedTerminals = terminals.map((t) =>
                t.id === terminalID
                    ? { 
                        ...t, 
                        uuid: newUUID, 
                        modifiedDate: new Date().toISOString().slice(0, 19).replace("T", " ") // Use current time
                    }
                    : t,
            );
            
            setTerminals(updatedTerminals);
            setIsDialogOpen(false);
            setEditingTerminal(null);

            toast({
                title: "Success",
                description: response.data?.message || "Terminal UUID updated successfully",
            });
        } else {
            throw new Error(response.error || "API returned an error during update.");
        }
    } catch (error) {
        console.error("Terminal Update Error:", error);
        toast({
            title: "Update Failed",
            description: error instanceof Error ? error.message : "An unexpected network error occurred.",
            variant: "destructive",
        });
    } finally {
        setIsUpdating(false);
    }
  }

  const voidTransactionColumns: TableColumn<VoidTransaction>[] = [
    {
      header: "Transaction ID",
      accessor: "trxID",
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    { header: "Invoice No", accessor: "invoiceNo" },
    { header: "Transaction Type", accessor: "transactionType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Item Type", accessor: "itemType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Balance Quantity", accessor: "balanceQuantity" },
    { header: "Amount", accessor: "amount", cell: (value) => `RM ${(value ?? 0).toFixed(2)}`},
    { header: "Terminal", accessor: "terminal" },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    { header: "Created Date", accessor: "createdDate" },
    {
      header: "Action",
      accessor: "id",
      cell: (_, row) => (
        <Button variant="destructive" size="sm" onClick={() => handleVoidClick(row)} disabled={row.status === "Voided"}>
          <XCircle className="h-4 w-4 mr-2" />
          Void
        </Button>
      ),
    },
  ]

  const packageColumns: TableColumn<ItPoswfPackage>[] = [
    { header: "Package ID", accessor: "packageId", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Package Name", accessor: "packageName" },
    { header: "Package Type", accessor: "packageType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Price", accessor: "price", cell: (value) => `RM ${(value ?? 0).toFixed(2)}` },
    { header: "Last Valid Date", accessor: "lastValidDate" },
    {
      header: "Description",
      accessor: "description",
      cell: (value) => <div className="max-w-xs truncate">{value}</div>,
    },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    {
      header: "Action",
      accessor: "id",
      cell: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => handlePackageEdit(row)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      ),
    },
  ]
  
  // calculate displayTotalamout ipoint
  const displayTotalAmount = consumeSearchResult?.tickets.reduce(
      (sum, item) => sum + (item.ItemPoint ?? 0), 0
  ) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Management"
        description="Unified ticket operations - manage QR passwords, consume tickets, resync transactions, extend expiry, and update terminals"
      />

      <Tabs defaultValue="void-transaction" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full md:w-auto min-w-full md:min-w-0 justify-start rounded-none">
            <TabsTrigger
              value="void-transaction"
              className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative data-[state=active]:z-10"
            >
              <XCircle className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Void Transaction</span>
              <span className="sm:hidden">Void</span>
            </TabsTrigger>
            <TabsTrigger
              value="extend-expiry"
              className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
            >
              <Calendar className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Extend Expiry</span>
              <span className="sm:hidden">Extend</span>
            </TabsTrigger>
            <TabsTrigger
              value="update-terminal"
              className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
            >
              <Settings className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Update Terminal</span>
              <span className="sm:hidden">Terminal</span>
            </TabsTrigger>
            <TabsTrigger
              value="resync"
              className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
            >
              <CheckCircle2 className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Resync Transaction</span>
              <span className="sm:hidden">Resync</span>
            </TabsTrigger>
            <TabsTrigger
              value="qr-password"
              className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
            >
              <Key className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Update QR Password</span>
              <span className="sm:hidden">QR Password</span>
            </TabsTrigger>
            <TabsTrigger
              value="manual-consume"
              className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
            >
              <Wallet className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Manual Consume</span>
              <span className="sm:hidden">Consume</span>
            </TabsTrigger>
            <TabsTrigger
              value="package-listing"
              className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
            >
              <PackageIcon className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Package Listing</span>
              <span className="sm:hidden">Packages</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Void Transaction Tab */}
        <TabsContent value="void-transaction" className="mt-0 space-y-6">
          <Card>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="void-invoice" className="text-sm font-medium">
                  Invoice Number
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="void-invoice"
                    placeholder="Enter invoice number"
                    value={voidInvoiceNo}
                    onChange={(e) => setVoidInvoiceNo(e.target.value)}
                    className="h-11"
                  />
                  <Button onClick={handleVoidSearch} disabled={isVoidSearching} className="h-11 px-8">
                    <Search className="mr-2 h-4 w-4" />
                    {isVoidSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {voidSearchResult.length > 0 && (
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <XCircle className="h-4 w-4" />
                  Transaction Details
                </div>
                <DataTable
                  columns={voidTransactionColumns}
                  data={voidSearchResult}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No transactions found"
                />
              </CardContent>
            </Card>
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
                      {extendSearchResult.map((ticket) => {
                        const isTicketUpdating = isUpdatingTicketNo === ticket.ticketNo;
                        return (
                        <TableRow key={ticket.ticketNo}>
                            <TableCell className="font-medium">{ticket.ticketNo}</TableCell>
                            <TableCell>{ticket.ticketName}</TableCell>
                            <TableCell>{ticket.effectiveDate}</TableCell>
                            <TableCell>
                              <Input
                                type="datetime-local"
                                // Ensure the value is correctly formatted for the input type
                                value={editedDates[ticket.ticketNo] || ticket.expiryDate.slice(0, 16)} 
                                onChange={(e) => handleDateChange(ticket.ticketNo, e.target.value)}
                                className="h-9 w-full min-w-[200px]"
                                disabled={isTicketUpdating}
                              />
                            </TableCell>
                            <TableCell>{ticket.lastValidDate}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdate(ticket.ticketNo)}
                                // Disable if already updating OR if the date hasn't been changed yet
                                disabled={isTicketUpdating || !editedDates[ticket.ticketNo]}
                              >
                                {isTicketUpdating ? "Updating..." : "Update"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Update Terminal Tab */}
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
                      {allTerminals.map((terminal) => (
                        <SelectItem key={terminal.id} value={terminal.id}>
                          {`${terminal.terminalName} (${terminal.id})`}
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
                      <SelectItem value="expired">Expired</SelectItem>
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
                    data={consumeSearchResult.tickets}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No available tickets found"
                  />

                  {/* FIX 2: Removed erroneous declaration block inside JSX */}
                  
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Consumable iPoints</span>
                      </div>
                      <span className="text-lg font-semibold">
                        {/* FIX 3: Use the local variable directly */}
                        {displayTotalAmount.toLocaleString()} iPoints
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
                    <Button onClick={handleConsumeExecute} disabled={isExecuting} className="w-full">
                      {isExecuting ? "Executing..." : "Execute Consumption"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Package Listing Tab */}
        <TabsContent value="package-listing" className="mt-0 space-y-6">
          <Card>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="package-search" className="text-sm font-medium">
                  Package Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="package-search"
                    placeholder="Enter package name"
                    value={packageSearchTerm}
                    onChange={(e) => setPackageSearchTerm(e.target.value)}
                    className="h-11"
                  />
                  <Button onClick={handlePackageSearch} disabled={isPackageSearching} className="h-11 px-8">
                    <Search className="mr-2 h-4 w-4" />
                    {isPackageSearching ? "Searching..." : "Search"}
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
                      <TableHead>Package ID</TableHead>
                      <TableHead>Package Name</TableHead>
                      <TableHead>Package Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Last Valid Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {packages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No packages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.packageId}</TableCell>
                          <TableCell>{pkg.packageName}</TableCell>
                          <TableCell>
                            <StatusBadge status={pkg.packageType ?? "N/A"} />
                          </TableCell>
                          <TableCell>RM {(pkg.price ?? 0).toFixed(2)}</TableCell>
                          <TableCell>{pkg.lastValidDate}</TableCell>
                          <TableCell className="max-w-xs truncate">{pkg.description}</TableCell>
                          <TableCell>
                            <StatusBadge status={pkg.status?? "Unknown"} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handlePackageEdit(pkg)}>
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
                  //onChange={(e) => setEditingTerminal({ ...editingTerminal, terminalName: e.target.value })}
                  className="h-11"
                  disabled
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
                  //onValueChange={(value: any) => setEditingTerminal({ ...editingTerminal, terminalType: value })}
                  disabled
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
                  //onValueChange={(value: any) => setEditingTerminal({ ...editingTerminal, status: value })}
                  disabled
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

      <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>Update the package information and add remarks for the changes.</DialogDescription>
          </DialogHeader>
          {editingPackage && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-last-valid-date" className="text-sm font-medium">
                  Last Valid Date
                </Label>
                <Input
                  id="edit-last-valid-date"
                  type="date"
                  value={editingPackage.lastValidDate}
                  onChange={(e) => setEditingPackage({ ...editingPackage, lastValidDate: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-remark" className="text-sm font-medium">
                  Remark
                </Label>
                <Textarea
                  id="edit-remark"
                  placeholder="Enter remarks for this update"
                  value={packageRemark}
                  onChange={(e) => setPackageRemark(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              {/* Display Created User Email and Date */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created By (Email):</span>
                  <span className="font-medium">{ editingPackage.createdBy || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created Date:</span>
                  <span className="font-medium">{formatDateTime(editingPackage.createdDate)}</span>
                </div>

                {/* Display Last Modified User Email and Date */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Modified By (Email):</span>
                  <span className="font-medium">{ editingPackage.lastModifiedBy || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Modified Date:</span>
                  <span className="font-medium">{formatDateTime(editingPackage.modifiedDate)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)} disabled={isPackageUpdating}>
              Cancel
            </Button>
            <Button onClick={handlePackageUpdate} disabled={isPackageUpdating}>
              {isPackageUpdating ? "Updating..." : "Update Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isVoidConfirmOpen} onOpenChange={setIsVoidConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void transaction {voidingTransaction?.trxID}? This action cannot be
              undone and will mark the transaction as voided.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoiding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidConfirm}
              disabled={isVoiding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isVoiding ? "Voiding..." : "Void Transaction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}