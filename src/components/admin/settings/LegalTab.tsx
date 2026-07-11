import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Scale } from 'lucide-react'
import React from 'react'

export function LegalTab({
  privacyContent, setPrivacyContent,
  termsContent, setTermsContent,
}: {
  privacyContent: string; setPrivacyContent: (v: string) => void
  termsContent: string; setTermsContent: (v: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-5 w-5 text-emerald-600" />
          লিগ্যাল পেজ সেটিংস
        </CardTitle>
        <CardDescription>প্রাইভেসি পলিসি ও শর্তাবলী পেজের কন্টেন্ট কাস্টমাইজ করুন</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-emerald-600" />
            <Label className="text-base font-semibold">প্রাইভেসি পলিসি</Label>
          </div>
          <Textarea
            value={privacyContent}
            onChange={(e) => setPrivacyContent(e.target.value)}
            placeholder="আপনার প্রাইভেসি পলিসি কন্টেন্ট লিখুন..."
            rows={15}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">এই কন্টেন্ট /privacy পেজে দেখানো হবে। HTML ট্যাগ ব্যবহার করা যাবে।</p>
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-emerald-600" />
            <Label className="text-base font-semibold">শর্তাবলী</Label>
          </div>
          <Textarea
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            placeholder="আপনার সেবার শর্তাবলী কন্টেন্ট লিখুন..."
            rows={15}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">এই কন্টেন্ট /terms পেজে দেখানো হবে। HTML ট্যাগ ব্যবহার করা যাবে।</p>
        </div>
      </CardContent>
    </Card>
  )
}
