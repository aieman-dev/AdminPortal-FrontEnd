"use client";

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
}: PaginationControlsProps) {
  // Hide if there's only 1 page and we either don't know total records OR they fit on one page
  if (totalPages <= 1 && (!totalRecords || totalRecords <= pageSize)) return null;

  // Helper for generating page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/50 rounded-lg px-6 py-4 border border-border">
      {/* Left Side: Page Status */}
      <div className="text-sm text-muted-foreground flex-1 order-2 md:order-1">
        Page <span className="font-semibold text-foreground">{currentPage}</span>
        {totalPages > 1 && (
          <>
            {" "}of <span className="font-semibold text-foreground">{totalPages}</span>
          </>
        )}
      </div>

      {/* Center: Pagination Controls */}
      <div className="order-1 md:order-2">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) onPageChange(currentPage - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page as number);
                    }}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) onPageChange(currentPage + 1);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Right Side: Items Count */}
      <div className="text-sm text-muted-foreground flex-1 text-right order-3 hidden md:block">
        Items per page: <span className="font-semibold text-foreground">{pageSize}</span>
      </div>
    </div>
  );
}