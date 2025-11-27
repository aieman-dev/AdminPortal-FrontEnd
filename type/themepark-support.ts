// type/it-poswf.ts

export interface Transaction {
  invoiceNo: string
  name: string
  amount: number
  trxType: "Credit" | "Debit"
  createdDate: string
}

export interface BalanceData {
  email: string
  creditBalance: number
  expiredBalance: number
  transactions: Transaction[]
}

export interface PasswordData {
  invoiceNo: string
  currentPassword: string
}

export interface BalanceTransaction {
  invoiceNo: string
  name: string
  amount: number
  trxType: string 
  createdDate: string
}

export interface BalanceDetail {
  accountId: number
  email: string
  currentBalance: number
  expiredBalance: number
  history: BalanceTransaction[]
}

export interface TransactionHistory {
  trxID: number 
  transactionId: string
  invoiceNo: string
  email: string
  mobile: string
  // FIX: Match live API field
  attractionName: string 
  amount: string
  // FIX: Match live API field
  trxType: "Purchase" | "Refund" | "Consume"
  createdDate: string
}

export interface TicketHistory {
  id?: string | number
  transactionId: string
  packageName: string
  // FIX: Match live API field
  packageID: string 
  qty: number
  startDate: string
  expiryDate: string
  lastValidDate: string
  // FIX: Accommodate API string type
  validDays: string | number
  status: "Active" | "Expired" | "Used" | "Cancelled"
  ticketNo: string
  createdDate: string
}

export interface ShopifyOrder {
  trxId: number;
  amount: number;
  email: string;
  invoiceNo: string;
  purchasedDate: string;
  financialStatus : string;
}

//result searching of manual consume ticket
export interface AvailableTicket {
  id: string
  PackageName: string 
  ItemName: string 
  ConsumeTerminal: number 
  TicketType: "Entry" | string 
  ItemPoint: number 
  PackageStatus: "Expired" | "Active" | "Inactive" | "Expired" 
  BalanceQty: number
  PackageID: number
  PackageItemID: number
  TrxItemID: number
  SourceType: string
  TicketItemID: number
}

export interface ManualConsumeData {
  creditBalance: number
  tickets: AvailableTicket[]
  totalAmount: number
  totalRewardCredit: number
}

export interface ManualConsumeSearchPayload {
    searchType: string;
    email: string;
    mobile: string;
    invoiceNo: string;
    terminalID: string;
    ticketType: string;
    ticketStatus: string;
}

export interface ConsumeExecuteItem {
    itemID: number; 
    quantity: number;
    unitPrice: number;
    amtBeforeTax: number; 
    amount: number;
}

export interface ConsumeExecutePayload {
    consumeBySuperApp: boolean;
    accID: number; 
    rrQRID: string; 
    terminalID: number;
    totalAmount: number;
    items: ConsumeExecuteItem[];
    custEmail: string;
    txtMobileNo: string;
    creditBalance: number;
    itemNamesForEmail: string;
}

export interface ExtendTicketData {
  ticketNo: string
  ticketName: string
  effectiveDate: string
  expiryDate: string
  lastValidDate: string
}

export interface Terminal {
  id: string
  terminalName: string
  uuid: string
  terminalType: "POS" | "Kiosk" | "Mobile" | "Web"
  status: "Active" | "Inactive" | "Maintenance"
  modifiedDate: string
}

export interface TerminalSearchPayload {
    SearchQuery: string | null;
}

export interface VoidTransaction {
  id: string
  trxID: string
  invoiceNo: string
  transactionType: "Purchase" | "Refund" | "Exchange"
  itemType: "Ticket" | "Credit" | "Reward"
  balanceQuantity: number
  amount: number
  terminal: string
  status: "Active" | "Voided" | "Pending"
  createdDate: string
}

export interface Package {
  id: string
  packageId: string
  packageName: string
  packageType: "Annual" | "Monthly" | "Daily" | "VIP" | "Family"
  price: number
  lastValidDate: string
  description: string
  status: "Active" | "Inactive" | "Pending"
  createdBy: string
  lastModifiedBy: string
  modifiedDate: string
}

export interface Account {
  id: string
  accId: string
  email: string
  firstName: string
  mobile: string
  createdDate: string
  accountStatus: "Active" | "Inactive" | "Suspended"
  transactions: Transaction[]
}

export interface ItPoswfPackage {
  id: string | number; 
  packageId: string | number;
  packageName: string;
  packageType: string;
  price: number;
  lastValidDate: string;
  description: string;
  status: string; // Mapped from recordStatus
  createdBy?: string;
  lastModifiedBy?: string;
  createdDate?: string;
  modifiedDate?: string;
}