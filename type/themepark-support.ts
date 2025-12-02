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

export interface RetailItem {
  id: string // Mapped from itemID
  itemID: number 
  tGroupID: number
  barcode: string
  itemName: string 
  unitPrice: number
  categoryCode: string
  departmentCode: string
  subcategoryCode: string
}

export interface RetailManualConsumeData {
  creditBalance: number
  items: RetailItem[] // Changed type
  totalAmount: number
  totalRewardCredit: number
  accID?: number; 
  rQRID?: string; 
}

export interface RetailManualConsumeSearchPayload {
    searchType: string;
    email: string;
    mobile: string;
    invoiceNo: string;
    terminalID: string;
    tGroupID: number;
    itemName: string; 
}

export interface ConsumeTicketItem {
    PackageName: string;
    ItemName: string;
    TicketType: string;
    PackageID: number;
    PackageItemID: number;
    TicketItemID: number;
    ConsumeQty: number;
}

export interface TicketConsumeExecutePayload {
    terminalID: number;
    myQrData: string | null; // Use myQr data from search result
    custEmail: string;
    mobileNo: string;
    invoiceNo: string;
    creditBalance: number;
    totalAmount: number;
    itemNamesForEmail: string;
    consumeList: ConsumeTicketItem[];
}

export interface ManualConsumeData {
  creditBalance: number
  tickets: AvailableTicket[]
  totalAmount: number
  totalRewardCredit: number
  accID?: number; 
  rQRID?: string;
  myQr?: string;
}

export interface ManualConsumeSearchPayload {
    searchType: string;
    email: string;
    mobile: string;
    invoiceNo: string;
    terminalID: string;
    ticketType: string;
    ticketStatus: string;
    SourceType: string;
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
    rQRID: string; 
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

// ADDED FOR DEACTIVATE TICKET TAB
export interface DeactivatableTicket {
  id: string; // Unique ID for key/local use (Mapped from ticketID)
  ticketID: number; // Backend's primary ID
  ticketNo: string;
  ticketName: string;
  quantity: number; // Mapped from ticketQty
  purchaseDate: string; 
  status: "Active" | "Deactivated" | "Expired" | string; // Mapped from recordStatus
  invoiceNo: string;
}

export interface ConsumptionHistory {
  id: string; // Unique ID for key/local use (Mapped from ticketConsumptionNo)
  consumptionNo: string; // Mapped from ticketConsumptionNo
  trxNo: string; // Mapped from trxNo (original invoice/trx)
  ticketNo: string;
  ticketItemNo: string; 
  ticketName: string;
  terminalID: number; 
  ticketQty: number; 
  consumeQty: number;
  modifiedDate: string; // Mapped from consumptionModifiedDate
  status: "Active" | "Deactivated" | string; // Mapped from consumptionRecordStatus
}

export interface TicketDeactivatePayload {
    ticketId: number | string;
}

export interface ConsumptionDeactivatePayload {
    consumptionNo: string;
}

//Terminal History Interfaces
export interface TerminalPurchaseHistory {
  id: string; // Unique ID
  terminalID: string;
  invoiceNo: string;
  amount: number;
  customerEmail: string;
  packageName: string;
  purchaseDate: string;
  paymentStatus: "Paid" | "Pending" | "Refund";
}

export interface TerminalConsumeHistory {
  id: string; // Unique ID
  terminalID: string;
  consumptionNo: string;
  itemConsumed: string;
  quantity: number;
  consumeDate: string;
  status: "Consumed" | "Deactivated";
}

export interface TerminalHistoryData {
    purchaseHistory: TerminalPurchaseHistory[];
    consumeHistory: TerminalConsumeHistory[];
}

export interface UnsyncedPackageDTO {
    packageID: number;
    packageName: string;
    packageType: "Entry" | "Point" | "Reward" | string;
    packageItemID: number;
    itemName: string;
    primaryTerminalID: number;
    secondaryTerminalID: number;
    status: string;
}

// NEW: Front-end model used in BCompareTab (Selectable list)
export interface SelectableItPoswfPackage {
    id: string; 
    packageId: string | number;
    packageName: string;
    packageType: string;
    price: number;
    status: string;
    lastValidDate: string;
    syncStatus: "Pending" | "Synced" | "Error";
}