// hooks/use-pagination.ts
"use client"

import { useState, useCallback } from "react"

interface UsePaginationProps {
  initialPage?: number;
  pageSize?: number;
  initialTotalPages?: number;
  initialTotalRecords?: number;
  mode?: "server" | "client";
}

export function usePagination({ 
  initialPage = 1, 
  pageSize = 10,
  initialTotalPages = 1,
  initialTotalRecords = 0,
  mode = "server"
}: UsePaginationProps = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalRecords, setTotalRecords] = useState(initialTotalRecords);

  // Reset to page 1 (Useful when search query changes)
  const reset = useCallback(() => {
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
  }, []);

  // Bulk update metadata from API response
  const setMetaData = useCallback((totalP: number, totalR: number) => {
    setTotalPages(totalP);
    setTotalRecords(totalR);
  }, []);

  // --- NEW: Client-Side Slicing Helpers ---
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Helper to slice an array based on current state
  const paginate = useCallback(<T,>(items: T[]): T[] => {
    if (!items) return [];
    if (mode === "server") return items;
    return items.slice(startIndex, endIndex);
  }, [startIndex, endIndex, mode]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    totalRecords,
    pageSize,
    setMetaData,
    reset,
    startIndex, 
    endIndex,
    paginate,
    paginationProps: {
      currentPage,
      totalPages,
      totalRecords,
      pageSize,
      onPageChange: setCurrentPage
    }
  };
}