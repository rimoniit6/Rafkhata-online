import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { sanitizeHtml } from '@/lib/sanitize'

export const metadata: Metadata = {
  title: 'সেবার শর্তাবলী - শিক্ষা বাংলা',
  description: 'শিক্ষা বাংলার সেবার শর্তাবলী। প্ল্যাটফর্ম ব্যবহারের নিয়ম ও শর্তাবলী সম্পর্কে জানুন।',
}

export const dynamic = 'force-dynamic'

const DEFAULT_CONTENT = `
<h1 class="text-3xl font-bold mb-8">সেবার শর্তাবলী</h1>
<p class="text-muted-foreground mb-8">সর্বশেষ আপডেট: জুন ২০২৬</p>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">১. শর্তাবলীর গ্রহণযোগ্যতা</h2>
  <p>শিক্ষা বাংলা ব্যবহার করার মাধ্যমে আপনি এই শর্তাবলী মেনে চলতে বাধ্য। আপনি যদি কোনো শর্তে একমত না হন, তাহলে প্ল্যাটফর্ম ব্যবহার করবেন না।</p>
</section>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">২. অ্যাকাউন্ট নিবন্ধন</h2>
  <p>অ্যাকাউন্ট তৈরি করতে আপনাকে সঠিক ও সম্পূর্ণ তথ্য প্রদান করতে হবে। আপনার অ্যাকাউন্টের নিরাপত্তা আপনার দায়িত্ব।</p>
</section>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">৩. পেমেন্ট ও সাবস্ক্রিপশন</h2>
  <p>প্রিমিয়াম কন্টেন্টের জন্য নির্ধারিত ফি প্রদান করতে হবে। ফি ফেরতযোগ্য নয় যদি না অন্যথায় উল্লেখ করা হয়।</p>
</section>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">৪. মেধাস্বত্ব</h2>
  <p>প্ল্যাটফর্মের সকল কন্টেন্ট শিক্ষা বাংলার মেধাস্বত্ব দ্বারা সুরক্ষিত। কোনো কন্টেন্ট পুনরুৎপাদন বা বিতরণ করা নিষিদ্ধ।</p>
</section>

<section class="space-y-4 mb-8">
  <h2 class="text-xl font-semibold">৫. দায় নিরসন</h2>
  <p>শিক্ষা বাংলা প্ল্যাটফর্মের ব্যবহারজনিত কোনো ক্ষতির জন্য দায়ী থাকবে না। সর্বোচ্চ চেষ্টা সত্ত্বেও সার্ভার ডাউনটাইম বা তথ্য হারানোর সম্ভাবনা থাকতে পারে।</p>
</section>
`

async function getTermsContent() {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: 'terms_content' } })
    return setting?.value || DEFAULT_CONTENT
  } catch {
    return DEFAULT_CONTENT
  }
}

export default async function TermsPage() {
  const content = await getTermsContent()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article
        className="prose prose-emerald max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    </div>
  )
}
