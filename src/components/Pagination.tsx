import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          border: "1px solid var(--blog-border)",
          background: "var(--blog-card)",
          color: "var(--blog-foreground)",
        }}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span key={index} className="px-2 py-2" style={{ color: "var(--blog-muted)" }}>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className="min-w-[36px] h-9 px-3 rounded-md transition-colors"
            style={{
              border: currentPage === page ? "1px solid var(--blog-primary)" : "1px solid var(--blog-border)",
              background: currentPage === page ? "var(--blog-primary)" : "var(--blog-card)",
              color: currentPage === page ? "#ffffff" : "var(--blog-foreground)",
            }}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          border: "1px solid var(--blog-border)",
          background: "var(--blog-card)",
          color: "var(--blog-foreground)",
        }}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}