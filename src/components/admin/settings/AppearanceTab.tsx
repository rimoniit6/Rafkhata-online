import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ImageUploader from '@/components/ui/image-uploader'
import { Separator } from '@/components/ui/separator'
import { Globe, Info, Palette } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

export function AppearanceTab({
  logoUrl, setLogoUrl,
  faviconUrl, setFaviconUrl,
}: {
  logoUrl: string; setLogoUrl: (v: string) => void
  faviconUrl: string; setFaviconUrl: (v: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-5 w-5 text-emerald-600" />
          উপস্থিতি সেটিংস
        </CardTitle>
        <CardDescription>সাইটের লোগো ও ফেভিকন আপলোড ও পরিবর্তন করুন</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">লোগো</h3>
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              {logoUrl ? (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/30 flex items-center justify-center relative">
                  <Image src={logoUrl} alt="সাইট লোগো" fill className="object-contain p-1" unoptimized />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg">শি</div>
                    <p className="text-[10px] text-muted-foreground mt-1">ডিফল্ট</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <ImageUploader value={logoUrl} onChange={setLogoUrl} label="সাইট লোগো" placeholder="লোগো ছবি আপলোড করুন বা টেনে আনুন" maxSize={2 * 1024 * 1024} />
              <p className="text-xs text-muted-foreground mt-2">হেডার, ফুটার ও এডমিন সাইডবারে এই লোগো দেখানো হবে। PNG, SVG বা WebP ফরম্যাট সুপারিশকৃত। সর্বোচ্চ আকার ২MB।</p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ফেভিকন</h3>
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              {faviconUrl ? (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/30 flex items-center justify-center">
                  <Image src={faviconUrl} alt="ফেভিকন" width={40} height={40} className="object-contain" unoptimized />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto rounded bg-gray-400 flex items-center justify-center"><Globe className="w-4 h-4 text-white" /></div>
                    <p className="text-[10px] text-muted-foreground mt-1">ডিফল্ট</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <ImageUploader value={faviconUrl} onChange={setFaviconUrl} label="সাইট ফেভিকন" placeholder="ফেভিকন ছবি আপলোড করুন বা টেনে আনুন" accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/gif" maxSize={1 * 1024 * 1024} />
              <p className="text-xs text-muted-foreground mt-2">ব্রাউজার ট্যাবে এই আইকন দেখানো হবে। ICO, PNG বা SVG ফরম্যাট সুপারিশকৃত। ৩২×৩২ বা ১৬×১৬ পিক্সেল আকার ভালো। সর্বোচ্চ আকার ১MB।</p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <Info className="size-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300">লোগো ও ফেভিকন পরিবর্তনের পর সংরক্ষণ বাটনে ক্লিক করুন। ব্রাউজারে ফেভিকন দেখতে পেজ রিফ্রেশ করতে হতে পারে।</p>
        </div>
      </CardContent>
    </Card>
  )
}
