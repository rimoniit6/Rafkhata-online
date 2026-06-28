'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import type { CourseDetailRecord, CourseOverviewData } from '@/features/course/types'

interface Props {
  course: CourseDetailRecord
  onSave: (data: Partial<CourseOverviewData>) => Promise<boolean | undefined>
  saving: boolean
  onRefresh: () => void
}

export default function OverviewTab({ course, onSave, saving }: Props) {
  const { metadata, subjects } = useHierarchyMetadata()
  const classList = (metadata?.classes || []) as { id: string; name: string }[]

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [price, setPrice] = useState(0)
  const [originalPrice, setOriginalPrice] = useState(0)
  const [status, setStatus] = useState('draft')
  const [features, setFeatures] = useState('')
  const [requirements, setRequirements] = useState('')
  const [targetStudents, setTargetStudents] = useState('')
  const [hasCertificate, setHasCertificate] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)
  const [language, setLanguage] = useState('bangla')
  const [difficulty, setDifficulty] = useState('intermediate')

  useEffect(() => {
    setTitle(course.title)
    setSlug(course.slug)
    setDescription(course.description || '')
    setThumbnail(course.thumbnail || '')
    setTeacherName(course.teacherName || '')
    setClassId(course.classId || '')
    setSubjectId(course.subjectId || '')
    setIsPremium(course.isPremium)
    setPrice(course.price || 0)
    setOriginalPrice(course.originalPrice || 0)
    setStatus(course.status)
    setFeatures(course.features || '')
    setRequirements(course.requirements || '')
    setTargetStudents(course.targetStudents || '')
    setHasCertificate(course.hasCertificate)
    setDuration(course.duration)
    setLanguage(course.language || 'bangla')
    setDifficulty(course.difficulty || 'intermediate')
  }, [course])

  const filteredSubjects = classId ? subjects.filter((s: any) => s.classId === classId) : subjects

  const handleSave = () => {
    onSave({
      title, slug, description, thumbnail, teacherName, classId, subjectId,
      isPremium, price: Number(price), status: status as 'draft' | 'published',
      originalPrice: Number(originalPrice),
      features, requirements, targetStudents, hasCertificate,
      duration, language, difficulty,
    })
  }

  const hasChanges = title !== course.title || status !== course.status || isPremium !== course.isPremium

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>মৌলিক তথ্য</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>শিরোনাম *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Slug *</Label><Input value={slug} onChange={e => setSlug(e.target.value)} /></div>
            <div className="space-y-2"><Label>বিবরণ</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="space-y-2"><Label>থাম্বনেইল URL</Label><Input value={thumbnail} onChange={e => setThumbnail(e.target.value)} /></div>
            <div className="space-y-2"><Label>শিক্ষক</Label><Input value={teacherName} onChange={e => setTeacherName(e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>স্ট্যাটাস ও মূল্য</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>স্ট্যাটাস</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">ড্রাফট</SelectItem>
                  <SelectItem value="published">পাবলিশড</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4"><Switch checked={isPremium} onCheckedChange={setIsPremium} /><Label>প্রিমিয়াম কোর্স</Label></div>
            {isPremium && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>মূল্য (৳)</Label>
                  <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>পূর্বের মূল্য (৳) <span className="text-xs text-muted-foreground">(ছাড় দেখানোর জন্য)</span></Label>
                  <Input type="number" value={originalPrice} onChange={e => setOriginalPrice(Number(e.target.value))} />
                </div>
                {originalPrice > 0 && originalPrice > price && (
                  <p className="text-xs text-green-600 font-medium">
                    {Math.round((1 - price / originalPrice) * 100)}% ছাড়
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ক্যাটাগরি</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>শ্রেণি</Label>
              <Select value={classId} onValueChange={v => { setClassId(v); setSubjectId('') }}>
                <SelectTrigger><SelectValue placeholder="শ্রেণি নির্বাচন" /></SelectTrigger>
                <SelectContent>{classList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>বিষয়</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                <SelectTrigger><SelectValue placeholder="বিষয় নির্বাচন" /></SelectTrigger>
                <SelectContent>{filteredSubjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>মেটা</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ভাষা</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bangla">বাংলা</SelectItem>
                  <SelectItem value="english">ইংরেজি</SelectItem>
                  <SelectItem value="both">উভয়</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>কঠিনতা</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">বিগিনার</SelectItem>
                  <SelectItem value="intermediate">ইন্টারমিডিয়েট</SelectItem>
                  <SelectItem value="advanced">এডভান্সড</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>মেয়াদ (দিন)</Label><Input type="number" value={duration || ''} onChange={e => setDuration(e.target.value ? Number(e.target.value) : null)} /></div>
            <div className="flex items-center gap-4"><Switch checked={hasCertificate} onCheckedChange={setHasCertificate} /><Label>সার্টিফিকেট</Label></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>কোর্স ফিচার</CardTitle></CardHeader>
          <CardContent><Textarea value={features} onChange={e => setFeatures(e.target.value)} className="min-h-[120px] font-mono text-sm" placeholder="HTML ফরম্যাটে কোর্সের বৈশিষ্ট্য লিখুন" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>প্রয়োজনীয়তা</CardTitle></CardHeader>
          <CardContent><Textarea value={requirements} onChange={e => setRequirements(e.target.value)} className="min-h-[120px] font-mono text-sm" placeholder="HTML ফরম্যাটে পূর্বশর্ত লিখুন" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>টার্গেট স্টুডেন্ট</CardTitle></CardHeader>
          <CardContent><Textarea value={targetStudents} onChange={e => setTargetStudents(e.target.value)} className="min-h-[120px] font-mono text-sm" placeholder="HTML ফরম্যাটে টার্গেট স্টুডেন্ট লিখুন" /></CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  )
}
