import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) {
  const renderPageNumbers = () => {
    const items = [];
    const maxVisiblePages = 5;
    const ellipsis = (
      <span
        aria-hidden
        className="flex h-9 w-9 items-center justify-center"
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More pages</span>
      </span>
    );

    // Always show first page
    items.push(
      <button
        key={1}
        onClick={() => onPageChange(1)}
        className={cn(
          buttonVariants({ variant: currentPage === 1 ? "default" : "outline" }),
          "h-9 w-9"
        )}
        aria-current={currentPage === 1 ? "page" : undefined}
      >
        1
      </button>
    );

    if (pageCount <= maxVisiblePages) {
      // Show all pages if total pages are less than maxVisiblePages
      for (let i = 2; i <= pageCount; i++) {
        items.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={cn(
              buttonVariants({ variant: currentPage === i ? "default" : "outline" }),
              "h-9 w-9"
            )}
            aria-current={currentPage === i ? "page" : undefined}
          >
            {i}
          </button>
        );
      }
    } else {
      // Show ellipsis and handle large number of pages
      if (currentPage > 3) {
        items.push(ellipsis);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(pageCount - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={cn(
              buttonVariants({ variant: currentPage === i ? "default" : "outline" }),
              "h-9 w-9"
            )}
            aria-current={currentPage === i ? "page" : undefined}
          >
            {i}
          </button>
        );
      }

      if (currentPage < pageCount - 2) {
        items.push(ellipsis);
      }

      // Always show last page
      if (pageCount > 1) {
        items.push(
          <button
            key={pageCount}
            onClick={() => onPageChange(pageCount)}
            className={cn(
              buttonVariants({ variant: currentPage === pageCount ? "default" : "outline" }),
              "h-9 w-9"
            )}
            aria-current={currentPage === pageCount ? "page" : undefined}
          >
            {pageCount}
          </button>
        );
      }
    }

    return items;
  };

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("flex justify-center gap-2", className)}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous</span>
      </button>

      <div className="flex gap-2">
        {renderPageNumbers()}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pageCount}
        className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next</span>
      </button>
    </nav>
  );
}