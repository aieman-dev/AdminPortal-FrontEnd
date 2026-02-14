// services/themepark-support.ts

import { apiClient, ApiResponse, getContent, getDataObject } from "@/lib/api-client";
import { parseAmount } from "@/lib/transformers/wallet";
import { 
    // Domain Models
    Account,
    TransactionHistory, 
    ShopifyOrder,
    TicketHistory,
    VoidTransaction, 
    ExtendTicketData,
    Terminal,
    TerminalTransaction,
    TerminalPurchaseHistory,
    TerminalConsumeHistory,
    TerminalHistoryData,
    PasswordData,
    RetailManualConsumeData,
    ManualConsumeData,
    BalanceDetail,
    DeactivatableTicket,
    ConsumptionHistory,
    AvailableTicket,

    // Payloads
    TerminalSearchPayload,
    RetailManualConsumeSearchPayload,
    ManualConsumeSearchPayload, 
    ConsumeExecutePayload, 
    TicketConsumeExecutePayload,
    TicketDeactivatePayload,
    ConsumptionDeactivatePayload,
    
    // DTOs & Payloads (Imported from Type file)
    BackendAccountDTO,
    BackendTerminalDTO,
    HistorySearchData,
    VoidRequestPayload,
    TicketUpdatePayload,
    ConsumeTicketItem
} from "../type/themepark-support"; 

const ENDPOINTS = {
    // Transaction Master
    VOID_SEARCH: "support/void/find",
    VOID_EXECUTE: "support/void/execute",
    RESYNC_TRANSACTION: "support/consume/transactions/resync-legacy-ticket",
    SEARCH_SHOPIFY_ORDER: "support/vouchers/shopify-search",
    TRANSACTION_BY_TERMINAL: "support/transaction/by-terminal",
    MANUAL_CONSUME_RETAIL_SEARCH: "support/retail/search",
    MANUAL_CONSUME_RETAIL_EXECUTE: "support/retail/consume",
    
    // Attraction Master
    TERMINAL_SEARCH: "support/consume/terminals", 
    TERMINAL_UPDATE: "support/consume/terminals/update-uuid",

    // Ticket Master
    DEACTIVATE_TICKET_SEARCH: "support/tickets/search",
    DEACTIVATE_TICKET_EXECUTE: "support/tickets/deactivate",
    DEACTIVATE_CONSUMPTION_SEARCH: "support/tickets/consumption/search",
    DEACTIVATE_CONSUMPTION_EXECUTE: "support/tickets/consumption/deactivate",
    EXTEND_EXPIRY: "support/ticketdate/update",
    EXTEND_EXPIRY_SEARCH: "support/ticketdate/find",
    QR_PASSWORD_SEARCH: "support/securitynumber/get", 
    QR_PASSWORD_RESET: "support/securitynumber/reset",
    MANUAL_CONSUME_TICKET_SEARCH: "support/consume/search", 
    MANUAL_CONSUME_TICKET_EXECUTE: "support/consume/confirm", 
    
    // Account Master
    SEARCH_ACCOUNTS: "support/account/search",
    GET_ACCOUNT_DETAILS: "support/account/details",
    UPDATE_ACCOUNT_STATUS: "support/account/update-status",
    RESET_ACCOUNT_PASSWORD: "support/account/reset-password",
    EXCHANGE_TRANSACTIONS: "support/account/exchange-transactions",
    UPDATE_ACCOUNT_EMAIL: "support/account/update-email",
    ACTIVATE_BALANCE: "it/activatebalance/activate",
    BALANCE_DETAILS: "support/activatebalance/details",
    SEARCH_HISTORY: "support/history/search",
};

// --- MAPPERS (Backend DTO -> Frontend Model) ---

