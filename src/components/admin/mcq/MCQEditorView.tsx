'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Edit, Save, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { emptyForm, STEPS } from './constants'
import type { ClassItem, SubjectItem, ChapterItem, MCQFormData, StepNumber } from './types'
import Step1Content from './steps/Step1Content'
import Step2Content from './steps/Step2Content'
import Step3Content from './steps/Step3Content'
import React from 'react'

interface MCQEditorViewProps {
  form: MCQFormData
  setForm: (v: MCQFormData | ((prev: MCQFormData) => MCQFormData)) => void
  editId: string | null
  saving: boolean
  currentStep: StepNumber
  setCurrentStep: (v: StepNumber) => void
  classes: ClassItem[]
  subjects: SubjectItem[]
  chapters: ChapterItem[]
  setSubjects: (v: SubjectItem[] | ((prev: SubjectItem[]) => SubjectItem[])) => void
  setChapters: (v: ChapterItem[] | ((prev: ChapterItem[]) => ChapterItem[])) => void
  formClassSlug: string
  boardOptions: { value: string; label: string }[]
  boardLabelMap: Record<string, string>
  setViewMode: (v: 'list' | 'editor') => void
  handleNext: () => void
  handlePrev: () => void
  saveMCQ: () => Promise<void>
  canGoNext: () => boolean
  updateForm: (field: string, value: string | boolean) => void
}

export default function MCQEditorView({
  form, setForm, editId, saving, currentStep, setCurrentStep,
  classes, subjects, chapters, setSubjects, setChapters,
  formClassSlug, boardOptions, boardLabelMap,
  setViewMode, handleNext, handlePrev, saveMCQ, canGoNext,
  updateForm,
}: MCQEditorViewProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-1 px-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setViewMode('list')
              setForm(emptyForm)
              setSubjects([])
              setChapters([])
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ফিরে যান</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {editId ? (
                <>
                  <Edit className="h-5 w-5 text-emerald-600" /> MCQ সম্পাদনা
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-emerald-600" /> নতুন MCQ যোগ করুন
                </>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentStep === 1 && 'প্রশ্ন ও অপশন লিখুন'}
              {currentStep === 2 && 'ক্লাস, বিষয় ও অধ্যায় নির্বাচন করুন'}
              {currentStep === 3 && 'প্রিভিউ দেখুন ও প্রকাশ করুন'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setViewMode('list')
              setForm(emptyForm)
              setSubjects([])
              setChapters([])
            }}
          >
            <X className="h-4 w-4" /> বাতিল
          </Button>
          {currentStep === 3 && (
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20"
              onClick={saveMCQ}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> {editId ? 'আপডেট' : 'প্রকাশ'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-0 mb-8">
        {STEPS.map((step, idx) => {
          const _StepIcon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (step.id <= currentStep) setCurrentStep(step.id as StepNumber)
                  }}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 shadow-sm'
                      : isCompleted
                        ? 'opacity-80 hover:opacity-100 cursor-pointer'
                        : 'opacity-40 cursor-default'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all duration-300',
                      isActive
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : isCompleted
                          ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium hidden sm:inline',
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-medium sm:hidden',
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.id}
                  </span>
                </button>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-6 sm:w-10 sm:w-16 h-0.5 mx-1 rounded-full transition-colors duration-300',
                    currentStep > step.id
                      ? 'bg-emerald-400'
                      : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {currentStep === 1 && <Step1Content form={form} updateForm={updateForm} currentStep={currentStep} />}
      {currentStep === 2 && (
        <Step2Content
          form={form}
          updateForm={updateForm}
          currentStep={currentStep}
          classes={classes}
          subjects={subjects}
          chapters={chapters}
          formClassSlug={formClassSlug}
          boardOptions={boardOptions}
        />
      )}
      {currentStep === 3 && (
        <Step3Content
          form={form}
          updateForm={updateForm}
          classes={classes}
          subjects={subjects}
          chapters={chapters}
          boardLabelMap={boardLabelMap}
          editId={editId}
          saving={saving}
          saveMCQ={saveMCQ}
        />
      )}

      <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          পূর্ববর্তী
        </Button>
        <div className="flex items-center gap-1.5">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                currentStep === step.id
                  ? 'bg-emerald-600 w-6'
                  : currentStep > step.id
                    ? 'bg-emerald-300'
                    : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
        <Button
          onClick={handleNext}
          disabled={!canGoNext() || currentStep === 3}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          পরবর্তী
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
