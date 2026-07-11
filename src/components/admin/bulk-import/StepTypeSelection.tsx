import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { AlignLeft, CheckCircle2, FileQuestion, Info, Layers } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'

export function StepTypeSelection({
  importType,
  setImportType,
  isBoard,
  setIsBoard,
  setResult,
}: {
  importType: 'mcq' | 'cq'
  setImportType: (v: 'mcq' | 'cq') => void
  isBoard: boolean
  setIsBoard: (v: boolean) => void
  setResult: (v: null) => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">প্রশ্নের ধরন নির্বাচন করুন</CardTitle>
          <CardDescription>আপনি কোন ধরনের প্রশ্ন ইম্পোর্ট করতে চান?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setImportType('mcq')}
              className={cn(
                'relative p-6 rounded-xl border-2 text-left transition-all group',
                importType === 'mcq'
                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-md shadow-emerald-100 dark:shadow-emerald-950/50'
                  : 'border-border hover:border-emerald-300 hover:bg-emerald-50/30'
              )}
            >
              {importType === 'mcq' && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all',
                  importType === 'mcq'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900'
                    : 'bg-muted text-muted-foreground group-hover:bg-emerald-100 group-hover:text-emerald-700'
                )}>
                  <FileQuestion className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">MCQ</h3>
                  <p className="text-xs text-muted-foreground">বহুনির্বাচনী প্রশ্ন</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ৪টি অপশন সহ বহুনির্বাচনী প্রশ্ন। প্রশ্ন, অপশন A-D, সঠিক উত্তর আবশ্যক।
              </p>
            </button>

            <button
              type="button"
              onClick={() => setImportType('cq')}
              className={cn(
                'relative p-6 rounded-xl border-2 text-left transition-all group',
                importType === 'cq'
                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-md shadow-emerald-100 dark:shadow-emerald-950/50'
                  : 'border-border hover:border-emerald-300 hover:bg-emerald-50/30'
              )}
            >
              {importType === 'cq' && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all',
                  importType === 'cq'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900'
                    : 'bg-muted text-muted-foreground group-hover:bg-emerald-100 group-hover:text-emerald-700'
                )}>
                  <AlignLeft className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">CQ</h3>
                  <p className="text-xs text-muted-foreground">সৃজনশীল প্রশ্ন</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                উদ্দীপক সহ সৃজনশীল প্রশ্ন। উদ্দীপক, প্রশ্ন ১ ও উত্তর ১ আবশ্যক।
              </p>
            </button>
          </div>

          <Separator />
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                isBoard ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-muted text-muted-foreground'
              )}>
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">বোর্ড প্রশ্ন হিসেবে ইম্পোর্ট</p>
                <p className="text-xs text-muted-foreground">বোর্ড ও সাল নির্বাচন আবশ্যক হবে</p>
              </div>
            </div>
            <Switch
              checked={isBoard}
              onCheckedChange={(checked) => { setIsBoard(checked); setResult(null) }}
            />
          </div>

          <Card className="border-border/50 bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">কলাম ফরম্যাট:</p>
                  {importType === 'mcq' ? (
                    <div className="space-y-1">
                      <p><Badge variant="outline" className="text-[10px] mr-1 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">আবশ্যক</Badge> question, optionA, optionB, optionC, optionD, correctAnswer</p>
                      <p><Badge variant="outline" className="text-[10px] mr-1">ঐচ্ছিক</Badge> explanation, topic, isPremium, price</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p><Badge variant="outline" className="text-[10px] mr-1 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">আবশ্যক</Badge> uddeepok, question1, answer1</p>
                      <p><Badge variant="outline" className="text-[10px] mr-1">ঐচ্ছিক</Badge> question2-4, answer2-4, topic, isPremium, price</p>
                    </div>
                  )}
                  <p>সঠিক উত্তর: A/B/C/D অথবা ক/খ/গ/ঘ ব্যবহার করুন</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
