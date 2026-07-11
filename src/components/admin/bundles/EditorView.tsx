import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ArrowLeft, Check, ChevronRight, Edit, Save, Sparkles, X } from 'lucide-react'
import React from 'react'
import StepBundleInfo, { type StepBundleInfoProps } from './StepBundleInfo'
import StepAddContent, { type StepAddContentProps } from './StepAddContent'
import StepPricing, { type StepPricingProps } from './StepPricing'

const steps = [
  { id: 1, label: 'বান্ডেল তথ্য', description: 'নাম, বিবরণ, ধরন' },
  { id: 2, label: 'কন্টেন্ট যোগ', description: 'কন্টেন্ট আইটেম বাছাই' },
  { id: 3, label: 'মূল্য ও প্রকাশ', description: 'মূল্য নির্ধারণ ও প্রকাশ' },
]

export interface EditorViewProps {
  editId: string | null
  saving: boolean
  handleSave: () => void
  setViewMode: (mode: 'list' | 'editor') => void
  resetForm: () => void
  currentStep: number
  setCurrentStep: (step: number) => void
  stepBundleInfoProps: StepBundleInfoProps
  stepAddContentProps: StepAddContentProps
  stepPricingProps: StepPricingProps
}

export default function EditorView({
  editId, saving, handleSave, setViewMode, resetForm,
  currentStep, setCurrentStep,
  stepBundleInfoProps, stepAddContentProps, stepPricingProps,
}: EditorViewProps) {
  return (
    <div
      className="space-y-0"
    >
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-1 px-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => { setViewMode('list'); resetForm() }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ফিরে যান</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {editId ? (
                <><Edit className="h-5 w-5 text-amber-600" /> বান্ডেল সম্পাদনা</>
              ) : (
                <><Sparkles className="h-5 w-5 text-amber-600" /> নতুন বান্ডেল যোগ করুন</>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              কন্টেন্ট আইটেম একত্রিত করে বান্ডেল তৈরি করুন
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setViewMode('list'); resetForm() }}>
            <X className="h-4 w-4" /> বাতিল
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md shadow-amber-600/20"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> সংরক্ষণ হচ্ছে...</>
            ) : (
              <><Save className="h-4 w-4" /> {editId ? 'আপডেট' : 'তৈরি করুন'}</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          return (
            <React.Fragment key={step.id}>
              {idx > 0 && (
                <div className={cn(
                  'flex-1 h-0.5 transition-colors',
                  currentStep > step.id ? 'bg-emerald-400' : 'bg-border/50'
                )} />
              )}
              <button
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0',
                  isActive && 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
                  isCompleted && 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
                  !isActive && !isCompleted && 'text-muted-foreground hover:bg-muted/50',
                )}
              >
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                  isActive && 'bg-amber-500 text-white',
                  isCompleted && 'bg-emerald-500 text-white',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                )}>
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {currentStep === 1 && <div><StepBundleInfo {...stepBundleInfoProps} /></div>}
      {currentStep === 2 && <div><StepAddContent {...stepAddContentProps} /></div>}
      {currentStep === 3 && <div><StepPricing {...stepPricingProps} /></div>}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4" /> আগের ধাপ
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          ধাপ {currentStep} / {steps.length}
        </div>
        {currentStep < steps.length ? (
          <Button
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
          >
            পরের ধাপ <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : <><Save className="h-4 w-4" /> সংরক্ষণ করুন</>}
          </Button>
        )}
      </div>
    </div>
  )
}
