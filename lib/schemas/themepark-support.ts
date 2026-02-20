// lib/schemas/themepark-support.ts
import { z } from "zod";

/**
 * Helper to handle ID fields that might come as string or number
 */
const stringOrNumber = z.union([z.string(), z.number()]).optional();

// --- 1. Available Ticket Schema (For Manual Consume) ---
export const AvailableTicketSchema = z.object({
    // IDs (Check both casings)
    TicketItemID: stringOrNumber,
    ticketItemID: stringOrNumber,
    PackageID: stringOrNumber,
    packageID: stringOrNumber,
    PackageItemID: stringOrNumber,
    packageItemID: stringOrNumber,
    TrxItemID: stringOrNumber,
    trxItemID: stringOrNumber,

    // TicketNo fields
    TicketNo: z.string().nullable().optional(),
    ticketNo: z.string().nullable().optional(),

    // Strings
    PackageName: z.string().nullable().optional(),
    packageName: z.string().nullable().optional(),
    ItemName: z.string().nullable().optional(),
    itemName: z.string().nullable().optional(),
    TicketType: z.string().nullable().optional(),
    ticketType: z.string().nullable().optional(),
    PackageStatus: z.string().nullable().optional(),
    packageStatus: z.string().nullable().optional(),
    SourceType: z.string().nullable().optional(),
    sourceType: z.string().nullable().optional(),

    // Numbers (Coerce strings to numbers if needed)
    ConsumeTerminal: stringOrNumber,
    consumeTerminal: stringOrNumber,
    ItemPoint: z.any().optional(), // Allow any, then safe parse
    itemPoint: z.any().optional(),
    BalanceQty: z.any().optional(),
    balanceQty: z.any().optional(),
}).transform((raw) => {
    // Priority: camelCase -> PascalCase -> Default Value
    return {
        id: String(raw.ticketItemID ?? raw.TicketItemID ?? ""),
        packageName: (raw.packageName ?? raw.PackageName ?? "Unknown Package") || "Unknown Package",
        itemName: (raw.itemName ?? raw.ItemName ?? "Unknown Item") || "Unknown Item",
        consumeTerminal: Number(raw.consumeTerminal ?? raw.ConsumeTerminal ?? 0),
        ticketType: (raw.ticketType ?? raw.TicketType ?? "Entry") || "Entry",
        
        // Ensure numbers are actually numbers
        itemPoint: Number(raw.itemPoint ?? raw.ItemPoint ?? 0),
        balanceQty: Number(raw.balanceQty ?? raw.BalanceQty ?? 0),
        
        // Status Normalization
        packageStatus: (raw.packageStatus ?? raw.PackageStatus ?? "Inactive") as "Active" | "Inactive" | "Unused",
        
        // ID fields
        packageID: Number(raw.packageID ?? raw.PackageID ?? 0),
        packageItemID: Number(raw.packageItemID ?? raw.PackageItemID ?? 0),
        trxItemID: Number(raw.trxItemID ?? raw.TrxItemID ?? 0),
        ticketItemID: Number(raw.ticketItemID ?? raw.TicketItemID ?? 0),
        sourceType: (raw.sourceType ?? raw.SourceType ?? "N/A") || "N/A",

        ticketNo: (raw.ticketNo ?? raw.TicketNo ?? "N/A") || "N/A",
    };
});


