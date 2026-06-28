'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props { courseId: string }

export default function SettingsTab({ courseId }: Props) {
  const [certificateEnabled, setCertificateEnabled] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>সার্টিফিকেট</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4"><Switch checked={certificateEnabled} onCheckedChange={setCertificateEnabled} /><Label>সার্টিফিকেট সক্রিয় করুন</Label></div>
          <p className="text-sm text-muted-foreground">সার্টিফিকেট জেনারেটর শীঘ্রই আসবে</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Meta Title</Label><Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Meta Description</Label><Textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} /></div>
        </CardContent>
      </Card>
    </div>
  )
}
