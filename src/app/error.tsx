'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-bold text-foreground">কিছু সমস্যা হয়েছে</h1>
        <p className="text-muted-foreground">
          একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-edu-primary text-white font-medium hover:bg-edu-primary-dark transition-colors"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    </div>
  )
}
