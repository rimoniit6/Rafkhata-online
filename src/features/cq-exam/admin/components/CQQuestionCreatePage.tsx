'use client'

import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import ImageUploader from '@/components/ui/image-uploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AlignLeft,ArrowLeft,BookOpen,ListChecks,Loader2,PenTool,Plus,Trash2 } from 'lucide-react'
import React from 'react'

const bengaliLabels = ['ক', 'খ', 'গ', 'ঘ']

const QUESTION_TYPES = [
  { value: 'typed', label: 'CQ (টাইপকৃত)', icon: BookOpen },
  { value: 'mcq-single', label: 'MCQ (একক উত্তর)', icon: ListChecks },
  { value: 'mcq-multiple', label: 'MCQ (একাধিক উত্তর)', icon: ListChecks },
  { value: 'fill-blanks', label: 'শূন্যস্থান পূরণ', icon: AlignLeft },
  { value: 'written', label: 'রচনামূলক প্রশ্ন', icon: PenTool },
]

interface NonCQEditData {
  id: string
  type: string
  stem: string
  stemImage: string
  config: Record<string, unknown>
  marks: number
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
  } | NonCQEditData | null
  onCreateQuestion: (data: any) => void
  onUpdateQuestion?: (data: any & { questionId: string }) => Promise<boolean | void>
}

function isTypedEditData(d: any): d is { id: string; typedUddeepok: string; typedQuestion1: string; subMarks: number[] } {
  return d && 'typedQuestion1' in d
}

