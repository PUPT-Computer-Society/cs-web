import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/Select";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const fromItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toItem = Math.min(totalItems, currentPage * pageSize);

  // Smart windowing following Miller's Law (max 7 items in memory)
  const getVisiblePages = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pages = getVisiblePages();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 " +
          "pt-4 border-t border-border/70 text-xs select-none",
        className,
      )}
    >
      {/* Telemetry Counter */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{fromItem}</strong> to{" "}
          <strong className="text-foreground">{toItem}</strong> of{" "}
          <strong className="text-foreground">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div
            className={
              "flex items-center gap-1.5 ml-2 border-l " +
              "border-border/70 pl-3"
            }
          >
            <span className="text-[11px]">Rows:</span>
            <Select
              size="sm"
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
              options={pageSizeOptions.map((opt) => ({
                value: String(opt),
                label: String(opt),
              }))}
              className="w-16"
              triggerClassName="h-7 px-2 text-[11px]"
              contentClassName="min-w-[4.5rem]"
            />
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 shrink-0 max-w-full">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={cn(
            "flex items-center justify-center h-8 px-2.5 rounded-lg " +
              "border border-border bg-card text-foreground " +
              "transition-all duration-150 whitespace-nowrap shrink-0",
            currentPage <= 1
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-secondary hover:border-primary/40 active:scale-95",
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline ml-1 text-xs font-medium">
            Prev
          </span>
        </button>

        {/* Mobile Page Indicator (Hick's Law: minimal mobile load) */}
        <span
          className={
            "sm:hidden px-2 font-mono text-xs font-semibold " +
            "text-muted-foreground select-none whitespace-nowrap shrink-0"
          }
        >
          {currentPage} / {totalPages}
        </span>

        {/* Desktop Page Number Chips */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className={
                    "w-8 h-8 flex items-center justify-center " +
                    "text-muted-foreground font-mono select-none"
                  }
                >
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "h-8 min-w-[2rem] px-2 rounded-lg text-xs font-semibold " +
                    "transition-all duration-150 whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-card text-foreground " +
                        "hover:bg-secondary hover:border-primary/40 " +
                        "active:scale-95",
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={cn(
            "flex items-center justify-center h-8 px-2.5 rounded-lg " +
              "border border-border bg-card text-foreground " +
              "transition-all duration-150 whitespace-nowrap shrink-0",
            currentPage >= totalPages
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-secondary hover:border-primary/40 active:scale-95",
          )}
          aria-label="Next page"
        >
          <span className="hidden sm:inline mr-1 text-xs font-medium">
            Next
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
