/**
 * Centralized Bengali labels and UI constants.
 */

export const BENGALI_LABELS = {
  // Statuses
  DRAFT: 'ড্রাফট',
  PUBLISHED: 'প্রকাশিত',
  ARCHIVED: 'আর্কাইভ',
  COMPLETED: 'সম্পন্ন',
  PENDING: 'অপেক্ষমাণ',
  REJECTED: 'প্রত্যাখ্যাত',
  APPROVED: 'অনুমোদিত',
  ACTIVE: 'সক্রিয়',
  INACTIVE: 'নিষ্ক্রিয়',

  // UI Common
  SAVE: 'সংরক্ষণ করুন',
  UPDATE: 'আপডেট করুন',
  CANCEL: 'বাতিল',
  DELETE: 'ডিলিট করুন',
  EDIT: 'সম্পাদনা',
  VIEW: 'দেখুন',
  LOADING: 'অপেক্ষা করুন...',
  SUCCESS: 'সফলভাবে সম্পন্ন হয়েছে',
  ERROR: 'একটি ত্রুটি হয়েছে',

  // Validation
  REQUIRED_FIELD: 'এই ঘরটি পূরণ করা আবশ্যক',
  INVALID_INPUT: 'সঠিক তথ্য প্রদান করুন',
} as const

export const STATUS_COLORS = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  completed: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
} as const
