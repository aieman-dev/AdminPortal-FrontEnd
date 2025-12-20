// type/themepark-support.ts

// --- FRONTEND INTERFACES (Used by Components) ---

export interface Transaction {
  invoiceNo: string
  name: string
  amount: number
  trxType: "Credit" | "Debit"
  createdDate: string
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
  attractionName: string 
  amount: number
  trxType: "Purchase" | "Refund" | "Consume"
  createdDate: string
}

export interface TicketHistory {
  id?: string | number
  transactionId: string
  packageName: string
  packageID: string 
  qty: number
  startDate: string
  expiryDate: string
  lastValidDate: string
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

export interface AvailableTicket {
  id: string
  packageName: string 
  itemName: string 
  consumeTerminal: number 
  ticketType: "Entry" | string 
  itemPoint: number 
  packageStatus: "Expired" | "Active" | "Inactive" 
  balanceQty: number
  packageID: number
  packageItemID: number
  trxItemID: number
  sourceType: string
  ticketItemID: number
}

export interface RetailItem {
  id: string 
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
  items: RetailItem[] 
  totalAmount: number
  totalRewardCredit: number
  accID?: number; 
  rQrId?: string; 
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
    packageName: string;
    itemName: string;
    ticketType: string;
    packageID: number;
    packageItemID: number;
    ticketItemID: number;
    consumeQty: number;
}

export interface TicketConsumeExecutePayload {
    terminalID: number;
    myQrData: string | null; 
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
    accID: number | null;
    rQrId: string | null;
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
  id?: string;
  terminalID: string
  trxID: string
  invoiceNo: string
  trxType: "Purchase" | "Refund" | "Exchange" | string
  itemType: "Ticket" | "Credit" | "Reward" | string
  balanceQty: number
  amount: number
  terminal: string
  recordStatus: "Active" | "Voided" | "Pending" | string
  createdDate: string
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
  status: string; 
  createdBy?: string;
  lastModifiedBy?: string;
  createdDate?: string;
  modifiedDate?: string;
}

export interface DeactivatableTicket {
  id: string; 
  ticketID: number; 
  ticketNo: string;
  ticketName: string;
  quantity: number; 
  purchaseDate: string; 
  status: "Active" | "Deactivated" | "Expired" | string; 
  invoiceNo: string;
}

export interface ConsumptionHistory {
  id: string; 
  consumptionNo: string; 
  trxNo: string; 
  ticketNo: string;
  ticketItemNo: string; 
  ticketName: string;
  terminalID: number; 
  ticketQty: number; 
  consumeQty: number;
  modifiedDate: string; 
  status: "Active" | "Deactivated" | string; 
}

export interface TicketDeactivatePayload {
    ticketId: number | string;
}

export interface ConsumptionDeactivatePayload {
    consumptionNo: string;
}

export interface TerminalTransaction {
  id: string; 
  trxID: number;
  invoiceNo: string;
  trxType: "Purchase" | "Consume" | string;
  amount: number;
  createdDate: string;
  recordStatus: "Active" | "Voided" | string;
  createdBy: string;
}

export type TerminalPurchaseHistory = TerminalTransaction & { packageName?: string, customerEmail?: string, paymentStatus?: string }; 
export type TerminalConsumeHistory = TerminalTransaction & { itemConsumed?: string, quantity?: number, consumeDate?: string, status?: string };

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

// --- BACKEND DTOs (Data Transfer Objects) ---
// These are used internally by the Service to map Backend -> Frontend

export interface BackendAccountDTO {
    accID: number;
    email: string;
    firstName: string;
    mobileNo: string;
    createdDate: string;
    recordStatus: string;
    transactionHistory?: any[];
}

export interface BackendTerminalDTO {
    terminalID: number;
    terminal: string;
    uuid: string;
    terminalType: "POS" | "Kiosk" | "Mobile" | "Web";
    status: "Active" | "Inactive" | "Maintenance";
    modifiedDate: string;
}

export interface HistorySearchData {
    transactionHistory: any[];
    ticketHistory: any[];
}

export interface VoidRequestPayload {
    TrxID: number;
    InvoiceNo: string;
    BalanceQty: number;
    trxType: "Purchase" | "Refund" | "Exchange" | string;
    itemType: "Ticket" | "Credit" | "Reward" | string;
    Action: "Void";
}

export interface TicketUpdateItem {
    ticketNo: string;
    ticketName: string;
    effectiveDate: string;
    expiryDate: string;
    lastValidDate: string;
}

export interface TicketUpdatePayload {
    TrxNo: string; 
    ticketsToUpdate: TicketUpdateItem[];
}