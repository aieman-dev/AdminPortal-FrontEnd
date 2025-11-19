/*

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
  id: string
  transactionId: string
  invoiceNo: string
  email: string
  mobile: string
  attraction: string
  amount: string
  transactionType: "Purchase" | "Refund"
  createdDate: string
}

export interface TicketHistory {
  id: string
  transactionId: string
  packageName: string
  packageId: string
  qty: number
  startDate: string
  expiryDate: string
  lastValidDate: string
  validDays: number
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

// Added Terminal interface
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

export const mockTerminals = [
  { value: "terminal-001", label: "Terminal 001 - Main Entrance" },
  { value: "terminal-002", label: "Terminal 002 - North Gate" },
  { value: "terminal-003", label: "Terminal 003 - South Gate" },
  { value: "terminal-004", label: "Terminal 004 - VIP Lounge" },
  { value: "terminal-005", label: "Terminal 005 - Food Court" },
]

// Mock data for Activate Balance
export const mockBalanceData: BalanceData = {
  email: "user@example.com",
  creditBalance: 1250.0,
  expiredBalance: 350.0,
  transactions: [
    {
      invoiceNo: "INV-2024-001",
      name: "John Doe",
      amount: 500.0,
      trxType: "Credit",
      createdDate: "2024-01-15",
    },
    {
      invoiceNo: "INV-2024-002",
      name: "John Doe",
      amount: 250.0,
      trxType: "Debit",
      createdDate: "2024-01-20",
    },
    {
      invoiceNo: "INV-2024-003",
      name: "John Doe",
      amount: 1000.0,
      trxType: "Credit",
      createdDate: "2024-02-01",
    },
  ],
}

// Mock data for Update QR Password
export const mockPasswordData: PasswordData = {
  invoiceNo: "INV-2024-001",
  currentPassword: "QR2024ABC123",
}

// Mock data for Search History
export const mockHistoryData: HistoryRecord[] = [
  {
    id: "1",
    transactionId: "TXN-2024-001",
    invoiceNo: "INV-2024-001",
    email: "user1@superapp.com",
    mobile: "+60123456789",
    attraction: "Theme Park Entry",
    amount: "RM 150.00",
    transactionType: "Purchase",
    createdDate: "2024-01-15 10:30:00",
  },
  {
    id: "2",
    transactionId: "TXN-2024-002",
    invoiceNo: "INV-2024-002",
    email: "user2@superapp.com",
    mobile: "+60198765432",
    attraction: "Water Park Pass",
    amount: "RM 200.00",
    transactionType: "Purchase",
    createdDate: "2024-01-15 11:45:00",
  },
  {
    id: "3",
    transactionId: "TXN-2024-003",
    invoiceNo: "INV-2024-003",
    email: "user3@superapp.com",
    mobile: "+60187654321",
    attraction: "Museum Ticket",
    amount: "RM 50.00",
    transactionType: "Refund",
    createdDate: "2024-01-15 14:20:00",
  },
  {
    id: "4",
    transactionId: "TXN-2024-004",
    invoiceNo: "INV-2024-004",
    email: "user1@superapp.com",
    mobile: "+60123456789",
    attraction: "Zoo Entry",
    amount: "RM 80.00",
    transactionType: "Purchase",
    createdDate: "2024-01-16 09:15:00",
  },
]

// Mock data for Shopify Orders
export const mockShopifyOrders: ShopifyOrder[] = [
  {
    id: "1",
    orderName: "#1001",
    orderEmail: "customer1@example.com",
    totalPrice: "$125.50",
    paymentStatus: "paid",
    createdDate: "2024-01-15 10:30 AM",
  },
  {
    id: "2",
    orderName: "#1002",
    orderEmail: "customer2@example.com",
    totalPrice: "$89.99",
    paymentStatus: "pending",
    createdDate: "2024-01-15 11:45 AM",
  },
  {
    id: "3",
    orderName: "#1003",
    orderEmail: "customer3@example.com",
    totalPrice: "$250.00",
    paymentStatus: "paid",
    createdDate: "2024-01-15 02:15 PM",
  },
  {
    id: "4",
    orderName: "#1004",
    orderEmail: "customer4@example.com",
    totalPrice: "$45.75",
    paymentStatus: "failed",
    createdDate: "2024-01-15 03:20 PM",
  },
]

export const mockTicketHistory: TicketHistory[] = [
  {
    id: "1",
    transactionId: "TXN-2024-001",
    packageName: "Theme Park Annual Pass",
    packageId: "PKG-001",
    qty: 2,
    startDate: "2024-01-15",
    expiryDate: "2025-01-15",
    lastValidDate: "2025-01-15",
    validDays: 365,
    status: "Active",
    ticketNo: "TKT-2024-001",
    createdDate: "2024-01-15 10:30:00",
  },
  {
    id: "2",
    transactionId: "TXN-2024-002",
    packageName: "Water Park Day Pass",
    packageId: "PKG-002",
    qty: 4,
    startDate: "2024-01-20",
    expiryDate: "2024-01-20",
    lastValidDate: "2024-01-20",
    validDays: 1,
    status: "Used",
    ticketNo: "TKT-2024-002",
    createdDate: "2024-01-15 11:45:00",
  },
  {
    id: "3",
    transactionId: "TXN-2024-003",
    packageName: "Museum Monthly Pass",
    packageId: "PKG-003",
    qty: 1,
    startDate: "2023-12-01",
    expiryDate: "2024-01-01",
    lastValidDate: "2024-01-01",
    validDays: 31,
    status: "Expired",
    ticketNo: "TKT-2024-003",
    createdDate: "2024-01-15 14:20:00",
  },
  {
    id: "4",
    transactionId: "TXN-2024-004",
    packageName: "Zoo Family Package",
    packageId: "PKG-004",
    qty: 5,
    startDate: "2024-02-01",
    expiryDate: "2024-02-28",
    lastValidDate: "2024-02-28",
    validDays: 28,
    status: "Active",
    ticketNo: "TKT-2024-004",
    createdDate: "2024-01-16 09:15:00",
  },
  {
    id: "5",
    transactionId: "TXN-2024-005",
    packageName: "Adventure Park Weekend Pass",
    packageId: "PKG-005",
    qty: 3,
    startDate: "2024-01-10",
    expiryDate: "2024-01-12",
    lastValidDate: "2024-01-12",
    validDays: 3,
    status: "Cancelled",
    ticketNo: "TKT-2024-005",
    createdDate: "2024-01-10 08:00:00",
  },
]

// Mock data for Manual Consume
export const mockManualConsumeData: ManualConsumeData = {
  creditBalance: 2500.0,
  availableTickets: [
    {
      id: "1",
      packageName: "Theme Park Annual Pass",
      itemName: "Adult Entry Ticket",
      consumeTerminal: "Terminal 001 - Main Entrance",
      itemType: "Ticket",
      ipoints: 1000,
      packageStatus: "Active",
    },
    {
      id: "2",
      packageName: "Water Park Day Pass",
      itemName: "Family Package",
      consumeTerminal: "Terminal 002 - North Gate",
      itemType: "Ticket",
      ipoints: 500,
      packageStatus: "Active",
    },
    {
      id: "3",
      packageName: "Dining Credit Package",
      itemName: "Food Voucher $50",
      consumeTerminal: "Terminal 005 - Food Court",
      itemType: "Credit",
      ipoints: 250,
      packageStatus: "Active",
    },
    {
      id: "4",
      packageName: "VIP Lounge Access",
      itemName: "Premium Access Pass",
      consumeTerminal: "Terminal 004 - VIP Lounge",
      itemType: "Reward",
      ipoints: 2000,
      packageStatus: "Active",
    },
    {
      id: "5",
      packageName: "Museum Entry",
      itemName: "Student Ticket",
      consumeTerminal: "Terminal 003 - South Gate",
      itemType: "Ticket",
      ipoints: 150,
      packageStatus: "Inactive",
    },
  ],
  totalAmount: 3900,
  totalRewardCredit: 850,
}

// Mock data for Extend Ticket
export const mockExtendTicketData: ExtendTicketData[] = [
  {
    ticketNo: "TKT-2024-001",
    ticketName: "Theme Park Annual Pass",
    effectiveDate: "2024-01-15 09:00:00",
    expiryDate: "2025-01-15 23:59:59",
    lastValidDate: "2025-01-15",
  },
  {
    ticketNo: "TKT-2024-002",
    ticketName: "Water Park Day Pass",
    effectiveDate: "2024-01-20 10:00:00",
    expiryDate: "2024-01-20 20:00:00",
    lastValidDate: "2024-01-20",
  },
  {
    ticketNo: "TKT-2024-003",
    ticketName: "Museum Monthly Pass",
    effectiveDate: "2023-12-01 08:00:00",
    expiryDate: "2024-01-01 23:59:59",
    lastValidDate: "2024-01-01",
  },
]

export const mockTerminalData: Terminal[] = [
  {
    id: "1",
    terminalName: "Main Entrance Terminal",
    uuid: "550e8400-e29b-41d4-a716-446655440001",
    terminalType: "POS",
    status: "Active",
    modifiedDate: "2024-01-15 10:30:00",
  },
  {
    id: "2",
    terminalName: "North Gate Kiosk",
    uuid: "550e8400-e29b-41d4-a716-446655440002",
    terminalType: "Kiosk",
    status: "Active",
    modifiedDate: "2024-01-14 15:20:00",
  },
  {
    id: "3",
    terminalName: "South Gate Terminal",
    uuid: "550e8400-e29b-41d4-a716-446655440003",
    terminalType: "POS",
    status: "Inactive",
    modifiedDate: "2024-01-10 09:45:00",
  },
  {
    id: "4",
    terminalName: "VIP Lounge Mobile",
    uuid: "550e8400-e29b-41d4-a716-446655440004",
    terminalType: "Mobile",
    status: "Active",
    modifiedDate: "2024-01-16 11:00:00",
  },
  {
    id: "5",
    terminalName: "Food Court Web Terminal",
    uuid: "550e8400-e29b-41d4-a716-446655440005",
    terminalType: "Web",
    status: "Maintenance",
    modifiedDate: "2024-01-12 14:30:00",
  },
]

export const mockVoidTransactionData: VoidTransaction[] = [
  {
    id: "1",
    transactionId: "TXN-2024-001",
    invoiceNo: "INV-2024-001",
    transactionType: "Purchase",
    itemType: "Ticket",
    balanceQuantity: 2,
    amount: 150.0,
    terminal: "Terminal 001 - Main Entrance",
    status: "Active",
    createdDate: "2024-01-15 10:30:00",
  },
  {
    id: "2",
    transactionId: "TXN-2024-002",
    invoiceNo: "INV-2024-001",
    transactionType: "Purchase",
    itemType: "Credit",
    balanceQuantity: 1,
    amount: 50.0,
    terminal: "Terminal 005 - Food Court",
    status: "Active",
    createdDate: "2024-01-15 11:45:00",
  },
  {
    id: "3",
    transactionId: "TXN-2024-003",
    invoiceNo: "INV-2024-001",
    transactionType: "Exchange",
    itemType: "Reward",
    balanceQuantity: 5,
    amount: 200.0,
    terminal: "Terminal 004 - VIP Lounge",
    status: "Active",
    createdDate: "2024-01-15 14:20:00",
  },
]

// Mock data for Package Listing
export const mockPackageData: Package[] = [
  {
    id: "1",
    packageId: "PKG-001",
    packageName: "Theme Park Annual Pass",
    packageType: "Annual",
    price: 1200.0,
    lastValidDate: "2025-12-31",
    description: "Full year unlimited access to all theme park attractions",
    status: "Active",
    createdBy: "admin@themepark.com",
    lastModifiedBy: "manager@themepark.com",
    modifiedDate: "2024-01-15 10:30:00",
  },
  {
    id: "2",
    packageId: "PKG-002",
    packageName: "Water Park Day Pass",
    packageType: "Daily",
    price: 50.0,
    lastValidDate: "2024-12-31",
    description: "Single day access to water park facilities",
    status: "Active",
    createdBy: "admin@themepark.com",
    lastModifiedBy: "admin@themepark.com",
    modifiedDate: "2024-01-10 14:20:00",
  },
  {
    id: "3",
    packageId: "PKG-003",
    packageName: "VIP Lounge Access",
    packageType: "VIP",
    price: 500.0,
    lastValidDate: "2024-06-30",
    description: "Premium lounge access with complimentary refreshments",
    status: "Active",
    createdBy: "manager@themepark.com",
    lastModifiedBy: "manager@themepark.com",
    modifiedDate: "2024-01-12 09:15:00",
  },
  {
    id: "4",
    packageId: "PKG-004",
    packageName: "Family Package",
    packageType: "Family",
    price: 300.0,
    lastValidDate: "2024-12-31",
    description: "Special package for families up to 5 members",
    status: "Inactive",
    createdBy: "admin@themepark.com",
    lastModifiedBy: "supervisor@themepark.com",
    modifiedDate: "2024-01-08 16:45:00",
  },
  {
    id: "5",
    packageId: "PKG-005",
    packageName: "Monthly Adventure Pass",
    packageType: "Monthly",
    price: 150.0,
    lastValidDate: "2024-12-31",
    description: "30-day unlimited access to adventure zones",
    status: "Active",
    createdBy: "supervisor@themepark.com",
    lastModifiedBy: "supervisor@themepark.com",
    modifiedDate: "2024-01-05 11:30:00",
  },
]

// Mock data for Account Management
export const mockAccountData: Account[] = [
  {
    id: "1",
    accId: "ACC-001",
    email: "john.doe@example.com",
    firstName: "John",
    mobile: "+60123456789",
    createdDate: "2024-01-15 10:30:00",
    accountStatus: "Active",
    transactions: [
      {
        invoiceNo: "INV-2024-001",
        name: "John Doe",
        amount: 500.0,
        trxType: "Credit",
        createdDate: "2024-01-15",
      },
      {
        invoiceNo: "INV-2024-005",
        name: "John Doe",
        amount: 150.0,
        trxType: "Debit",
        createdDate: "2024-01-20",
      },
    ],
  },
  {
    id: "2",
    accId: "ACC-002",
    email: "jane.smith@example.com",
    firstName: "Jane",
    mobile: "+60198765432",
    createdDate: "2024-01-10 14:20:00",
    accountStatus: "Active",
    transactions: [
      {
        invoiceNo: "INV-2024-002",
        name: "Jane Smith",
        amount: 750.0,
        trxType: "Credit",
        createdDate: "2024-01-10",
      },
    ],
  },
  {
    id: "3",
    accId: "ACC-003",
    email: "bob.wilson@example.com",
    firstName: "Bob",
    mobile: "+60187654321",
    createdDate: "2024-01-05 09:15:00",
    accountStatus: "Inactive",
    transactions: [
      {
        invoiceNo: "INV-2024-003",
        name: "Bob Wilson",
        amount: 200.0,
        trxType: "Debit",
        createdDate: "2024-01-05",
      },
      {
        invoiceNo: "INV-2024-006",
        name: "Bob Wilson",
        amount: 300.0,
        trxType: "Credit",
        createdDate: "2024-01-08",
      },
    ],
  },
  {
    id: "4",
    accId: "ACC-004",
    email: "alice.brown@example.com",
    firstName: "Alice",
    mobile: "+60176543210",
    createdDate: "2023-12-20 16:45:00",
    accountStatus: "Active",
    transactions: [
      {
        invoiceNo: "INV-2023-099",
        name: "Alice Brown",
        amount: 1000.0,
        trxType: "Credit",
        createdDate: "2023-12-20",
      },
    ],
  },
  {
    id: "5",
    accId: "ACC-005",
    email: "charlie.davis@example.com",
    firstName: "Charlie",
    mobile: "+60165432109",
    createdDate: "2023-12-15 11:30:00",
    accountStatus: "Suspended",
    transactions: [],
  },
]
*/