// --- 2. Transaction History Schema (For Search Results) ---
export const TransactionHistorySchema = z.object({
    trxID: stringOrNumber,
    TrxID: stringOrNumber,
    
    transactionId: stringOrNumber,
    TransactionId: stringOrNumber,
    
    invoiceNo: z.string().nullable().optional(),
    InvoiceNo: z.string().nullable().optional(),
    
    email: z.string().nullable().optional(),
    Email: z.string().nullable().optional(),
    
    mobile: z.string().nullable().optional(),
    Mobile: z.string().nullable().optional(),
    
    attractionName: z.string().nullable().optional(),
    AttractionName: z.string().nullable().optional(),
    
    amount: stringOrNumber,
    Amount: stringOrNumber,
    
    trxType: z.string().nullable().optional(),
    TrxType: z.string().nullable().optional(),
    
    createdDate: z.string().nullable().optional(),
    CreatedDate: z.string().nullable().optional(),
}).transform((raw) => {
    return {
        trxID: Number(raw.trxID ?? raw.TrxID ?? 0),
        transactionId: String(raw.transactionId ?? raw.TransactionId ?? ""),
        invoiceNo: (raw.invoiceNo ?? raw.InvoiceNo ?? "N/A") || "N/A",
        email: (raw.email ?? raw.Email ?? "N/A") || "N/A",
        mobile: (raw.mobile ?? raw.Mobile ?? "N/A") || "N/A",
        attractionName: (raw.attractionName ?? raw.AttractionName ?? "Unknown") || "Unknown",
        amount: Number(raw.amount ?? raw.Amount ?? 0),
        trxType: (raw.trxType ?? raw.TrxType ?? "Unknown") as "Purchase" | "Refund" | "Consume",
        createdDate: (raw.createdDate ?? raw.CreatedDate ?? new Date().toISOString()) || "",
    };
});

// --- 3. Deactivatable Ticket Schema ---
export const DeactivatableTicketSchema = z.object({
    ticketID: stringOrNumber,
    TicketID: stringOrNumber,
    
    ticketNo: z.string().nullable().optional(),
    TicketNo: z.string().nullable().optional(),
    
    ticketName: z.string().nullable().optional(),
    TicketName: z.string().nullable().optional(),
    
    ticketQty: stringOrNumber,
    TicketQty: stringOrNumber,
    quantity: stringOrNumber, // Fallback if backend renames it
    
    purchaseDate: z.string().nullable().optional(),
    PurchaseDate: z.string().nullable().optional(),
    
    usageStatus: z.string().nullable().optional(),
    UsageStatus: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    
    invoiceNo: z.string().nullable().optional(),
    InvoiceNo: z.string().nullable().optional(),
}).transform((raw) => {
    return {
        id: String(raw.ticketID ?? raw.TicketID ?? "0"),
        ticketID: Number(raw.ticketID ?? raw.TicketID ?? 0),
        ticketNo: (raw.ticketNo ?? raw.TicketNo ?? "N/A") || "N/A",
        ticketName: (raw.ticketName ?? raw.TicketName ?? "Unknown Ticket") || "Unknown Ticket",
        quantity: Number(raw.ticketQty ?? raw.TicketQty ?? raw.quantity ?? 0),
        purchaseDate: (raw.purchaseDate ?? raw.PurchaseDate ?? new Date().toISOString()) || "",
        status: (raw.usageStatus ?? raw.UsageStatus ?? raw.status ?? "Unknown") || "Unknown",
        invoiceNo: (raw.invoiceNo ?? raw.InvoiceNo ?? "N/A") || "N/A",
    };
});

// --- 4. Consumption History Schema ---
export const ConsumptionHistorySchema = z.object({
    ticketConsumptionNo: stringOrNumber,
    TicketConsumptionNo: stringOrNumber,
    
    trxNo: z.string().nullable().optional(),
    TrxNo: z.string().nullable().optional(),
    
    ticketNo: z.string().nullable().optional(),
    TicketNo: z.string().nullable().optional(),
    
    ticketItemNo: z.string().nullable().optional(),
    TicketItemNo: z.string().nullable().optional(),
    
    ticketName: z.string().nullable().optional(),
    TicketName: z.string().nullable().optional(),
    
    terminalID: stringOrNumber,
    TerminalID: stringOrNumber,
    
    ticketQty: stringOrNumber,
    TicketQty: stringOrNumber,
    
    consumeQty: stringOrNumber,
    ConsumeQty: stringOrNumber,
    
    consumptionModifiedDate: z.string().nullable().optional(),
    ConsumptionModifiedDate: z.string().nullable().optional(),
    modifiedDate: z.string().nullable().optional(),
    
    consumptionRecordStatus: z.string().nullable().optional(),
    ConsumptionRecordStatus: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
}).transform((raw) => {
    return {
        id: String(raw.ticketConsumptionNo ?? raw.TicketConsumptionNo ?? "0"),
        consumptionNo: String(raw.ticketConsumptionNo ?? raw.TicketConsumptionNo ?? "N/A"),
        trxNo: (raw.trxNo ?? raw.TrxNo ?? "N/A") || "N/A",
        ticketNo: (raw.ticketNo ?? raw.TicketNo ?? "N/A") || "N/A",
        ticketItemNo: (raw.ticketItemNo ?? raw.TicketItemNo ?? "N/A") || "N/A",
        ticketName: (raw.ticketName ?? raw.TicketName ?? "Unknown") || "Unknown",
        terminalID: Number(raw.terminalID ?? raw.TerminalID ?? 0),
        ticketQty: Number(raw.ticketQty ?? raw.TicketQty ?? 0),
        consumeQty: Number(raw.consumeQty ?? raw.ConsumeQty ?? 0),
        modifiedDate: (raw.consumptionModifiedDate ?? raw.ConsumptionModifiedDate ?? raw.modifiedDate ?? new Date().toISOString()) || "",
        status: (raw.consumptionRecordStatus ?? raw.ConsumptionRecordStatus ?? raw.status ?? "Unknown") || "Unknown",
    };
});

