import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageSquareText } from 'lucide-react'
import React from 'react'

export const MESSAGE_CONFIG = [
  { key: 'msg_contentComingSoon', label: 'কন্টেন্ট শীঘ্রই আসবে', desc: 'কন্টেন্ট লোড না থাকলে দেখানো বার্তা' },
  { key: 'msg_chaptersComingSoon', label: 'অধ্যায় শীঘ্রই আসবে', desc: 'বিষয়ের অধ্যায় লোড না থাকলে দেখানো বার্তা' },
  { key: 'msg_chapterContentSoon', label: 'অধ্যায় কন্টেন্ট শীঘ্রই আসবে', desc: 'অধ্যায়ের কন্টেন্ট না থাকলে দেখানো বার্তা' },
  { key: 'msg_mcqComingSoon', label: 'MCQ শীঘ্রই আসবে', desc: 'MCQ না থাকলে দেখানো বার্তা' },
  { key: 'msg_cqComingSoon', label: 'CQ শীঘ্রই আসবে', desc: 'সৃজনশীল প্রশ্ন না থাকলে দেখানো বার্তা' },
  { key: 'msg_lectureComingSoon', label: 'লেকচার শীঘ্রই আসবে', desc: 'লেকচার না থাকলে দেখানো বার্তা' },
  { key: 'msg_boardComingSoon', label: 'বোর্ড প্রশ্ন শীঘ্রই আসবে', desc: 'বোর্ড প্রশ্ন না থাকলে দেখানো বার্তা' },
  { key: 'msg_contentLoadError', label: 'কন্টেন্ট লোড ত্রুটি', desc: 'কন্টেন্ট লোড করতে সমস্যা হলে দেখানো বার্তা' },
  { key: 'msg_contentTypeSoon', label: 'কন্টেন্ট টাইপ শীঘ্রই আসবে', desc: 'কন্টেন্ট টাইপ না থাকলে দেখানো বার্তা' },
  { key: 'msg_noQuestionsFound', label: 'প্রশ্ন পাওয়া যায়নি', desc: 'প্রশ্ন না পাওয়া গেলে দেখানো বার্তা' },
  { key: 'msg_footerClassesSoon', label: 'ফুটার শ্রেণি শীঘ্রই আসবে', desc: 'ফুটারে শ্রেণি না থাকলে দেখানো বার্তা' },
  { key: 'msg_footerContactSoon', label: 'ফুটার যোগাযোগ শীঘ্রই আসবে', desc: 'ফুটারে যোগাযোগ তথ্য না থাকলে দেখানো বার্তা' },
  { key: 'msg_subjectsComingSoon', label: 'বিষয় শীঘ্রই আসবে', desc: 'বিষয় না থাকলে দেখানো বার্তা' },
]

export function MessagesTab({
  messages,
  setMessages,
}: {
  messages: Record<string, string>
  setMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareText className="h-5 w-5 text-emerald-600" />
          মেসেজ সেটিংস
        </CardTitle>
        <CardDescription>সাইটের বিভিন্ন জায়গায় দেখানো বার্তাগুলো কাস্টমাইজ করুন</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {MESSAGE_CONFIG.map(({ key, label, desc }) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              value={messages[key] || ''}
              onChange={(e) => setMessages(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={label}
            />
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
