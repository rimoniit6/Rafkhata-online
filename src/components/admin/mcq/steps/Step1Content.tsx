'use client'

import ImageUploader from '@/components/ui/image-uploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FileQuestion, Sigma, Sparkles, CheckCircle2 } from 'lucide-react'
import type { MCQFormData } from '../types'

interface Step1Props {
  form: MCQFormData
  updateForm: (field: string, value: string | boolean) => void
  currentStep: number
}

export default function Step1Content({ form, updateForm, currentStep }: Step1Props) {
  return (
    <div className="space-y-6">
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-emerald-600" />
            প্রশ্ন
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                প্রশ্নের টেক্সট <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sigma className="h-3.5 w-3.5" />
                $...$ দিয়ে ম্যাথ লিখুন
              </div>
            </div>
            <Textarea
              placeholder="প্রশ্ন লিখুন... ম্যাথের জন্য $x^2$ ব্যবহার করুন"
              value={form.question}
              onChange={(e) => updateForm('question', e.target.value)}
              rows={4}
              className={cn("text-base resize-y", !form.question.trim() && currentStep === 1 && form.question !== '' ? "border-red-400 focus:border-red-500" : "")}
            />
            {!form.question.trim() && currentStep === 1 && form.question !== '' && (
              <p className="text-xs text-red-500">প্রশ্নের টেক্সট আবশ্যক</p>
            )}
          </div>
          <ImageUploader
            value={form.questionImage}
            onChange={(url) => updateForm('questionImage', url)}
            label="প্রশ্নের ছবি (ঐচ্ছিক)"
            placeholder="প্রশ্নের ছবি আপলোড করুন"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-purple-600 text-white text-xs font-bold">
              ?
            </span>
            অপশন এ-ডি
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => (
              <div
                key={opt}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  form.correctAnswer === opt
                    ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20'
                    : 'border-border/50 bg-card'
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold',
                      form.correctAnswer === opt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {opt}
                  </div>
                  <Label className="text-sm font-medium flex-1">
                    অপশন {opt} <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => updateForm('correctAnswer', opt)}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors',
                      form.correctAnswer === opt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    সঠিক
                  </button>
                </div>
                <Input
                  placeholder={`অপশন ${opt} লিখুন...`}
                  value={form[`option${opt}` as keyof typeof form] as string}
                  onChange={(e) => updateForm(`option${opt}`, e.target.value)}
                  className={cn("mb-3", !form[`option${opt}` as keyof typeof form]?.toString().trim() && currentStep === 1 && form[`option${opt}` as keyof typeof form] !== '' ? "border-red-400 focus:border-red-500" : "")}
                />
                <ImageUploader
                  value={form[`option${opt}Image` as keyof typeof form] as string}
                  onChange={(url) => updateForm(`option${opt}Image`, url)}
                  placeholder="ছবি (ঐচ্ছিক)"
                />
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Label className="text-sm font-medium mb-2 block">
              সঠিক উত্তর নির্বাচন <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={form.correctAnswer}
              onValueChange={(v) => updateForm('correctAnswer', v)}
              className="flex gap-3"
            >
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`ans-${opt}`} />
                  <Label htmlFor={`ans-${opt}`} className="cursor-pointer font-medium">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            ব্যাখ্যা
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">ব্যাখ্যার টেক্সট (ঐচ্ছিক)</Label>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sigma className="h-3.5 w-3.5" />
                $...$ ম্যাথ
              </div>
            </div>
            <Textarea
              placeholder="ব্যাখ্যা লিখুন... ম্যাথের জন্য $...$ ব্যবহার করুন"
              value={form.explanation}
              onChange={(e) => updateForm('explanation', e.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>
          <ImageUploader
            value={form.explanationImage}
            onChange={(url) => updateForm('explanationImage', url)}
            label="ব্যাখ্যার ছবি (ঐচ্ছিক)"
            placeholder="ব্যাখ্যার ছবি আপলোড করুন"
          />
        </CardContent>
      </Card>
    </div>
  )
}