const mapToTransactionHistory = (raw: any): TransactionHistory => ({
    trxID: raw.trxID,
    transactionId: raw.transactionId,
    invoiceNo: raw.invoiceNo,
    email: raw.email,
    mobile: raw.mobile,
    attractionName: raw.attractionName,
    amount: parseAmount(raw.amount),
    trxType: raw.trxType,
    createdDate: raw.createdDate
});

// Map PascalCase Backend to camelCase Frontend
const mapToAvailableTicket = (raw: any): AvailableTicket => ({
    id: String(raw.TicketItemID), 
    packageName: raw.PackageName, 
    itemName: raw.ItemName, 
    consumeTerminal: raw.ConsumeTerminal, 
    ticketType: raw.TicketType, 
    itemPoint: raw.ItemPoint, 
    packageStatus: raw.PackageStatus, 
    balanceQty: raw.BalanceQty,
    packageID: raw.PackageID,
    packageItemID: raw.PackageItemID,
    trxItemID: raw.TrxItemID,
    sourceType: raw.SourceType,
    ticketItemID: raw.TicketItemID,
});

const mapToDeactivatableTicket = (raw: any): DeactivatableTicket => ({
    id: String(raw.ticketID), 
    ticketID: raw.ticketID,
    ticketNo: raw.ticketNo,
    ticketName: raw.ticketName,
    quantity: raw.ticketQty,
    purchaseDate: raw.purchaseDate,
    status: raw.usageStatus,
    invoiceNo: raw.invoiceNo,
});

const mapToConsumptionHistory = (raw: any): ConsumptionHistory => ({
    id: raw.ticketConsumptionNo, 
    consumptionNo: raw.ticketConsumptionNo,
    trxNo: raw.trxNo,
    ticketNo: raw.ticketNo,
    ticketItemNo: raw.ticketItemNo,
    ticketName: raw.ticketName,
    terminalID: raw.terminalID,
    ticketQty: raw.ticketQty,
    consumeQty: raw.consumeQty,
    modifiedDate: raw.consumptionModifiedDate,
    status: raw.consumptionRecordStatus,
});

const mapToAccount = (raw: BackendAccountDTO): Account => ({
    id: String(raw.accID),
    accId: String(raw.accID),
    email: raw.email || "N/A",
    firstName: raw.firstName || "N/A",
    mobile: raw.mobileNo || "N/A",
    createdDate: raw.createdDate || "N/A",
    accountStatus: (raw.recordStatus as "Active" | "Inactive" | "Suspended") || "N/A",
    transactions: raw.transactionHistory || [],
});

const mapToTerminal = (raw: BackendTerminalDTO): Terminal => ({
    id: String(raw.terminalID),
    terminalName: raw.terminal || "N/A",
    uuid: raw.uuid || "",
    terminalType: raw.terminalType || "POS",
    status: raw.status || "Active",
    modifiedDate: raw.modifiedDate || "N/A"
});

// --- SERVICE IMPLEMENTATION ---

