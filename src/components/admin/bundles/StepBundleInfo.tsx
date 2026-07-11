import { Card, CardContent } from '@/components/ui/card'
import ImageUploader from '@/components/ui/image-uploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Textarea } from '@/components/ui/textarea'
import { Package } from 'lucide-react'

export interface StepBundleInfoProps {
  formTitle: string
  setFormTitle: (v: string) => void
  formDescription: string
  setFormDescription: (v: string) => void
  formThumbnail: string
  setFormThumbnail: (v: string) => void
  formType: string[]
  setFormType: (v: string[]) => void
  formClassLevel: string[]
  setFormClassLevel: (v: string[]) => void
  formBoard: string[]
  setFormBoard: (v: string[]) => void
  formYear: string[]
  setFormYear: (v: string[]) => void
  classOptions: { label: string; value: string }[]
  boardOptions: { label: string; value: string }[]
  yearOptions: { label: string; value: string }[]
}

export default function StepBundleInfo({
  formTitle, setFormTitle,
  formDescription, setFormDescription,
  formThumbnail, setFormThumbnail,
  formType, setFormType,
  formClassLevel, setFormClassLevel,
  formBoard, setFormBoard,
  formYear, setFormYear,
  classOptions, boardOptions, yearOptions,
}: StepBundleInfoProps) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-emerald-600" /> বান্ডেলের মৌলিক তথ্য
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">বান্ডেলের নাম, বিবরণ, ধরন ও শ্রেণি নির্ধারণ করুন</p>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>শিরোনাম *</Label>
          <Input
            placeholder="যেমন: এসএসসি গণিত কমপ্লিট বান্ডেল"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>বিবরণ</Label>
          <Textarea
            placeholder="বান্ডেলের বিবরণ লিখুন..."
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
          />
        </div>

        <ImageUploader
          value={formThumbnail}
          onChange={setFormThumbnail}
          label="থাম্বনেইল"
          placeholder="বান্ডেলের থাম্বনেইল ছবি আপলোড করুন"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>ধরন *</Label>
            <MultiSelect
              options={[
                { label: 'MCQ', value: 'mcq' },
                { label: 'CQ', value: 'cq' },
                { label: 'লেকচার', value: 'lecture' },
                { label: 'বোর্ড', value: 'board' },
                { label: 'মিশ্র', value: 'mixed' },
              ]}
              selectedValues={formType}
              onChange={setFormType}
              placeholder="ধরন নির্বাচন"
            />
          </div>
          <div className="space-y-2">
            <Label>শ্রেণি</Label>
            <MultiSelect
              options={classOptions.map(c => ({ label: c.label, value: c.value }))}
              selectedValues={formClassLevel}
              onChange={setFormClassLevel}
              placeholder="শ্রেণি নির্বাচন"
            />
          </div>
          <div className="space-y-2">
            <Label>বোর্ড</Label>
            <MultiSelect
              options={boardOptions.map(b => ({ label: b.label, value: b.value }))}
              selectedValues={formBoard}
              onChange={setFormBoard}
              placeholder="বোর্ড নির্বাচন"
            />
          </div>
          <div className="space-y-2">
            <Label>সাল</Label>
            <MultiSelect
              options={yearOptions.map(y => ({ label: y.label, value: y.value }))}
              selectedValues={formYear}
              onChange={setFormYear}
              placeholder="সাল নির্বাচন"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
