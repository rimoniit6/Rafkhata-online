import type { Metadata } from 'next'
import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import CreateExamPage from '@/components/create-exam/CreateExamPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'পরীক্ষা তৈরি করুন - Rafkhata',
  description: 'আপনার পছন্দের অধ্যায় থেকে MCQ পরীক্ষা তৈরি করুন এবং নিজেকে যাচাই করুন।',
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <CreateExamPage />
      </Suspense>
    </AppShell>
  )
}
