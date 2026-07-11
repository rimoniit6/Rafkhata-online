import { Check } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import { Step } from './types'

export function StepIndicator({ step, currentStep, label, icon: Icon }: {
  step: Step
  currentStep: Step
  label: string
  icon: React.ElementType
}) {
  const isCompleted = currentStep > step
  const isCurrent = currentStep === step

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shrink-0',
        isCompleted && 'bg-emerald-600 text-white',
        isCurrent && 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
        !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
      )}>
        {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <span className={cn(
        'text-xs font-medium hidden sm:block',
        isCurrent && 'text-emerald-700 dark:text-emerald-400',
        isCompleted && 'text-emerald-600',
        !isCompleted && !isCurrent && 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  )
}
