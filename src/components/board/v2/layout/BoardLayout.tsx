import type { ReactNode } from 'react'

interface BoardLayoutProps {
  children: ReactNode
}

export function BoardLayout({ children }: BoardLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <main className="min-w-0 py-6">
        {children}
      </main>
    </div>
  )
}
