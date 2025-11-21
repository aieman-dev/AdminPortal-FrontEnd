// services/it-poswf-service.ts
import { apiClient, ApiResponse } from "@/lib/api-client";
import { TransactionHistory, ShopifyOrder, TicketHistory } from "../type/it-poswf"; 

const ENDPOINTS = {
  SEARCH_HISTORY: "/proxy-search-history",
  SEARCH_SHOPIFY_ORDER: "/proxy-search-shopify-order",
};

// Interface for the data returned *directly* at the root of a 200 OK response
interface HistorySearchData {
  transactionHistory: TransactionHistory[]; 
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
  }
};