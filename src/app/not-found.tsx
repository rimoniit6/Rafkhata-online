import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-bold text-edu-primary/20">404</div>
        <h1 className="text-2xl font-bold text-foreground">পৃষ্ঠাটি পাওয়া যায়নি</h1>
        <p className="text-muted-foreground">
          আপনি যে পৃষ্ঠাটি খুঁজছেন তা বিদ্যমান নেই বা সরানো হয়েছে। অনুগ্রহ করে ঠিকানা পরীক্ষা করুন।
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-edu-primary text-white font-medium hover:bg-edu-primary-dark transition-colors"
        >
          হোম পেজে ফিরে যান
        </Link>
      </div>
    </div>
  )
}