// --- 5. Account Schema ---
export const AccountSchema = z.object({
    accID: stringOrNumber,
    AccID: stringOrNumber,
    accId: stringOrNumber,
    
    email: z.string().nullable().optional(),
    Email: z.string().nullable().optional(),
    
    firstName: z.string().nullable().optional(),
    FirstName: z.string().nullable().optional(),
    
    mobileNo: z.string().nullable().optional(),
    MobileNo: z.string().nullable().optional(),
    mobile: z.string().nullable().optional(),
    
    createdDate: z.string().nullable().optional(),
    CreatedDate: z.string().nullable().optional(),
    
    recordStatus: z.string().nullable().optional(),
    RecordStatus: z.string().nullable().optional(),
    accountStatus: z.string().nullable().optional(),

    transactionHistory: z.array(z.any()).optional(), // Pass through raw array
    TransactionHistory: z.array(z.any()).optional(),
}).transform((raw) => {
    return {
        id: String(raw.accID ?? raw.AccID ?? raw.accId ?? "0"),
        accId: String(raw.accID ?? raw.AccID ?? raw.accId ?? "0"),
        email: (raw.email ?? raw.Email ?? "N/A") || "N/A",
        firstName: (raw.firstName ?? raw.FirstName ?? "N/A") || "N/A",
        mobile: (raw.mobileNo ?? raw.MobileNo ?? raw.mobile ?? "N/A") || "N/A",
        createdDate: (raw.createdDate ?? raw.CreatedDate ?? "N/A") || "N/A",
        accountStatus: ((raw.recordStatus ?? raw.RecordStatus ?? raw.accountStatus ?? "N/A") as "Active" | "Inactive" | "Suspended") || "N/A",
        transactions: raw.transactionHistory ?? raw.TransactionHistory ?? [],
    };
});

// --- 6. Terminal Schema ---
export const TerminalSchema = z.object({
    terminalID: stringOrNumber,
    TerminalID: stringOrNumber,
    id: stringOrNumber,
    
    terminal: z.string().nullable().optional(), // 'terminal' in backend DTO
    Terminal: z.string().nullable().optional(),
    terminalName: z.string().nullable().optional(),
    
    uuid: z.string().nullable().optional(),
    UUID: z.string().nullable().optional(),
    
    terminalType: z.string().nullable().optional(),
    TerminalType: z.string().nullable().optional(),
    
    status: z.string().nullable().optional(),
    Status: z.string().nullable().optional(),
    
    modifiedDate: z.string().nullable().optional(),
    ModifiedDate: z.string().nullable().optional(),
}).transform((raw) => {
    return {
        id: String(raw.terminalID ?? raw.TerminalID ?? raw.id ?? "0"),
        terminalName: (raw.terminal ?? raw.Terminal ?? raw.terminalName ?? "N/A") || "N/A",
        uuid: (raw.uuid ?? raw.UUID ?? "") || "",
        terminalType: ((raw.terminalType ?? raw.TerminalType ?? "POS") as "POS" | "Kiosk" | "Mobile" | "Web") || "POS",
        status: ((raw.status ?? raw.Status ?? "Active") as "Active" | "Inactive" | "Maintenance") || "Active",
        modifiedDate: (raw.modifiedDate ?? raw.ModifiedDate ?? "N/A") || "N/A",
    };
});