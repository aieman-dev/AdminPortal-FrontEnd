"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { usePagination } from "@/hooks/use-pagination"

interface UseDataTableProps<T> {
  data: T[];
  pageSize?: number;
  initialSort?: { key: keyof T; direction: 'asc' | 'desc' };
}

export function useDataTable<T>({ 
  data, 
  pageSize = 10,
  initialSort
}: UseDataTableProps<T>) {
  
  // 1. Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(
    initialSort ?? null
  );

  // 2. Pagination Hook
  const { 
    currentPage, 
    setCurrentPage, 
    reset: resetPagination, 
    paginate 
  } = usePagination({ pageSize });

  // 3. Handle Sort Click
  const handleSort = useCallback((key: string) => {
    const validKey = key as keyof T;
    
    setSortConfig((current) => {
      if (current && current.key === validKey && current.direction === 'asc') {
        return { key: validKey, direction: 'desc' };
      }
      return { key: validKey, direction: 'asc' };
    });
  }, []);

  // 4. Reset pagination if data length changes (e.g. search filter applied)
  useEffect(() => {
    if (currentPage !== 1) {
        const maxPage = Math.ceil(data.length / pageSize);
        if (currentPage > maxPage && maxPage > 0) {
            setCurrentPage(1);
        }
    }
  }, [data.length, pageSize, currentPage, setCurrentPage]);

  // 5. Memoized Sorted Data
  const sortedData = useMemo(() => {
    // If no sort config, return original data
    if (!sortConfig) return data;
    
    // Create a shallow copy to sort (sort is mutable)
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle nulls/undefined safely
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Standard comparison
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // 6. Slice Data for Current Page
  const paginatedData = paginate(sortedData);
  const totalPages = Math.ceil(sortedData.length / pageSize);

  return {
    // Data
    paginatedData,
    
    // Sort
    sortConfig,
    onSort: handleSort,

    // Pagination Props (Directly compatible with your <DataTable> and <PaginationControls>)
    paginationProps: {
        currentPage,
        totalPages,
        totalRecords: sortedData.length,
        pageSize,
        onPageChange: setCurrentPage
    },

    // Utilities
    resetPagination,
    setSortConfig
  };
}