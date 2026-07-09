import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { sanitizeHtml } from '@/lib/sanitize'

export const metadata: Metadata = {
  title: 'প্রাইভেসি পলিসি - শিক্ষা বাংলা',
  description: 'শিক্ষা বাংলার প্রাইভেসি পলিসি। আপনার ব্যক্তিগত তথ্য কীভাবে সংগ্রহ, ব্যবহার ও সংরক্ষণ করা হয় তা জানুন।',
}

export const dynamic = 'force-dynamic'

const DEFAULT_CONTENT = `
<h1 class="text-3xl font-bold mb-8">প্রাইভেসি পলিসি</h1>
<p class="text-muted-foreground mb-8">সর্বশেষ আপডেট: জুন ২০২৬</p>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">১. তথ্য সংগ্রহ</h2>
  <p>আমরা আপনার নিম্নলিখিত তথ্য সংগ্রহ করতে পারি: নাম, ইমেইল ঠিকানা, ফোন নম্বর, শিক্ষাগত তথ্য, এবং প্ল্যাটফর্ম ব্যবহার সংক্রান্ত ডেটা।</p>
</section>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">২. তথ্য ব্যবহার</h2>
  <p>সংগৃহীত তথ্য আমরা ব্যবহার করি: আপনার অ্যাকাউন্ট পরিচালনা, কাস্টমাইজড শিক্ষা সামগ্রী প্রদান, পেমেন্ট প্রসেসিং, এবং প্ল্যাটফর্মের উন্নয়নের জন্য।</p>
</section>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">৩. তথ্য সংরক্ষণ</h2>
  <p>আপনার তথ্য নিরাপদ সার্ভারে সংরক্ষণ করা হয় এবং শুধুমাত্র প্রয়োজনীয় সময়ের জন্য রাখা হয়। আমরা আপনার তথ্য তৃতীয় পক্ষের সাথে শেয়ার করি না।</p>
</section>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">৪. কুকি</h2>
  <p>আমরা ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে কুকি ব্যবহার করি। আপনি আপনার ব্রাউজার সেটিংস থেকে কুকি নিয়ন্ত্রণ করতে পারেন।</p>
</section>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">৫. যোগাযোগ</h2>
  <p>প্রাইভেসি পলিসি সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।</p>
</section>
`

async function getPrivacyContent() {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: 'privacy_content' } })
    return setting?.value || DEFAULT_CONTENT
  } catch {
    return DEFAULT_CONTENT
  }
}

export default async function PrivacyPage() {
  const content = await getPrivacyContent()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article
        className="prose prose-emerald max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    </div>
  )
}
