const bengaliLabels = ['ক', 'খ', 'গ', 'ঘ']

export { bengaliLabels }

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} সেকেন্ড`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m} মিনিট ${s} সেকেন্ড` : `${m} মিনিট`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h} ঘণ্টা ${rm} মিনিট`
}

export function quickMarkButtons(maxMarks: number): number[] {
  if (maxMarks <= 0) return []
  const step = Math.max(0.5, maxMarks / 10)
  const steps: number[] = []
  for (let m = 0; m <= maxMarks; m += step) {
    steps.push(Math.round(m * 10) / 10)
  }
  return steps
}

export function getTypeLabel(type: string): string {
  switch (type) {
    case 'mcq-single':
      return 'MCQ (একক উত্তর)'
    case 'mcq-multiple':
      return 'MCQ (একাধিক উত্তর)'
    case 'fill-blanks':
      return 'শূন্যস্থান পূরণ'
    case 'written':
      return 'রচনামূলক প্রশ্ন'
    case 'typed':
      return 'টাইপড'
    case 'cq':
      return 'সৃজনশীল'
    default:
      return type
  }
}

export function getStatusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'graded':
    case 'published':
      return { label: 'মূল্যায়ন সম্পন্ন', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
    case 'submitted':
      return { label: 'জমা দেওয়া হয়েছে', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    case 'in-progress':
      return { label: 'চলমান', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' }
    case 'not-started':
      return { label: 'শুরু হয়নি', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
    default:
      return { label: status, color: 'bg-muted text-muted-foreground' }
  }
}

export function getAnswerModeLabel(mode: string): { label: string; color: string } {
  switch (mode) {
    case 'flexible':
      return { label: 'টেক্সট + ছবি', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' }
    case 'text-only':
      return { label: 'শুধু টেক্সট', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' }
    case 'image-only':
      return { label: 'শুধু ছবি', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' }
    case 'complete-image-only':
      return { label: 'সম্পূর্ণ ছবি', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' }
    default:
      return { label: mode, color: 'bg-muted text-muted-foreground' }
  }
}

export function getClassLabel(classLevel: string): string {
  const labels: Record<string, string> = {
    'class-6': '৬ষ্ঠ শ্রেণি',
    'class-7': '৭ম শ্রেণি',
    'class-8': '৮ম শ্রেণি',
    'class-9': '৯ম শ্রেণি',
    'ssc': 'এসএসসি',
    'hsc': 'এইচএসসি',
  }
  return labels[classLevel] || classLevel
}