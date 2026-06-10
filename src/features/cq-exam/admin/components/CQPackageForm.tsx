'use client'

import { ArrowLeft, FileText, GraduationCap, BookOpen, Tag, Power, Loader2, Save, Crown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { MultiSelect } from '@/components/ui/multi-select'
import ImageUploader from '@/components/ui/image-uploader'

interface ClassCategory {
  id: string
  name: string
  slug: string
}

interface SubjectOption {
  id: string
  name: string
  slug: string
  classId: string
}

interface CQPackageFormProps {
  editId: string | null
  pkgTitle: string
  setPkgTitle: (v: string) => void
  pkgDescription: string
  setPkgDescription: (v: string) => void
  pkgThumbnail: string
  setPkgThumbnail: (v: string) => void
  pkgClassId: string
  onClassChange: (id: string) => void
  classes: ClassCategory[]
  pkgSubjectIds: string[]
  setPkgSubjectIds: (ids: string[]) => void
  subjects: SubjectOption[]
  pkgPrice: string
  setPkgPrice: (v: string) => void
  pkgOriginalPrice: string
  setPkgOriginalPrice: (v: string) => void
  pkgIsPremium: boolean
  setPkgIsPremium: (v: boolean) => void
  pkgIsActive: boolean
  setPkgIsActive: (v: boolean) => void
  pkgOrder: string
  setPkgOrder: (v: string) => void
  pkgStatus: string
  setPkgStatus: (v: string) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}

export function CQPackageForm({
  editId, pkgTitle, setPkgTitle, pkgDescription, setPkgDescription,
  pkgThumbnail, setPkgThumbnail, pkgClassId, onClassChange, classes,
  pkgSubjectIds, setPkgSubjectIds, subjects, pkgPrice, setPkgPrice,
  pkgOriginalPrice, setPkgOriginalPrice, pkgIsPremium, setPkgIsPremium,
  pkgIsActive, setPkgIsActive, pkgOrder, setPkgOrder, pkgStatus, setPkgStatus,
  saving, onSave, onCancel
}: CQPackageFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{editId ? 'CQ এক্সাম প্যাকেজ সম্পাদনা' : 'নতুন CQ এক্সাম প্যাকেজ'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">প্যাকেজের তথ্য পূরণ করুন</p>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" /> প্যাকেজের মৌলিক তথ্য
          </Label>
        </div>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>শিরোনাম *</Label>
            <Input
              placeholder="যেমন: SSC গণিত CQ মডেল টেস্ট"
              value={pkgTitle}
              onChange={(e) => setPkgTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>বিবরণ</Label>
            <Textarea
              placeholder="প্যাকেজের বিবরণ লিখুন..."
              value={pkgDescription}
              onChange={(e) => setPkgDescription(e.target.value)}
              rows={3}
            />
          </div>

          <ImageUploader
            value={pkgThumbnail}
            onChange={setPkgThumbnail}
            label="থাম্বনেইল"
            placeholder="প্যাকেজের থাম্বনেইল ছবি আপলোড করুন"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-emerald-600" /> শ্রেণি *
              </Label>
              <Select value={pkgClassId || '_none'} onValueChange={(v) => onClassChange(v === '_none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">নির্বাচন করুন</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">প্যাকেজ কোন শ্রেণির জন্য</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" /> বিষয়
              </Label>
              <MultiSelect
                options={subjects.map(s => ({ label: s.name, value: s.id }))}
                selectedValues={pkgSubjectIds}
                onChange={setPkgSubjectIds}
                placeholder="সকল বিষয়"
                disabled={!pkgClassId}
                searchPlaceholder="বিষয় খুঁজুন..."
              />
              <p className="text-xs text-muted-foreground">খালি রাখলে সকল বিষয়ের জন্য প্রযোজ্য হবে</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>স্ট্যাটাস</Label>
            <Select value={pkgStatus} onValueChange={setPkgStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">ড্রাফট</SelectItem>
                <SelectItem value="published">প্রকাশিত</SelectItem>
                <SelectItem value="archived">আর্কাইভ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" /> মূল্য নির্ধারণ
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>মূল্য (৳) *</Label>
                <Input
                  type="number"
                  placeholder="প্যাকেজের মূল্য"
                  value={pkgPrice}
                  onChange={(e) => setPkgPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>আসল মূল্য (৳)</Label>
                <Input
                  type="number"
                  placeholder="আসল মূল্য (ছাড়ের আগে)"
                  value={pkgOriginalPrice}
                  onChange={(e) => setPkgOriginalPrice(e.target.value)}
                />
              </div>
            </div>

            {parseFloat(pkgPrice) > 0 && parseFloat(pkgOriginalPrice) > parseFloat(pkgPrice) && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {Math.round(((parseFloat(pkgOriginalPrice) - parseFloat(pkgPrice)) / parseFloat(pkgOriginalPrice)) * 100)}% ছাড়!
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-50/60 to-amber-50/60 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200/30 dark:border-yellow-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/40">
                <Crown className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">প্রিমিয়াম প্যাকেজ</Label>
                <p className="text-xs text-muted-foreground">প্রিমিয়াম ব্যবহারকারীদের জন্য সংরক্ষিত</p>
              </div>
            </div>
            <Switch checked={pkgIsPremium} onCheckedChange={setPkgIsPremium} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Power className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">সক্রিয়</Label>
                <p className="text-xs text-muted-foreground">প্যাকেজ সক্রিয় বা নিষ্ক্রিয় করুন</p>
              </div>
            </div>
            <Switch checked={pkgIsActive} onCheckedChange={setPkgIsActive} />
          </div>

          <div className="space-y-2">
            <Label>ক্রম (Order)</Label>
            <Input
              type="number"
              placeholder="0"
              value={pkgOrder}
              onChange={(e) => setPkgOrder(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
            <Button variant="outline" onClick={onCancel}>বাতিল</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
