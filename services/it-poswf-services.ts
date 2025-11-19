// services/it-poswf-service.ts
import { apiClient, ApiResponse } from "@/lib/api-client";
import { HistoryRecord, TicketHistory } from "../type/it-poswf"; 

const ENDPOINTS = {
  SEARCH_HISTORY: "/proxy-search-history",
};

// Interface for the data returned *directly* at the root of a 200 OK response
interface HistorySearchData {
  transactionHistory: HistoryRecord[]; 
  ticketHistory: TicketHistory[];       
}

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
};