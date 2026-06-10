'use client'

import React from 'react'
import { ArrowLeft, Plus, Loader2, BookOpen, FileQuestion, Eye, EyeOff, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import ImageUploader from '@/components/ui/image-uploader'

const bengaliLabels = ['ক', 'খ', 'গ', 'ঘ']

interface TypedQuestionData {
  typedUddeepok: string
  typedUddeepokImage: string
  typedQuestion1: string
  typedQuestion1Image: string
  typedQuestion2: string
  typedQuestion2Image: string
  typedQuestion3: string
  typedQuestion3Image: string
  typedQuestion4: string
  typedQuestion4Image: string
  subMarks: number[]
}

interface CQQuestionCreatePageProps {
  onBack: () => void
  saving: boolean
  editData?: {
    id: string
    typedUddeepok: string
    typedUddeepokImage: string
    typedQuestion1: string
    typedQuestion1Image: string
    typedQuestion2: string
    typedQuestion2Image: string
    typedQuestion3: string
    typedQuestion3Image: string
    typedQuestion4: string
    typedQuestion4Image: string
    subMarks: number[]
  } | null
  onCreateQuestion: (data: TypedQuestionData) => void
  onUpdateQuestion?: (data: TypedQuestionData & { questionId: string }) => Promise<boolean | void>
}

export function CQQuestionCreatePage({
  onBack, saving, editData, onCreateQuestion, onUpdateQuestion,
}: CQQuestionCreatePageProps) {
  const isEditing = !!editData
  const [hasStimulus, setHasStimulus] = React.useState(
    isEditing ? !!editData?.typedUddeepok : true
  )
  const [stimulusText, setStimulusText] = React.useState(editData?.typedUddeepok || '')
  const [stimulusImage, setStimulusImage] = React.useState(editData?.typedUddeepokImage || '')
  const [questions, setQuestions] = React.useState<string[]>([
    editData?.typedQuestion1 || '',
    editData?.typedQuestion2 || '',
    editData?.typedQuestion3 || '',
    editData?.typedQuestion4 || '',
  ])
  const [questionImages, setQuestionImages] = React.useState<string[]>([
    editData?.typedQuestion1Image || '',
    editData?.typedQuestion2Image || '',
    editData?.typedQuestion3Image || '',
    editData?.typedQuestion4Image || '',
  ])
  const [marks, setMarks] = React.useState<string[]>(
    isEditing && editData?.subMarks?.length === 4
      ? editData.subMarks.map(String)
      : ['1', '2', '3', '4']
  )
  const [showPreview, setShowPreview] = React.useState(false)

  const handleSubmit = () => {
    if (!questions[0].trim()) return

    const parsedMarks = marks.map((m) => {
      const n = parseFloat(m)
      return isNaN(n) || n < 0 ? 0 : n
    })

    const data: TypedQuestionData = {
      typedUddeepok: hasStimulus ? stimulusText : '',
      typedUddeepokImage: hasStimulus ? stimulusImage : '',
      typedQuestion1: questions[0],
      typedQuestion1Image: questionImages[0],
      typedQuestion2: questions[1],
      typedQuestion2Image: questionImages[1],
      typedQuestion3: questions[2],
      typedQuestion3Image: questionImages[2],
      typedQuestion4: questions[3],
      typedQuestion4Image: questionImages[3],
      subMarks: parsedMarks,
    }

    if (isEditing && onUpdateQuestion && editData) {
      onUpdateQuestion({ ...data, questionId: editData.id })
    } else {
      onCreateQuestion(data)
    }
  }

  const isValid = questions[0].trim().length > 0
  const totalMarks = marks.reduce((s, m) => s + (parseFloat(m) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{isEditing ? 'প্রশ্ন সম্পাদনা করুন' : 'নতুন CQ প্রশ্ন তৈরি করুন'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? 'প্রশ্নের বিষয়বস্তু ও নম্বর সম্পাদনা করুন।' : 'সরাসরি প্রশ্ন টাইপ করে সেটে যোগ করুন। $...$ বা $$...$$ ব্যবহার করে গণিতের সূত্র লিখুন।'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 flex-1">
                  <BookOpen className="h-4 w-4 text-sky-600" />
                  <Label htmlFor="has-stimulus-page" className="text-sm font-medium cursor-pointer">
                    উদ্দীপক (Stimulus) সহ
                  </Label>
                </div>
                <Switch
                  id="has-stimulus-page"
                  checked={hasStimulus}
                  onCheckedChange={setHasStimulus}
                />
              </div>

              {hasStimulus && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-sky-700 dark:text-sky-400">
                      উদ্দীপক লিখুন
                    </Label>
                    {stimulusText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 text-xs"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showPreview ? 'প্রিভিউ বন্ধ' : 'প্রিভিউ দেখুন'}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="উদ্দীপক (Stimulus) টেক্সট লিখুন। গণিতের জন্য $...$ বা $$...$$ ব্যবহার করুন..."
                    value={stimulusText}
                    onChange={(e) => setStimulusText(e.target.value)}
                    rows={5}
                    className="text-base font-mono text-sm"
                  />
                  {showPreview && stimulusText && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <RichContentRenderer content={stimulusText} className="text-sm leading-relaxed" />
                    </div>
                  )}
                  <ImageUploader
                    value={stimulusImage}
                    onChange={setStimulusImage}
                    label="উদ্দীপকের ছবি (ঐচ্ছিক)"
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">প্রশ্ন ও নম্বর</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPreview ? 'প্রিভিউ বন্ধ' : 'সব প্রিভিউ দেখুন'}
                </Button>
              </div>

              {questions.map((q, i) => (
                <div key={i} className="space-y-2 p-4 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center size-7 rounded-full bg-emerald-500 text-white font-bold text-xs shrink-0">
                      {bengaliLabels[i]}
                    </span>
                    <span className="text-sm font-medium">প্রশ্ন {bengaliLabels[i]}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">নম্বর:</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={marks[i]}
                        onChange={(e) => {
                          const newMarks = [...marks]
                          newMarks[i] = e.target.value
                          setMarks(newMarks)
                        }}
                        className="w-20 h-8 text-sm text-center"
                      />
                    </div>
                  </div>
                  <Textarea
                    placeholder={`প্রশ্ন ${bengaliLabels[i]} লিখুন। গণিতের জন্য $...$ বা $$...$$ ব্যবহার করুন...`}
                    value={q}
                    onChange={(e) => {
                      const newQ = [...questions]
                      newQ[i] = e.target.value
                      setQuestions(newQ)
                    }}
                    rows={3}
                    className="text-sm font-mono"
                  />
                  {showPreview && q.trim() && (
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <RichContentRenderer content={q} className="text-sm" />
                    </div>
                  )}
                  <ImageUploader
                    value={questionImages[i]}
                    onChange={(url) => {
                      const newImgs = [...questionImages]
                      newImgs[i] = url
                      setQuestionImages(newImgs)
                    }}
                    label="প্রশ্নের ছবি (ঐচ্ছিক)"
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/50 lg:sticky lg:top-32">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">সারসংক্ষেপ</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">উদ্দীপক:</span>
                  <Badge variant={hasStimulus ? 'default' : 'secondary'} className="text-xs">
                    {hasStimulus ? 'সহ' : 'ছাড়া'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">প্রশ্ন:</span>
                  <span className="font-medium">{questions.filter(q => q.trim()).length}/4</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">মোট নম্বর:</span>
                  <span className="font-bold text-emerald-600">{totalMarks}</span>
                </div>
              </div>

              {isValid && questions.filter(q => q.trim()).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">প্রতি প্রশ্নের নম্বর:</p>
                  {bengaliLabels.map((label, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{label}:</span>
                      <span className="font-medium">{questions[i]?.trim() ? marks[i] || '0' : '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  <strong>গণিতের সূত্র:</strong> $...$ (ইনলাইন) বা $$...$$ (ডিসপ্লে) ব্যবহার করে LaTeX লিখুন।
                </p>
                <p className="text-xs text-muted-foreground">
                  যেমন: <code className="bg-muted px-1 rounded">$x^2 + y^2 = z^2$</code>
                </p>
              </div>

              <Button
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={!isValid || saving}
                size="lg"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? (isEditing ? 'সংরক্ষণ হচ্ছে...' : 'তৈরি হচ্ছে...') : (isEditing ? 'সংরক্ষণ করুন' : 'প্রশ্ন তৈরি করুন')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
