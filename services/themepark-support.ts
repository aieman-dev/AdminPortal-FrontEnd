// services/it-poswf-service.ts

import { 
    apiClient, 
    ApiResponse 
} from "@/lib/api-client";
import { 
    Account,
    TransactionHistory, 
    ShopifyOrder,
    TicketHistory,
    VoidTransaction, 
    ExtendTicketData,
    Terminal,
    TerminalSearchPayload,
    PasswordData,
    ManualConsumeData,
    ManualConsumeSearchPayload, 
    ConsumeExecutePayload,
    ConsumeExecuteItem, 
    BalanceDetail,
    DeactivatableTicket,
    ConsumptionHistory,
    TicketDeactivatePayload,
    ConsumptionDeactivatePayload
} from "../type/themepark-support"; 

const ENDPOINTS = {
    SEARCH_HISTORY: "/proxy-search-history",
    SEARCH_SHOPIFY_ORDER: "/proxy-search-shopify-order",
    
    VOID_EXECUTE: "/proxy-void/execute",
    VOID_SEARCH: "/proxy-void/search",
    EXTEND_EXPIRY: "/proxy-extend-expiry/update",
    EXTEND_EXPIRY_SEARCH: "/proxy-extend-expiry/search",
    
    TERMINAL_SEARCH: "/proxy-terminal/search", 
    TERMINAL_UPDATE: "/proxy-terminal/update",
    
    QR_PASSWORD_SEARCH: "/proxy-qr-password/search", 
    QR_PASSWORD_RESET: "/proxy-qr-password/reset",
    
    MANUAL_CONSUME_SEARCH: "/proxy-manual-consume/search", 
    MANUAL_CONSUME_EXECUTE: "/proxy-manual-consume/execute",
    
    SEARCH_ACCOUNTS: "/proxy-account/search",
    GET_ACCOUNT_DETAILS: "/proxy-account/details",
    UPDATE_ACCOUNT_STATUS: "/proxy-account/update-status",
    RESET_ACCOUNT_PASSWORD: "/proxy-account/reset-password",
    EXCHANGE_TRANSACTIONS: "/proxy-account/exchange-transactions",
    UPDATE_ACCOUNT_EMAIL: "/proxy-account/update-email",
    ACTIVATE_BALANCE: "/proxy-account/activate-balance",
    BALANCE_DETAILS: "/proxy-account/balance-details",

    DEACTIVATE_TICKET_SEARCH: "/proxy-deactivate/ticket/search",
    DEACTIVATE_TICKET_EXECUTE: "/proxy-deactivate/ticket/execute",
    DEACTIVATE_CONSUMPTION_SEARCH: "/proxy-deactivate/consumption-ticket/search",
    DEACTIVATE_CONSUMPTION_EXECUTE: "/proxy-deactivate/consumption-ticket/execute",
};

// Interface for the data returned *directly* at the root of a 200 OK response
interface HistorySearchData {
    transactionHistory: TransactionHistory[]; 
    ticketHistory: TicketHistory[];       
}

// Interface for the exact Void Request Payload
interface VoidRequestPayload {
    TrxID: number;
    InvoiceNo: string;
    BalanceQty: number;
    trxType: "Purchase" | "Refund" | "Exchange";
    itemType: "Ticket" | "Credit" | "Reward";
    Action: "Void";
}

interface ExtendTrxFindResponse {
    trxID: number;
    invoiceNo: string;
    trxType: string;
    amount: number;
    createdDate: string;
    recordStatus: string;
}

// Interface for the exact API Payload for a single ticket update
interface TicketUpdateItem {
    ticketNo: string;
    ticketName: string;
    effectiveDate: string;
    expiryDate: string;
    lastValidDate: string;
}

interface TicketUpdatePayload {
    TrxNo: string; // The search term (Invoice No. / Transaction No)
    ticketsToUpdate: TicketUpdateItem[];
}

const mapToDeactivatableTicket = (raw: any): DeactivatableTicket => ({
    id: String(raw.ticketID), // Use ticketID for React key
    ticketID: raw.ticketID,
    ticketNo: raw.ticketNo,
    ticketName: raw.ticketName,
    quantity: raw.ticketQty,
    purchaseDate: raw.purchaseDate,
    status: raw.recordStatus,
    invoiceNo: raw.invoiceNo,
});

