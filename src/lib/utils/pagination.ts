export interface PaginationResult {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function getPagination(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationResult {
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function getOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
