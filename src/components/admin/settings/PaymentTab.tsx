import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet } from 'lucide-react'
import React from 'react'

export function PaymentTab({
  bkash, setBkash,
  nagad, setNagad,
  rocket, setRocket,
}: {
  bkash: string; setBkash: (v: string) => void
  nagad: string; setNagad: (v: string) => void
  rocket: string; setRocket: (v: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-5 w-5 text-emerald-600" /> পেমেন্ট অ্যাকাউন্ট</CardTitle>
        <CardDescription>মোবাইল ব্যাংকিং অ্যাকাউন্ট নম্বর</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-pink-500 flex items-center justify-center text-white text-xs font-bold">ব</div> বিকাশ</Label>
          <Input value={bkash} onChange={(e) => setBkash(e.target.value)} placeholder="বিকাশ নম্বর" />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center text-white text-xs font-bold">ন</div> নগদ</Label>
          <Input value={nagad} onChange={(e) => setNagad(e.target.value)} placeholder="নগদ নম্বর" />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center text-white text-xs font-bold">র</div> রকেট</Label>
          <Input value={rocket} onChange={(e) => setRocket(e.target.value)} placeholder="রকেট নম্বর" />
        </div>
      </CardContent>
    </Card>
  )
}
