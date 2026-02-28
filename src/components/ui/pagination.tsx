import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const separator = baseUrl.includes('?') ? '&' : '?';

  function pageUrl(page: number) {
    return page === 1 ? baseUrl : `${baseUrl}${separator}page=${page}`;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <p className="sr-only">Page {currentPage} of {totalPages}</p>
      {currentPage > 1 && (
        <Link
          href={pageUrl(currentPage - 1)}
          className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Previous
        </Link>
      )}

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={pageUrl(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm transition-colors',
              page === currentPage
                ? 'bg-primary font-semibold text-primary-foreground'
                : 'border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={pageUrl(currentPage + 1)}
          className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
