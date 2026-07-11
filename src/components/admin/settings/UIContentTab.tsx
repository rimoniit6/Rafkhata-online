import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles } from 'lucide-react'
import React from 'react'

export function UIContentTab({
  heroBadge, setHeroBadge,
  heroTitle, setHeroTitle,
  heroSubtitle, setHeroSubtitle,
  homepageClassesBadge, setHomepageClassesBadge,
  homepageClassesTitle, setHomepageClassesTitle,
  homepageClassesSubtitle, setHomepageClassesSubtitle,
  homepageBoardTitle, setHomepageBoardTitle,
  homepageBoardSubtitle, setHomepageBoardSubtitle,
  homepageMcqTitle, setHomepageMcqTitle,
  homepageMcqSubtitle, setHomepageMcqSubtitle,
  homepageFaqTitle, setHomepageFaqTitle,
  homepageFaqSubtitle, setHomepageFaqSubtitle,
  homepageTestimonialsTitle, setHomepageTestimonialsTitle,
  homepageTestimonialsSubtitle, setHomepageTestimonialsSubtitle,
  homepageStatsTitle, setHomepageStatsTitle,
  homepageStatsSubtitleState, setHomepageStatsSubtitleState,
  homepageFeaturedTitle, setHomepageFeaturedTitle,
  homepageFeaturedSubtitle, setHomepageFeaturedSubtitle,
  homepagePremiumTitle, setHomepagePremiumTitle,
  homepagePremiumSubtitle, setHomepagePremiumSubtitle,
  footerDescription, setFooterDescription,
  premiumFeaturesText, setPremiumFeaturesText,
  mcqFeaturesText, setMcqFeaturesText,
  searchSuggestionsText, setSearchSuggestionsText,
}: {
  heroBadge: string; setHeroBadge: (v: string) => void
  heroTitle: string; setHeroTitle: (v: string) => void
  heroSubtitle: string; setHeroSubtitle: (v: string) => void
  homepageClassesBadge: string; setHomepageClassesBadge: (v: string) => void
  homepageClassesTitle: string; setHomepageClassesTitle: (v: string) => void
  homepageClassesSubtitle: string; setHomepageClassesSubtitle: (v: string) => void
  homepageBoardTitle: string; setHomepageBoardTitle: (v: string) => void
  homepageBoardSubtitle: string; setHomepageBoardSubtitle: (v: string) => void
  homepageMcqTitle: string; setHomepageMcqTitle: (v: string) => void
  homepageMcqSubtitle: string; setHomepageMcqSubtitle: (v: string) => void
  homepageFaqTitle: string; setHomepageFaqTitle: (v: string) => void
  homepageFaqSubtitle: string; setHomepageFaqSubtitle: (v: string) => void
  homepageTestimonialsTitle: string; setHomepageTestimonialsTitle: (v: string) => void
  homepageTestimonialsSubtitle: string; setHomepageTestimonialsSubtitle: (v: string) => void
  homepageStatsTitle: string; setHomepageStatsTitle: (v: string) => void
  homepageStatsSubtitleState: string; setHomepageStatsSubtitleState: (v: string) => void
  homepageFeaturedTitle: string; setHomepageFeaturedTitle: (v: string) => void
  homepageFeaturedSubtitle: string; setHomepageFeaturedSubtitle: (v: string) => void
  homepagePremiumTitle: string; setHomepagePremiumTitle: (v: string) => void
  homepagePremiumSubtitle: string; setHomepagePremiumSubtitle: (v: string) => void
  footerDescription: string; setFooterDescription: (v: string) => void
  premiumFeaturesText: string; setPremiumFeaturesText: (v: string) => void
  mcqFeaturesText: string; setMcqFeaturesText: (v: string) => void
  searchSuggestionsText: string; setSearchSuggestionsText: (v: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          হোমপেজ সেকশন সেটিংস
        </CardTitle>
        <CardDescription>হোম পেজের প্রতিটি সেকশনের শিরোনাম ও উপশিরোনাম কনফিগার করুন। ফাঁকা রাখলে ডিফল্ট দেখাবে।</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">হিরো সেকশন</h3>
          <div className="space-y-2"><Label>হিরো ব্যাজ টেক্সট</Label><Input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম" /><p className="text-xs text-muted-foreground">হিরো সেকশনের উপরে ছোট ব্যাজে দেখানো হবে</p></div>
          <div className="space-y-2"><Label>হিরো শিরোনাম</Label><Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="বাংলাদেশের সেরা" /><p className="text-xs text-muted-foreground">হিরো সেকশনের প্রধান শিরোনাম</p></div>
          <div className="space-y-2"><Label>হিরো সাবটাইটেল</Label><Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন" rows={2} /></div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">শ্রেণি সেকশন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>ব্যাজ</Label><Input value={homepageClassesBadge} onChange={(e) => setHomepageClassesBadge(e.target.value)} placeholder="শিক্ষা যাত্রা" /></div>
            <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageClassesTitle} onChange={(e) => setHomepageClassesTitle(e.target.value)} placeholder="আপনার ক্লাস বেছে নিন" /></div>
            <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageClassesSubtitle} onChange={(e) => setHomepageClassesSubtitle(e.target.value)} placeholder="আপনার শ্রেণি অনুযায়ী সকল বিষয় ও কন্টেন্ট দেখুন" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">বোর্ড প্রশ্ন সেকশন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageBoardTitle} onChange={(e) => setHomepageBoardTitle(e.target.value)} placeholder="বোর্ড প্রশ্ন সমাধান" /></div>
            <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageBoardSubtitle} onChange={(e) => setHomepageBoardSubtitle(e.target.value)} placeholder="সকল বোর্ডের বিগত বছরের প্রশ্ন ও সমাধান অনুশীলন করুন" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">MCQ প্র্যাকটিস সেকশন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageMcqTitle} onChange={(e) => setHomepageMcqTitle(e.target.value)} placeholder="MCQ প্র্যাকটিস" /></div>
            <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageMcqSubtitle} onChange={(e) => setHomepageMcqSubtitle(e.target.value)} placeholder="সময় নির্ধারিত পরীক্ষায় অংশ নিয়ে নিজেকে যাচাই করুন" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">FAQ সেকশন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageFaqTitle} onChange={(e) => setHomepageFaqTitle(e.target.value)} placeholder="সচরাচর জিজ্ঞাসা" /></div>
            <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageFaqSubtitle} onChange={(e) => setHomepageFaqSubtitle(e.target.value)} placeholder="আপনার প্রশ্নের উত্তর এখানে" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">টেস্টিমোনিয়াল সেকশন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageTestimonialsTitle} onChange={(e) => setHomepageTestimonialsTitle(e.target.value)} placeholder="শিক্ষার্থীরা যা বলেন" /></div>
            <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageTestimonialsSubtitle} onChange={(e) => setHomepageTestimonialsSubtitle(e.target.value)} placeholder="আমাদের প্ল্যাটফর্ম ব্যবহারকারী শিক্ষার্থীদের মতামত" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">পরিসংখ্যান সেকশন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageStatsTitle} onChange={(e) => setHomepageStatsTitle(e.target.value)} placeholder="আমাদের অর্জন" /></div>
            <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageStatsSubtitleState} onChange={(e) => setHomepageStatsSubtitleState(e.target.value)} placeholder="সারা বাংলাদেশের শিক্ষার্থীদের সাথে আমরা এগিয়ে যাচ্ছি" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ফিচার্ড কন্টেন্ট সেকশন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageFeaturedTitle} onChange={(e) => setHomepageFeaturedTitle(e.target.value)} placeholder="ফিচার্ড কন্টেন্ট" /></div>
            <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageFeaturedSubtitle} onChange={(e) => setHomepageFeaturedSubtitle(e.target.value)} placeholder="আমাদের সেরা কন্টেন্টসমূহ" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">প্রিমিয়াম ব্যানার সেকশন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepagePremiumTitle} onChange={(e) => setHomepagePremiumTitle(e.target.value)} placeholder="প্রিমিয়াম কন্টেন্ট" /></div>
            <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepagePremiumSubtitle} onChange={(e) => setHomepagePremiumSubtitle(e.target.value)} placeholder="প্রতিটি কন্টেন্ট আলাদাভাবে কিনুন অথবা বান্ডেলে আকর্ষণীয় ছাড়ে পান!" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ফুটার</h3>
          <div className="space-y-2"><Label>ফুটার বিবরণ</Label><Textarea value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} placeholder="বাংলাদেশের শিক্ষার্থীদের জন্য সবচেয়ে বিশ্বস্ত অনলাইন শিক্ষা প্ল্যাটফর্ম।" rows={3} /></div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ফিচার লিস্ট</h3>
          <div className="space-y-2">
            <Label>প্রিমিয়াম ফিচারসমূহ (প্রতিটি লাইনে একটি করে)</Label>
            <Textarea value={premiumFeaturesText} onChange={(e) => setPremiumFeaturesText(e.target.value)} placeholder={'প্রিমিয়াম লেকচার ও কোর্স\nবিস্তারিত MCQ ব্যাখ্যা\nসৃজনশীল প্রশ্নের সমাধান\nবিশেষ সাজেশন ও গাইড\nসকল বোর্ড প্রশ্ন সমাধান'} rows={5} />
            <p className="text-xs text-muted-foreground">প্রিমিয়াম ব্যানারে দেখানো ফিচার লিস্ট। প্রতিটি ফিচার নতুন লাইনে লিখুন। ফাঁকা রাখলে ডিফল্ট দেখাবে।</p>
          </div>
          <div className="space-y-2">
            <Label>MCQ প্র্যাকটিস ফিচারসমূহ (প্রতিটি লাইনে একটি করে)</Label>
            <Textarea value={mcqFeaturesText} onChange={(e) => setMcqFeaturesText(e.target.value)} placeholder={'বিষয়ভিত্তিক পরীক্ষা\nসময় নির্ধারিত পরীক্ষা\nবিস্তারিত ফলাফল ও ব্যাখ্যা\nবোর্ড প্যাটার্ন অনুসারে প্রশ্ন'} rows={4} />
            <p className="text-xs text-muted-foreground">MCQ প্র্যাকটিস সেকশনে দেখানো ফিচার। ফাঁকা রাখলে ডিফল্ট দেখাবে।</p>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">সার্চ</h3>
          <div className="space-y-2">
            <Label>সার্চ সাজেশন (প্রতিটি লাইনে একটি করে)</Label>
            <Textarea value={searchSuggestionsText} onChange={(e) => setSearchSuggestionsText(e.target.value)} placeholder={'গণিত\nপদার্থবিজ্ঞান\nরসায়ন\nজীববিজ্ঞান\nবাংলা\nইংরেজি'} rows={4} />
            <p className="text-xs text-muted-foreground">সার্চ পেজে দেখানো সাজেশন টার্ম। ফাঁকা রাখলে ডিফল্ট দেখাবে।</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