// Helper to map consumption search result
const mapToConsumptionHistory = (raw: any): ConsumptionHistory => ({
    id: raw.ticketConsumptionNo, // Use consumption number as unique ID for key
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


export const itPoswfService = {
    searchHistory: async (searchType: string, searchTerm: string): Promise<ApiResponse<HistorySearchData>> => {
        
        const payload = {
            searchType: searchType,
            value: searchTerm, 
        };
        
        const response = await apiClient.post<HistorySearchData>(ENDPOINTS.SEARCH_HISTORY, payload);
        
        // FIX: Intercept the API failure case
        if (!response.success) {
            const noResultsMessage = "No account or transaction found for the given value.";
            
            // If the failure message matches the "no results" string, convert it to a success.
            if (response.error && response.error.includes(noResultsMessage)) {
                // Convert the API failure into a success state with empty data arrays.
                return {
                    success: true,
                    data: {
                        transactionHistory: [],
                        ticketHistory: [],
                    }
                };
            }
            
            // If it's a real server error (401, 500, etc.), return the failure.
            return {
                success: false,
                error: response.error || "Network or HTTP failure detected."
            };
        }
        
        // If response.success is true, we proceed as normal.
        if (!response.data) {
            return {
                success: true, 
                error: "No data records found in backend response."
            };
        }

        return {
            success: true,
            data: response.data, 
        };
    },

    // ADDED NEW SERVICE FUNCTION
    searchShopifyOrder: async (orderId: string): Promise<ApiResponse<ShopifyOrder>> => {
        const payload = {
            orderId: orderId,
        };

        const response = await apiClient.post<ShopifyOrder>(ENDPOINTS.SEARCH_SHOPIFY_ORDER, payload);

        if (!response.success) {
            // Handle explicit "Not Found" case, which should translate to an empty result
            const notFoundMessage = "No transaction found for the given order ID";
            if (response.error && response.error.includes(notFoundMessage)) {
                // Return success with undefined data for a "no results" found scenario
                return { success: true, data: undefined, message: notFoundMessage };
            }
            
            // General error
            return {
                success: false,
                error: response.error || "Failed to search Shopify order."
            };
        }
        
        // Successful API call (data may be present or undefined if backend returns 200 OK with no body)
        return response;
    },

    // ADDED VOID EXECUTE FUNCTION
    executeVoidTransaction: async (payload: VoidRequestPayload): Promise<ApiResponse<{ messaged: string }>> => {
        const response = await apiClient.post<{ messaged: string }>(ENDPOINTS.VOID_EXECUTE, payload);

        if (!response.success) {
            // General error handling from the proxy
            return {
                success: false,
                error: response.error || "Failed to execute void transaction."
            };
        }
        
        return response;
    },

    searchVoidTransactions: async (invoiceNo: string): Promise<ApiResponse<VoidTransaction[]>> => {
        // Payload required by backend: {"InvoiceNo": "..."}
        const payload = {
            InvoiceNo: invoiceNo,
        };

        // Note: The proxy will convert the single returned object/null into an array,
        // so we expect VoidTransaction[] here.
        const response = await apiClient.post<VoidTransaction[]>(ENDPOINTS.VOID_SEARCH, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to search voidable transactions."
            };
        }
        
        return response;
    },

    // ADDED TICKET EXPIRY FIND FUNCTION
    findExtendableTickets: async (searchQuery: string): Promise<ApiResponse<ExtendTicketData[]>> => {
        const payload = {
            TrxNo: searchQuery,
        };

        // Assuming the backend returns an array of the transaction objects shown
        const response = await apiClient.post<ExtendTicketData[]>(ENDPOINTS.EXTEND_EXPIRY_SEARCH, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to find extendable tickets."
            };
        }
        
        return response;
    },

    // TICKET EXPIRY UPDATE FUNCTION
    updateTicketExpiry: async (payload: TicketUpdatePayload): Promise<ApiResponse<{ message: string; ticketsToUpdate: number }>> => {
        const response = await apiClient.post<{ message: string; ticketsToUpdate: number }>(ENDPOINTS.EXTEND_EXPIRY, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to update ticket expiry dates."
            };
        }
        
        return response;
    },

    // --- UPDATED: Search Terminals (Replaces mock logic) ---
    searchTerminals: async (searchTerm: string): Promise<ApiResponse<Terminal[]>> => {
        const payload: TerminalSearchPayload = {
            SearchQuery: searchTerm.trim() || null,
        };

        // NOTE: This assumes the proxy file at /api/it-poswf/terminal/search handles the request.
        const response = await apiClient.post<Terminal[]>(ENDPOINTS.TERMINAL_SEARCH, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to search terminals."
            };
        }
        return response;
    },

    updateTerminalUUID: async (terminalId: string, newUUID: string): Promise<ApiResponse<{ message: string }>> => {
        // Payload based on image_0d3d1b.jpg
        const payload = { 
            TerminalID: Number(terminalId), // Ensure ID is sent as a number
            NewUUID: newUUID.trim() 
        };
        
        const response = await apiClient.post<{ message: string }>(ENDPOINTS.TERMINAL_UPDATE, payload);

        if (!response.success) {
            return { success: false, error: response.error || "Failed to update terminal UUID." };
        }
        return response;
    },

    // --- NEW: Search QR Password ---
    searchQrPassword: async (invoiceNo: string): Promise<ApiResponse<PasswordData>> => {
        const payload = {
            invoiceNo: invoiceNo,
        };

        // Calls /api/support/securitynumber/get via proxy
        const response = await apiClient.post<PasswordData>(ENDPOINTS.QR_PASSWORD_SEARCH, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to find QR Password."
            };
        }
        
        return response;
    },
    
    // --- NEW: Reset QR Password ---
    resetQrPassword: async (invoiceNo: string): Promise<ApiResponse<PasswordData>> => {
        // Assuming reset operation needs the invoice number and returns the new password.
        const payload = {
            invoiceNo: invoiceNo,
        };

        // Calls the reset endpoint via proxy
        const response = await apiClient.post<PasswordData>(ENDPOINTS.QR_PASSWORD_RESET, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to reset QR Password."
            };
        }
        
        return response;
    },
    // --- NEW: Search Manual Consume Data ---
    searchManualConsume: async (payload: ManualConsumeSearchPayload): Promise<ApiResponse<ManualConsumeData>> => {
        // This function will rely on proxy to map the response to ManualConsumeData
        const response = await apiClient.post<ManualConsumeData>(ENDPOINTS.MANUAL_CONSUME_SEARCH, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to search manual consume data."
            };
        }
        return response;
    },

    //Fetches a list of terminals for dropdowns (Manual Consume Terminal ID Select).
    //This uses a non-filtered search query (or a very broad one).
    fetchAllTerminals: async (): Promise<ApiResponse<Terminal[]>> => {
        // The backend endpoint POST /api/support/consume/terminals accepts a simple payload.
        const payload: TerminalSearchPayload = {
            // Using a broad query (or null) to get the standard list of terminals.
            SearchQuery: "", 
        };
        
        // This hits the same proxy as searchTerminals, which handles mapping the response.
        const response = await apiClient.post<Terminal[]>(ENDPOINTS.TERMINAL_SEARCH, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to fetch terminal list for dropdown.",
            };
        }
        return response;
    },

    // --- NEW: Execute Manual Consume ---
    executeManualConsume: async (payload: ConsumeExecutePayload): Promise<ApiResponse<{ invoiceNo: string }>> => {
        // This function sends the complex execution payload
        const response = await apiClient.post<{ invoiceNo: string }>(ENDPOINTS.MANUAL_CONSUME_EXECUTE, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to execute manual consume."
            };
        }
        // Assuming backend response contains { invoiceNo: "..." }
        return { success: true, data: response.data }; 
    },

    // NEW FUNCTION FOR ACCOUNT MANAGEMENT SEARCH
    searchAccounts: async (email: string): Promise<ApiResponse<Account[]>> => {
        const payload = {
            email: email,
        };
        // The proxy will handle normalizing the response to an array, if necessary.
        const response = await apiClient.post<Account[]>(ENDPOINTS.SEARCH_ACCOUNTS, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to search accounts."
            };
        }
        
        return response;
    },

    getAccountDetails: async (accId: string): Promise<ApiResponse<Account>> => {
        const payload = {
            accID: Number(accId), // Backend expects accID as a number
        };
        
        const response = await apiClient.post<any>(ENDPOINTS.GET_ACCOUNT_DETAILS, payload);

        if (!response.success || !response.data) {
            return {
                success: false,
                error: response.error || "Failed to retrieve account details."
            };
        }
        
        // Map backend fields to frontend Account type (since proxy returns raw data)
        const rawData = response.data;
        const mappedAccount: Account = {
            id: rawData.accID ? String(rawData.accID) : "N/A", // Use accID as unique ID
            accId: rawData.accID ? String(rawData.accID) : "N/A",
            email: rawData.email || "N/A",
            firstName: rawData.firstName || "N/A",
            mobile: rawData.mobileNo || "N/A", // Backend uses mobileNo
            createdDate: rawData.createdDate || "N/A",
            accountStatus: rawData.recordStatus || "N/A", // Backend uses recordStatus
            transactions: rawData.transactionHistory || [], // Backend uses transactionHistory
        };

        return {
            success: true,
            data: mappedAccount,
        };
    },

    //Resets the account password and returns the new password
    resetAccountPassword: async (accId: string): Promise<ApiResponse<{ message: string }>> => {
        const payload = { AccID: Number(accId) };
        const response = await apiClient.post<{ message: string }>(ENDPOINTS.RESET_ACCOUNT_PASSWORD, payload);
        
        if (!response.success) {
            return { success: false, error: response.error || "Failed to reset password." };
        }
        return response;
    },

    //Updates the account status (Active/Inactive).
    updateAccountStatus: async (accId: string, status: "Active" | "Inactive"): Promise<ApiResponse<void>> => {
        const payload = { AccID: Number(accId), NewStatus: status };
        const response = await apiClient.post<void>(ENDPOINTS.UPDATE_ACCOUNT_STATUS, payload);
        
        if (!response.success) {
            return { success: false, error: response.error || `Failed to set status to ${status}.` };
        }
        return { success: true };
    },

    //changes the accounts primary email
    updateAccountEmail: async (accId: string, newEmail: string): Promise<ApiResponse<void>> => {
        const payload = { AccId: Number(accId), NewEmail: newEmail };
        const response = await apiClient.post<void>(ENDPOINTS.UPDATE_ACCOUNT_EMAIL, payload);

        if (!response.success) {
            return { success: false, error: response.error || "Failed to update email." };
        }
        return { success: true };
    },

    //exchanges transaction ownership to a new email/account
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

        if (!response.success) {
            return { success: false, error: response.error || "Failed to exchange transaction." };
        }
        return { success: true };
    },

    //activates expired balance for a user
    activateExpiredBalance: async (accountId: string, email: string): Promise<ApiResponse<void>> => {
        const payload = {
            accountID: Number(accountId),
            Email: email
        };
        const response = await apiClient.post<void>(ENDPOINTS.ACTIVATE_BALANCE, payload);

        if (!response.success) {
            return { success: false, error: response.error || "Failed to activate balance." };
        }
        return { success: true };
    },

    getAccountBalanceDetails: async (email: string): Promise<ApiResponse<BalanceDetail>> => {
        const payload = {
            email: email,
        };
        
        const response = await apiClient.post<BalanceDetail>(ENDPOINTS.BALANCE_DETAILS, payload);

        if (!response.success) {
            return {
                success: false,
                error: response.error || "Failed to retrieve balance details."
            };
        }
        
        return response;
    },

    searchDeactivatableTickets: async (searchQuery: string): Promise<ApiResponse<DeactivatableTicket[]>> => {
        // Logic to determine if query is an InvoiceNo (contains '-') or TicketNo
        const isInvoice = searchQuery.includes('-') || searchQuery.length > 10;
        const payload = {
            invoiceNo: isInvoice ? searchQuery.trim() : null,
            ticketNo: !isInvoice ? searchQuery.trim() : null,
        };

        const response = await apiClient.post<any[]>(ENDPOINTS.DEACTIVATE_TICKET_SEARCH, payload);

        if (!response.success || !response.data) {
            return { success: false, error: response.error || "Failed to search tickets." };
        }

        return {
            success: true,
            data: response.data.map(mapToDeactivatableTicket),
        };
    },

    // 2. Search Consumption History
    searchConsumptionHistory: async (invoiceNo: string, ticketNo: string = ""): Promise<ApiResponse<ConsumptionHistory[]>> => {
        // This is primarily a search by (InvoiceNo + TicketNo), but we default ticketNo to empty/placeholder
        const payload = {
            ticketNo: ticketNo.trim(),
            invoiceNo: invoiceNo.trim(),
        };
        
        const response = await apiClient.post<any[]>(ENDPOINTS.DEACTIVATE_CONSUMPTION_SEARCH, payload);

        if (!response.success || !response.data) {
            return { success: false, error: response.error || "Failed to search consumption history." };
        }

        return {
            success: true,
            data: response.data.map(mapToConsumptionHistory),
        };
    },

    // 3. Deactivate Ticket
    deactivateTicket: async (ticketId: number | string): Promise<ApiResponse<void>> => {
        const payload: TicketDeactivatePayload = { ticketId: String(ticketId) };
        const response = await apiClient.post<{ message: string }>(ENDPOINTS.DEACTIVATE_TICKET_EXECUTE, payload);

        if (!response.success) {
            return { success: false, error: response.error || "Failed to deactivate ticket." };
        }
        return { success: true };
    },

    // 4. Deactivate Consumption
    deactivateConsumption: async (consumptionNo: string): Promise<ApiResponse<void>> => {
        const payload: ConsumptionDeactivatePayload = { consumptionNo };
        const response = await apiClient.post<{ message: string }>(ENDPOINTS.DEACTIVATE_CONSUMPTION_EXECUTE, payload);

        if (!response.success) {
            return { success: false, error: response.error || "Failed to deactivate consumption." };
        }
        
        const isAlreadyDeactivated = response.data?.message?.toLowerCase().includes('already deactivated');

        if (response.success || isAlreadyDeactivated) {
             return { success: true, message: response.data?.message };
        }
        
        return { success: true }; 
    }
};