export const itPoswfService = {
    
    searchHistory: async (searchType: string, searchTerm: string): Promise<ApiResponse<HistorySearchData>> => {
        const payload = { searchType, value: searchTerm };
        const response = await apiClient.post<any>(ENDPOINTS.SEARCH_HISTORY, payload);
        
        if (!response.success) {
            const noResultsMessage = "No account or transaction found";
            if (response.error && response.error.includes(noResultsMessage)) {
                return { success: true, data: { transactionHistory: [], ticketHistory: [] } };
            }
            return { success: false, error: response.error || "Network error detected." };
        }
        
        if (!response.data) {
            return { success: true, data: { transactionHistory: [], ticketHistory: [] } };
        }

        const data = getDataObject<any>(response.data);
        const rawTrx = data.transactionHistory || [];
        const rawTickets = data.ticketHistory || [];

        return { 
            success: true, 
            data: {
                transactionHistory: rawTrx.map(mapToTransactionHistory),
                ticketHistory: rawTickets 
            } 
        };
    },

    searchShopifyOrder: async (orderName: string): Promise<ApiResponse<ShopifyOrder>> => {
        const formattedOrderName = orderName.trim().startsWith("#") ? orderName.trim() : `#${orderName.trim()}`;
        const payload = { orderName: formattedOrderName }; 
        const response = await apiClient.post<ShopifyOrder>(ENDPOINTS.SEARCH_SHOPIFY_ORDER, payload);

        if (!response.success) {
            const notFoundMessage = "No transaction found";
            if (response.error && response.error.includes(notFoundMessage)) {
                return { success: true, data: undefined, message: notFoundMessage };
            }
            return { success: false, error: response.error || "Failed to search Shopify order." };
        }
        const data = getDataObject<ShopifyOrder>(response.data);
        return { success: true, data };
    },

    searchVoidTransactions: async (invoiceNo: string): Promise<ApiResponse<VoidTransaction[]>> => {
        const payload = { InvoiceNo: invoiceNo };
        const response = await apiClient.post<any>(ENDPOINTS.VOID_SEARCH, payload);

        if (!response.success) return { success: false, error: response.error || "Failed to search voidable transactions." };

        const result = getContent<any>(response.data);

        const mappedData: VoidTransaction[] = result.map((item, index) => ({
            ...item,
            id: `${item.trxID}-${index}`,
            balanceQty: item.balanceQty,
            amount: item.amount,
            trxType: item.trxType,
            itemType: item.itemType,
            terminal: item.terminalID || item.terminal,
            recordStatus: item.recordStatus
        }));
        
        return { success: true, data: mappedData };
    },

    executeVoidTransaction: async (payload: VoidRequestPayload): Promise<ApiResponse<{ messaged: string }>> => {
        const response = await apiClient.post<{ messaged: string }>(ENDPOINTS.VOID_EXECUTE, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to execute void transaction." };
        return { success: true, data: getDataObject(response.data) };
    },

    resyncTransaction: async (trxId: string): Promise<ApiResponse<{ message: string }>> => {
        const endpoint = `${ENDPOINTS.RESYNC_TRANSACTION}?TrxId=${trxId}`;
        const response = await apiClient.get<{ message: string }>(endpoint);
        if (!response.success) return { success: false, error: response.error || "Failed to resync transaction." };
        return { success: true, data: getDataObject(response.data) };
    },

    searchTerminalHistory: async (terminalId: string, searchDate?: string | Date): Promise<ApiResponse<TerminalHistoryData>> => {
        const dateObj = searchDate ? new Date(searchDate) : new Date();
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}T00:00:00`;

        const payload = { terminalID: terminalId, searchDate: formattedDate };
        const response = await apiClient.post<TerminalTransaction[]>(ENDPOINTS.TRANSACTION_BY_TERMINAL, payload);

        if (!response.success || !response.data) return { success: false, error: response.error || "Failed to search terminal history." };

        const rawList = getContent<TerminalTransaction>(response.data);
        const purchaseHistory: TerminalPurchaseHistory[] = [];
        const consumeHistory: TerminalConsumeHistory[] = [];

        rawList.forEach(trx => {
            const mappedTrx = { ...trx, id: String(trx.trxID) };
            if (mappedTrx.trxType.toLowerCase() === 'purchase') {
                purchaseHistory.push(mappedTrx as TerminalPurchaseHistory);
            } else if (mappedTrx.trxType.toLowerCase() === 'consume') {
                consumeHistory.push(mappedTrx as TerminalConsumeHistory);
            }
        });
        
        return { success: true, data: { purchaseHistory, consumeHistory } };
    },

    searchManualConsumeRetail: async (payload: RetailManualConsumeSearchPayload): Promise<ApiResponse<RetailManualConsumeData>> => {
        const response = await apiClient.post<any>(ENDPOINTS.MANUAL_CONSUME_RETAIL_SEARCH, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to search manual retail consume data." };

        const data = getDataObject<any>(response.data);
        const finalData: RetailManualConsumeData = {
            accID: data.accID, 
            rQrId: data.rQrId, 
            creditBalance: data.creditBalance || 0,
            items: (data.items || []).map((item: any) => ({
                id: String(item.itemID), 
                ...item,
            })),
            totalAmount: 0, 
            totalRewardCredit: 0,
        };
        return { success: true, data: finalData };
    },

    executeManualConsumeRetail: async (payload: ConsumeExecutePayload): Promise<ApiResponse<{ invoiceNo: string }>> => {
        const response = await apiClient.post<{ invoiceNo: string }>(ENDPOINTS.MANUAL_CONSUME_RETAIL_EXECUTE, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to execute manual retail consume." };
        return { success: true, data: getDataObject(response.data) }
    },

    searchManualConsume: async (payload: ManualConsumeSearchPayload): Promise<ApiResponse<ManualConsumeData>> => {
        const response = await apiClient.post<any>(ENDPOINTS.MANUAL_CONSUME_TICKET_SEARCH, payload);

        if (!response.success) {
            if (response.error && response.error.includes("No data found")) {
                return {
                    success: true,
                    data: {
                        creditBalance: 0,
                        tickets: [],
                        accID: undefined,
                        rQRID: undefined,
                        myQr: undefined,
                        totalAmount: 0,
                        totalRewardCredit: 0,
                    }
                };
            }
            return { success: false, error: response.error || "Failed to search manual consume data." };
        }

        const data = getDataObject<any>(response.data);
        const finalData: ManualConsumeData = {
            creditBalance: data.creditBalance || 0,
            tickets: (data.tickets || []).map(mapToAvailableTicket),
            accID: data.accID, 
            rQRID: data.rrQrId, 
            myQr: data.myQr, 
            totalAmount: 0, 
            totalRewardCredit: 0,
        };
        return { success: true, data: finalData };
    },

    //Map Frontend camelCase payload BACK to PascalCase for backend
    executeManualConsume: async (payload: TicketConsumeExecutePayload): Promise<ApiResponse<{ message: string }>> => {
        const backendPayload = {
            ...payload,
            consumeList: payload.consumeList.map(item => ({
                PackageName: item.packageName,
                ItemName: item.itemName,
                TicketType: item.ticketType,
                PackageID: item.packageID,
                PackageItemID: item.packageItemID,
                TicketItemID: item.ticketItemID,
                ConsumeQty: item.consumeQty
            }))
        };

        const response = await apiClient.post<{ message: string }>(ENDPOINTS.MANUAL_CONSUME_TICKET_EXECUTE, backendPayload);

        if (!response.success) {
            const isConflict = response.error && (response.error.includes("already consumed") || response.error.includes("invalid status"));
            if (isConflict) return { success: false, error: "Ticket/Package is already consumed or has an invalid status." };
            return { success: false, error: response.error || "Failed to execute manual ticket consume." };
        }
        return { success: true, data: getDataObject(response.data) };
    },

    findExtendableTickets: async (searchQuery: string): Promise<ApiResponse<ExtendTicketData[]>> => {
        const payload = { TrxNo: searchQuery };
        const response = await apiClient.post<any>(ENDPOINTS.EXTEND_EXPIRY_SEARCH, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to find extendable tickets." };

        const content = getDataObject<any>(response.data);
        let result = [];
        if (Array.isArray(content)) result = content;
        else if (content) result = [content];

        return { success: true, data: result };
    },

    updateTicketExpiry: async (payload: TicketUpdatePayload): Promise<ApiResponse<{ message: string; ticketsToUpdate: number }>> => {
        const response = await apiClient.post<{ message: string; ticketsToUpdate: number }>(ENDPOINTS.EXTEND_EXPIRY, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to update ticket expiry dates." };
        return { success: true, data: getDataObject(response.data) };
    },

    searchTerminals: async (searchTerm: string): Promise<ApiResponse<Terminal[]>> => {
        const payload: TerminalSearchPayload = { SearchQuery: searchTerm.trim() || null };
        const response = await apiClient.post<any>(ENDPOINTS.TERMINAL_SEARCH, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to search terminals." };

        const rawData = getContent<BackendTerminalDTO>(response.data);
        const terminals: Terminal[] = rawData.map(mapToTerminal);
        return { success: true, data: terminals };
    },

    fetchAllTerminals: async (): Promise<ApiResponse<Terminal[]>> => {
        const payload: TerminalSearchPayload = { SearchQuery: "" };
        const response = await apiClient.post<any>(ENDPOINTS.TERMINAL_SEARCH, payload);
        if (!response.success) return { success: false, error: "Failed to fetch terminal list." };

        const terminals: Terminal[] = (Array.isArray(response.data) ? response.data : []).map(mapToTerminal);
        return { success: true, data: terminals };
    },

    updateTerminalUUID: async (terminalId: string, newUUID: string, terminalType: string): Promise<ApiResponse<{ message: string }>> => {
        const payload = { TerminalID: Number(terminalId), NewUUID: newUUID.trim(), TerminalType: terminalType }; //terminal type is not ready yet
        const response = await apiClient.post<{ message: string }>(ENDPOINTS.TERMINAL_UPDATE, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to update terminal UUID." };
        return { success: true, data: getDataObject(response.data) };
    },

    searchQrPassword: async (invoiceNo: string): Promise<ApiResponse<PasswordData>> => {
        const payload = { invoiceNo: invoiceNo };
        const response = await apiClient.post<any>(ENDPOINTS.QR_PASSWORD_SEARCH, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to find QR Password." };

        const data = getDataObject<any>(response.data);
        return { success: true, data: { invoiceNo: data.invoiceNo, currentPassword: data.securityNumber } };
    },
    
    resetQrPassword: async (invoiceNo: string): Promise<ApiResponse<PasswordData>> => {
        const payload = { invoiceNo: invoiceNo };
        const response = await apiClient.post<any>(ENDPOINTS.QR_PASSWORD_RESET, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to reset QR Password." };

        const data = getDataObject<any>(response.data);
        const newPass = data.data?.newSecurityNumber || data.newSecurityNumber;
        return { success: true, data: { invoiceNo: data.data?.invoiceNo || invoiceNo, currentPassword: newPass } };
    },

    searchAccounts: async (email: string): Promise<ApiResponse<Account[]>> => {
        const payload = { email: email };
        const response = await apiClient.post<any>(ENDPOINTS.SEARCH_ACCOUNTS, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to search accounts." };

        const content = getDataObject<any>(response.data);
        let rawResult = [];
        if (Array.isArray(content)) rawResult = content;
        else if (content && content.accID) rawResult = [content];

        return { success: true, data: rawResult.map(mapToAccount) };
    },

    getAccountDetails: async (accId: string): Promise<ApiResponse<Account>> => {
        const payload = { accID: Number(accId) };
        const response = await apiClient.post<BackendAccountDTO>(ENDPOINTS.GET_ACCOUNT_DETAILS, payload);
        if (!response.success || !response.data) return { success: false, error: response.error || "Failed to retrieve account details." };
        
        const data = getDataObject<BackendAccountDTO>(response.data);
        return { success: true, data: mapToAccount(data) };
    },

    resetAccountPassword: async (accId: string): Promise<ApiResponse<{ message: string }>> => {
        const payload = { AccID: Number(accId) };
        const response = await apiClient.post<{ message: string }>(ENDPOINTS.RESET_ACCOUNT_PASSWORD, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to reset password." };
        return response;
    },

    updateAccountStatus: async (accId: string, status: "Active" | "Inactive"): Promise<ApiResponse<void>> => {
        const payload = { AccID: Number(accId), NewStatus: status };
        const response = await apiClient.post<void>(ENDPOINTS.UPDATE_ACCOUNT_STATUS, payload);
        if (!response.success) return { success: false, error: response.error || `Failed to set status to ${status}.` };
        return { success: true };
    },

    updateAccountEmail: async (accId: string, newEmail: string): Promise<ApiResponse<void>> => {
        const payload = { AccId: Number(accId), NewEmail: newEmail };
        const response = await apiClient.post<void>(ENDPOINTS.UPDATE_ACCOUNT_EMAIL, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to update email." };
        return { success: true };
    },

    exchangeTransactions: async (currentAccId: string, newEmail: string, newAccId?: string): Promise<ApiResponse<void>> => {
        const payload = {
            AccId: Number(currentAccId),
            request: {
                NewEmail: newEmail,
                useNewAccId: !!newAccId,
                NewAccId: newAccId || null,
            }
        };
        const response = await apiClient.post<void>(ENDPOINTS.EXCHANGE_TRANSACTIONS, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to exchange transaction." };
        return { success: true };
    },

    activateExpiredBalance: async (accountId: string, email: string): Promise<ApiResponse<void>> => {
        const payload = { accountID: Number(accountId), Email: email };
        const response = await apiClient.post<void>(ENDPOINTS.ACTIVATE_BALANCE, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to activate balance." };
        return { success: true };
    },

    getAccountBalanceDetails: async (email: string): Promise<ApiResponse<BalanceDetail>> => {
        const payload = { email: email };
        const response = await apiClient.post<BalanceDetail>(ENDPOINTS.BALANCE_DETAILS, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to retrieve balance details." };
        return { success: true, data: getDataObject<BalanceDetail>(response.data) };
    },

    searchDeactivatableTickets: async (searchQuery: string): Promise<ApiResponse<DeactivatableTicket[]>> => {
        const isInvoice = searchQuery.includes('-'); 
        const payload = {
            invoiceNo: isInvoice ? searchQuery.trim() : null,
            ticketNo: !isInvoice ? searchQuery.trim() : null,
        };
        const response = await apiClient.post<any[]>(ENDPOINTS.DEACTIVATE_TICKET_SEARCH, payload);
        if (!response.success || !response.data) return { success: false, error: response.error || "Failed to search tickets." };
        const rawList = getContent<any>(response.data);
        return { success: true, data: rawList.map(mapToDeactivatableTicket) };
    },

    searchConsumptionHistory: async (invoiceNo: string, ticketNo: string = ""): Promise<ApiResponse<ConsumptionHistory[]>> => {
        const payload = {
            ticketNo: ticketNo.trim() || null,
            invoiceNo: invoiceNo.trim() || null,
        };
        const response = await apiClient.post<any[]>(ENDPOINTS.DEACTIVATE_CONSUMPTION_SEARCH, payload);
        if (!response.success || !response.data) return { success: false, error: response.error || "Failed to search consumption history." };
        const rawList = getContent<any>(response.data);
        return { success: true, data: rawList.map(mapToConsumptionHistory) };
    },

    deactivateTicket: async (ticketId: number | string): Promise<ApiResponse<void>> => {
        const payload: TicketDeactivatePayload = { ticketId: String(ticketId) };
        const response = await apiClient.post<{ message: string }>(ENDPOINTS.DEACTIVATE_TICKET_EXECUTE, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to deactivate ticket." };
        return { success: true };
    },

    deactivateConsumption: async (consumptionNo: string): Promise<ApiResponse<void>> => {
        const payload: ConsumptionDeactivatePayload = { consumptionNo };
        const response = await apiClient.post<{ message: string }>(ENDPOINTS.DEACTIVATE_CONSUMPTION_EXECUTE, payload);
        if (!response.success) return { success: false, error: response.error || "Failed to deactivate consumption." };
        
        const isAlreadyDeactivated = response.data?.message?.toLowerCase().includes('already deactivated');
        if (response.success || isAlreadyDeactivated) return { success: true, message: response.data?.message };
        return { success: true, message: response.data?.message };
    }
};