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

export interface HistoryRecord {
  id?: string | number // Made optional and generic to handle unreliable API payload
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
  id: string
  orderName: string
  orderEmail: string
  totalPrice: string
  paymentStatus: "paid" | "pending" | "failed"
  createdDate: string
}

export interface AvailableTicket {
  id: string
  packageName: string
  itemName: string
  consumeTerminal: string
  itemType: "Ticket" | "Credit" | "Reward"
  ipoints: number
  packageStatus: "Active" | "Inactive" | "Pending"
}

export interface ManualConsumeData {
  creditBalance: number
  availableTickets: AvailableTicket[]
  totalAmount: number
  totalRewardCredit: number
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

export interface VoidTransaction {
  id: string
  transactionId: string
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