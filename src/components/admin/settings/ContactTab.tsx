import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Phone, Share2 } from 'lucide-react'
import React from 'react'

export function ContactTab({
  contactEmail, setContactEmail,
  contactPhone, setContactPhone,
  facebook, setFacebook,
  youtube, setYoutube,
  telegram, setTelegram,
}: {
  contactEmail: string; setContactEmail: (v: string) => void
  contactPhone: string; setContactPhone: (v: string) => void
  facebook: string; setFacebook: (v: string) => void
  youtube: string; setYoutube: (v: string) => void
  telegram: string; setTelegram: (v: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Phone className="h-5 w-5 text-emerald-600" /> যোগাযোগ তথ্য</CardTitle>
        <CardDescription>যোগাযোগের তথ্য এবং সোশ্যাল লিংক</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>ইমেইল</Label><Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" /></div>
          <div className="space-y-2"><Label>ফোন</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+৮৮০..." /></div>
        </div>
        <Separator />
        <div className="space-y-2"><Label className="flex items-center gap-2"><Share2 className="h-4 w-4" /> সোশ্যাল মিডিয়া</Label></div>
        <div className="space-y-3">
          <div className="space-y-2"><Label className="text-sm text-muted-foreground">ফেসবুক</Label><Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." /></div>
          <div className="space-y-2"><Label className="text-sm text-muted-foreground">ইউটিউব</Label><Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/..." /></div>
          <div className="space-y-2"><Label className="text-sm text-muted-foreground">টেলিগ্রাম</Label><Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/..." /></div>
        </div>
      </CardContent>
    </Card>
  )
}
