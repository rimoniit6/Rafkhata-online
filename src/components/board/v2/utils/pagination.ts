export interface PaginationWindow {
  items: (number | 'ellipsis')[]
  total: number
  totalPages: number
  page: number
}

export function computePaginationWindow(
  page: number,
  totalPages: number,
  maxVisible: number = 7,
): PaginationWindow {
  const pages: (number | 'ellipsis')[] = []

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    let start = Math.max(2, page - 1)
    let end = Math.min(totalPages - 1, page + 1)
    if (page <= 3) { start = 2; end = Math.min(maxVisible - 1, totalPages - 1) }
    if (page >= totalPages - 2) { start = Math.max(2, totalPages - maxVisible + 2); end = totalPages - 1 }

    if (start > 2) pages.push('ellipsis')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push('ellipsis')
    pages.push(totalPages)
  }

  return { items: pages, total: 0, totalPages, page }
}
