import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Globe } from 'lucide-react'
import React from 'react'

export function GeneralTab({
  siteName, setSiteName,
  siteDescription, setSiteDescription,
  seoTitle, setSeoTitle,
  seoDescription, setSeoDescription,
  seoKeywords, setSeoKeywords,
  seoAuthor, setSeoAuthor,
}: {
  siteName: string; setSiteName: (v: string) => void
  siteDescription: string; setSiteDescription: (v: string) => void
  seoTitle: string; setSeoTitle: (v: string) => void
  seoDescription: string; setSeoDescription: (v: string) => void
  seoKeywords: string; setSeoKeywords: (v: string) => void
  seoAuthor: string; setSeoAuthor: (v: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-5 w-5 text-emerald-600" /> সাইট তথ্য</CardTitle>
        <CardDescription>ওয়েবসাইটের সাধারণ তথ্য কনফিগার করুন</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>সাইটের নাম</Label><Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="সাইটের নাম" /></div>
        <div className="space-y-2"><Label>বিবরণ</Label><Textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} placeholder="সাইটের বিবরণ" rows={3} /></div>
        <Separator />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">SEO সেটিংস</h3>
        <div className="space-y-2"><Label>SEO শিরোনাম</Label><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম" /><p className="text-xs text-muted-foreground">ব্রাউজার ট্যাবে ও সার্চ ইঞ্জিনে দেখানো হবে। ফাঁকা রাখলে সাইটের নাম ব্যবহার হবে।</p></div>
        <div className="space-y-2"><Label>SEO বিবরণ</Label><Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।" rows={3} /></div>
        <div className="space-y-2"><Label>SEO কীওয়ার্ড (কমা দিয়ে আলাদা)</Label><Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="শিক্ষা বাংলা,অনলাইন শিক্ষা,MCQ,বোর্ড প্রশ্ন,HSC,SSC,বাংলাদেশ" /></div>
        <div className="space-y-2"><Label>SEO লেখক</Label><Input value={seoAuthor} onChange={(e) => setSeoAuthor(e.target.value)} placeholder="শিক্ষা বাংলা" /></div>
      </CardContent>
    </Card>
  )
}
