import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'এডমিন প্যানেল - শিক্ষা বাংলা',
  description: 'শিক্ষা বাংলা এডমিন প্যানেল',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