export function CQQuestionCreatePage({
  onBack, saving, editData, onCreateQuestion, onUpdateQuestion,
}: CQQuestionCreatePageProps) {
  const isEditing = !!editData
  const existingType = isEditing
    ? (isTypedEditData(editData) ? 'typed' : (editData as NonCQEditData).type || 'typed')
    : 'typed'

  const [questionType, setQuestionType] = React.useState(existingType)
  const [_showPreview, _setShowPreview] = React.useState(false)

  // Typed question state
  const [hasStimulus, setHasStimulus] = React.useState(
    isEditing && isTypedEditData(editData) ? !!editData.typedUddeepok : true
  )
  const [stimulusText, setStimulusText] = React.useState(
    isEditing && isTypedEditData(editData) ? editData.typedUddeepok : ''
  )
  const [stimulusImage, setStimulusImage] = React.useState(
    isEditing && isTypedEditData(editData) ? editData.typedUddeepokImage || '' : ''
  )
  const [questions, setQuestions] = React.useState<string[]>(() => {
    if (isEditing && isTypedEditData(editData)) {
      return [editData.typedQuestion1, editData.typedQuestion2, editData.typedQuestion3, editData.typedQuestion4]
    }
    return ['', '', '', '']
  })
  const [questionImages, setQuestionImages] = React.useState<string[]>(() => {
    if (isEditing && isTypedEditData(editData)) {
      return [editData.typedQuestion1Image || '', editData.typedQuestion2Image || '', editData.typedQuestion3Image || '', editData.typedQuestion4Image || '']
    }
    return ['', '', '', '']
  })
  const [marks, setMarks] = React.useState<string[]>(() => {
    if (isEditing && isTypedEditData(editData) && editData.subMarks?.length === 4) {
      return editData.subMarks.map(String)
    }
    return ['1', '2', '3', '4']
  })

  // Non-CQ question state
  const initEdit = isEditing && !isTypedEditData(editData) ? editData as NonCQEditData : null
  const initConfig = initEdit ? (initEdit.config || {}) : {}
  const [stem, setStem] = React.useState(initEdit?.stem || '')
  const [stemImageUrl, setStemImageUrl] = React.useState(initEdit?.stemImage || '')
  const [mcqOptions, setMcqOptions] = React.useState<string[]>((initConfig.options as string[]) || ['', ''])
  const [mcqMarks, setMcqMarks] = React.useState(String(initEdit?.marks || 1))
  const [blanks, setBlanks] = React.useState<{ id: string; answer: string; marks: number }[]>(
    (initConfig.blanks as { id: string; answer: string; marks: number }[]) || [{ id: 'b1', answer: '', marks: 1 }]
  )

  // For non-CQ question edit — prevent switching type
  React.useEffect(() => {
    if (isEditing && !isTypedEditData(editData)) {
      setQuestionType((editData as NonCQEditData).type || 'mcq-single')
    }
  }, [editData, isEditing])

  const addMcqOption = () => setMcqOptions(prev => [...prev, ''])
  const removeMcqOption = (i: number) => setMcqOptions(prev => prev.filter((_, idx) => idx !== i))

  const addBlank = () => {
    const id = `b${Date.now()}`
    setBlanks(prev => [...prev, { id, answer: '', marks: 1 }])
  }
  const removeBlank = (i: number) => setBlanks(prev => prev.filter((_, idx) => idx !== i))
  const updateBlank = (i: number, field: string, value: string | number) => {
    setBlanks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b))
  }

  const validate = (): boolean => {
    if (questionType === 'typed') return questions[0].trim().length > 0
    if (questionType === 'mcq-single' || questionType === 'mcq-multiple') {
      return stem.trim().length > 0 && mcqOptions.some(o => o.trim())
    }
    if (questionType === 'fill-blanks') return stem.trim().length > 0 && blanks.some(b => b.answer.trim())
    if (questionType === 'written') return stem.trim().length > 0
    return false
  }

  const handleSubmit = () => {
    if (!validate()) return

    if (questionType === 'typed') {
      const parsedMarks = marks.map((m) => {
        const n = parseFloat(m)
        return isNaN(n) || n < 0 ? 0 : n
      })
      const data = {
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
        onUpdateQuestion({ ...data, questionId: (editData as any).id })
      } else {
        onCreateQuestion(data)
      }
      return
    }

    // Non-CQ question
    let config: Record<string, unknown> = {}
    let totalMarks = parseFloat(mcqMarks) || 1
    if (questionType === 'mcq-single' || questionType === 'mcq-multiple') {
      const validOptions = mcqOptions.filter(o => o.trim())
      config = { options: validOptions }
      totalMarks = parseFloat(mcqMarks) || 1
    }
    if (questionType === 'fill-blanks') {
      const validBlanks = blanks.filter(b => b.answer.trim()).map(b => ({ id: b.id, answer: b.answer, marks: b.marks || 1 }))
      config = { blanks: validBlanks }
      totalMarks = validBlanks.reduce((s, b) => s + (b.marks || 1), 0) || 1
    }

    const data = { questionType, stem, stemImage: stemImageUrl, config, marks: totalMarks }
    if (isEditing && onUpdateQuestion && editData) {
      onUpdateQuestion({ ...data, questionId: (editData as any).id })
    } else {
      onCreateQuestion(data)
    }
  }

  const isValid = validate()
  const totalMarks = questionType === 'typed'
    ? marks.reduce((s, m) => s + (parseFloat(m) || 0), 0)
    : questionType === 'fill-blanks'
      ? blanks.filter(b => b.answer.trim()).reduce((s, b) => s + (b.marks || 1), 0) || 1
      : parseFloat(mcqMarks) || 1

  const getInstructionText = () => {
    switch (questionType) {
      case 'typed': return 'সরাসরি প্রশ্ন টাইপ করে সেটে যোগ করুন। $...$ বা $$...$$ ব্যবহার করে গণিতের সূত্র লিখুন।'
      case 'mcq-single':
      case 'mcq-multiple': return 'প্রশ্নের স্টেম এবং অপশনগুলি লিখুন।'
      case 'fill-blanks': return 'প্রশ্নের স্টেম লিখুন এবং শূন্যস্থানগুলির উত্তর দিন।'
      case 'written': return 'রচনামূলক প্রশ্নের স্টেম লিখুন।'
      default: return ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{isEditing ? 'প্রশ্ন সম্পাদনা করুন' : 'নতুন প্রশ্ন তৈরি করুন'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{getInstructionText()}</p>
        </div>
      </div>

      {/* Question type selector — only show when creating, not editing */}
      {!isEditing && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <Label className="text-sm font-semibold mb-3 block">প্রশ্নের ধরন নির্বাচন করুন</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {QUESTION_TYPES.map(qt => {
                const Icon = qt.icon
                return (
                  <button
                    key={qt.value}
                    type="button"
                    onClick={() => setQuestionType(qt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-all',
                      questionType === qt.value
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-700 text-emerald-700'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="text-xs font-medium text-center">{qt.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────── Typed CQ Form ─────── */}
      {questionType === 'typed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <BookOpen className="h-4 w-4 text-sky-600" />
                  <Label className="text-sm font-medium cursor-pointer" onClick={() => setHasStimulus(!hasStimulus)}>
                    উদ্দীপক (Stimulus) সহ
                  </Label>
                  <input type="checkbox" checked={hasStimulus} onChange={() => setHasStimulus(!hasStimulus)} className="ml-auto" />
                </div>
                {hasStimulus && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-sky-700 dark:text-sky-400">উদ্দীপক লিখুন</Label>
                    <Textarea
                      placeholder="উদ্দীপক টেক্সট লিখুন..."
                      value={stimulusText}
                      onChange={(e) => setStimulusText(e.target.value)}
                      rows={5}
                      className="text-sm font-mono"
                    />
                    <ImageUploader value={stimulusImage} onChange={setStimulusImage} label="উদ্দীপকের ছবি (ঐচ্ছিক)" />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-5">
                <Label className="text-sm font-semibold">প্রশ্ন ও নম্বর</Label>
                {questions.map((q, i) => (
                  <div key={i} className="space-y-2 p-4 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center size-7 rounded-full bg-emerald-500 text-white font-bold text-xs">{bengaliLabels[i]}</span>
                      <span className="text-sm font-medium">প্রশ্ন {bengaliLabels[i]}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">নম্বর:</Label>
                        <Input type="number" min="0" step="0.5" value={marks[i]}
                          onChange={(e) => { const n = [...marks]; n[i] = e.target.value; setMarks(n) }}
                          className="w-20 h-8 text-sm text-center" />
                      </div>
                    </div>
                    <Textarea
                      placeholder={`প্রশ্ন ${bengaliLabels[i]} লিখুন...`}
                      value={q} onChange={(e) => { const n = [...questions]; n[i] = e.target.value; setQuestions(n) }}
                      rows={3} className="text-sm font-mono" />
                    <ImageUploader value={questionImages[i]}
                      onChange={(url) => { const n = [...questionImages]; n[i] = url; setQuestionImages(n) }}
                      label="প্রশ্নের ছবি (ঐচ্ছিক)" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="border-border/50 lg:sticky lg:top-32">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-sm">সারসংক্ষেপ</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">প্রশ্ন:</span>
                  <span>{questions.filter(q => q.trim()).length}/4</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>মোট নম্বর:</span>
                  <span className="text-emerald-600">{totalMarks}</span>
                </div>
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmit} disabled={!isValid || saving} size="lg">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'সংরক্ষণ হচ্ছে...' : (isEditing ? 'সংরক্ষণ করুন' : 'প্রশ্ন তৈরি করুন')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─────── MCQ (Single/Multiple) Form ─────── */}
      {(questionType === 'mcq-single' || questionType === 'mcq-multiple') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <Label className="text-sm font-semibold text-sky-700 dark:text-sky-400">প্রশ্ন (Stem)</Label>
                <Textarea
                  placeholder="প্রশ্নটি লিখুন..."
                  value={stem}
                  onChange={(e) => setStem(e.target.value)}
                  rows={4}
                  className="text-sm font-mono"
                />
                <ImageUploader value={stemImageUrl} onChange={setStemImageUrl} label="প্রশ্নের ছবি (ঐচ্ছিক)" />
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">অপশন সমূহ</Label>
                  <Button variant="outline" size="sm" onClick={addMcqOption} className="gap-1">
                    <Plus className="size-3" /> অপশন যোগ করুন
                  </Button>
                </div>
                {mcqOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const n = [...mcqOptions]
                        n[i] = e.target.value
                        setMcqOptions(n)
                      }}
                      placeholder={`অপশন ${i + 1}...`}
                      className="flex-1"
                    />
                    {mcqOptions.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0" onClick={() => removeMcqOption(i)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
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
                    <span className="text-muted-foreground">ধরন:</span>
                    <span>{questionType === 'mcq-single' ? 'একক উত্তর' : 'একাধিক উত্তর'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">অপশন:</span>
                    <span>{mcqOptions.filter(o => o.trim()).length}টি</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">মোট নম্বর:</Label>
                    <Input type="number" min="0" step="0.5" value={mcqMarks}
                      onChange={(e) => setMcqMarks(e.target.value)}
                      className="h-8 text-sm text-center" />
                  </div>
                </div>
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmit} disabled={!isValid || saving} size="lg">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'সংরক্ষণ হচ্ছে...' : (isEditing ? 'সংরক্ষণ করুন' : 'প্রশ্ন তৈরি করুন')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─────── Fill Blanks Form ─────── */}
      {questionType === 'fill-blanks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <Label className="text-sm font-semibold text-sky-700 dark:text-sky-400">প্রশ্ন (Stem)</Label>
                <Textarea
                  placeholder="প্রশ্নটি লিখুন যেখানে শূন্যস্থান থাকবে..."
                  value={stem}
                  onChange={(e) => setStem(e.target.value)}
                  rows={4}
                  className="text-sm font-mono"
                />
                <ImageUploader value={stemImageUrl} onChange={setStemImageUrl} label="প্রশ্নের ছবি (ঐচ্ছিক)" />
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">শূন্যস্থান সমূহ</Label>
                  <Button variant="outline" size="sm" onClick={addBlank} className="gap-1">
                    <Plus className="size-3" /> শূন্যস্থান যোগ করুন
                  </Button>
                </div>
                {blanks.map((blank, i) => (
                  <div key={blank.id} className="flex items-center gap-2 p-3 rounded-lg border">
                    <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                    <Input
                      value={blank.answer}
                      onChange={(e) => updateBlank(i, 'answer', e.target.value)}
                      placeholder={`সঠিক উত্তর ${i + 1}...`}
                      className="flex-1"
                    />
                    <Label className="text-xs text-muted-foreground shrink-0">নম্বর:</Label>
                    <Input type="number" min="0" step="0.5" value={blank.marks}
                      onChange={(e) => updateBlank(i, 'marks', parseFloat(e.target.value) || 0)}
                      className="w-16 h-8 text-sm text-center" />
                    {blanks.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0" onClick={() => removeBlank(i)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="border-border/50 lg:sticky lg:top-32">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-sm">সারসংক্ষেপ</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">শূন্যস্থান:</span>
                  <span>{blanks.filter(b => b.answer.trim()).length}টি</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>মোট নম্বর:</span>
                  <span className="text-emerald-600">{totalMarks}</span>
                </div>
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmit} disabled={!isValid || saving} size="lg">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'সংরক্ষণ হচ্ছে...' : (isEditing ? 'সংরক্ষণ করুন' : 'প্রশ্ন তৈরি করুন')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─────── Written Form ─────── */}
      {questionType === 'written' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <Label className="text-sm font-semibold text-sky-700 dark:text-sky-400">প্রশ্ন (Stem)</Label>
                <Textarea
                  placeholder="রচনামূলক প্রশ্নটি লিখুন..."
                  value={stem}
                  onChange={(e) => setStem(e.target.value)}
                  rows={5}
                  className="text-sm font-mono"
                />
                <ImageUploader value={stemImageUrl} onChange={setStemImageUrl} label="প্রশ্নের ছবি (ঐচ্ছিক)" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="border-border/50 lg:sticky lg:top-32">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-sm">সারসংক্ষেপ</h3>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">মোট নম্বর:</Label>
                  <Input type="number" min="0" step="0.5" value={mcqMarks}
                    onChange={(e) => setMcqMarks(e.target.value)}
                    className="h-8 text-sm text-center" />
                </div>
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmit} disabled={!isValid || saving} size="lg">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'সংরক্ষণ হচ্ছে...' : (isEditing ? 'সংরক্ষণ করুন' : 'প্রশ্ন তৈরি করুন')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
