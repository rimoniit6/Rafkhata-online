import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImageUploader from '@/components/ui/image-uploader'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, Sigma } from 'lucide-react'
import React, { useState } from 'react'

export default function QAPairCard({
  number,
  question,
  questionImage,
  answer,
  answerImage,
  onQuestionChange,
  onQuestionImageChange,
  onAnswerChange,
  onAnswerImageChange,
}: {
  number: 1 | 2 | 3 | 4
  question: string
  questionImage: string
  answer: string
  answerImage: string
  onQuestionChange: (v: string) => void
  onQuestionImageChange: (v: string) => void
  onAnswerChange: (v: string) => void
  onAnswerImageChange: (v: string) => void
}) {
  const [open, setOpen] = useState(number === 1)
  const bengaliNums: Record<number, string> = { 1: '১', 2: '২', 3: '৩', 4: '৪' }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden border-2 hover:border-emerald-300 transition-colors">
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-950/40 dark:to-emerald-950/20">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm">
                  {bengaliNums[number]}
                </span>
                <div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    প্রশ্ন {bengaliNums[number]}
                  </span>
                  {question && (
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">
                      {question.substring(0, 60)}{question.length > 60 ? '...' : ''}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 sm:p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">প্রশ্ন {bengaliNums[number]}</Label>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sigma className="h-3 w-3" /> $...$ দিয়ে ম্যাথ লিখুন
                </span>
              </div>
              <Textarea
                placeholder={`প্রশ্ন ${bengaliNums[number]} লিখুন... (ম্যাথের জন্য $x^2$ ব্যবহার করুন)`}
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                rows={3}
                className="text-base min-h-[80px]"
              />
              <ImageUploader
                value={questionImage}
                onChange={onQuestionImageChange}
                placeholder={`প্রশ্ন ${bengaliNums[number]}-এর ছবি`}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-base font-semibold">উত্তর {bengaliNums[number]}</Label>
              <Textarea
                placeholder={`উত্তর ${bengaliNums[number]} লিখুন... (ম্যাথের জন্য $x^2$ ব্যবহার করুন)`}
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                rows={5}
                className="text-base min-h-[120px]"
              />
              <ImageUploader
                value={answerImage}
                onChange={onAnswerImageChange}
                placeholder={`উত্তর ${bengaliNums[number]}-এর ছবি`}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
