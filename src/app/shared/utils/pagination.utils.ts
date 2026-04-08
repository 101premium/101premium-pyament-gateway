/** 1-based range text for paged lists, e.g. "Showing 1–10 of 14". */
export function buildPaginationRangeSummary(
  currentPage: number,
  pageSize: number,
  totalItems: number
): string {
  if (totalItems <= 0) {
    return '';
  }
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalItems);
  return `Showing ${start}–${end} of ${totalItems}`;
}

/**
 * Up to `maxLinks` zero-based page indices, sliding around `currentPage`.
 * When `totalPages` is smaller than `maxLinks`, returns every page (fewer links).
 */
export function buildPageLinkIndices(
  currentPage: number,
  totalPages: number,
  maxLinks = 5
): number[] {
  if (totalPages <= 0) {
    return [];
  }
  const count = Math.min(maxLinks, totalPages);
  let start = currentPage - Math.floor(count / 2);
  start = Math.max(0, start);
  start = Math.min(start, totalPages - count);
  return Array.from({ length: count }, (_, i) => start + i);
}
