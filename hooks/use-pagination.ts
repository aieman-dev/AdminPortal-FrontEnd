// hooks/use-pagination.ts
"use client"

import { useState } from "react"

interface UsePaginationProps {
  initialPage?: number;
  pageSize?: number;
  initialTotalPages?: number;
  initialTotalRecords?: number;
}

export function usePagination({ 
  initialPage = 1, 
  pageSize = 10,
  initialTotalPages = 1,
  initialTotalRecords = 0
}: UsePaginationProps = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalRecords, setTotalRecords] = useState(initialTotalRecords);

  // Reset to page 1 (Useful when search query changes)
  const reset = () => {
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
  };

  // Bulk update metadata from API response
  const setMetaData = (totalP: number, totalR: number) => {
    setTotalPages(totalP);
    setTotalRecords(totalR);
  };

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    totalRecords,
    pageSize,
    setMetaData,
    reset,
    paginationProps: {
      currentPage,
      totalPages,
      totalRecords,
      pageSize,
      onPageChange: setCurrentPage
    }
  };
}