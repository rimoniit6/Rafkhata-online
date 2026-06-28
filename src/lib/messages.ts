// Default messages — can be overridden by admin via SiteSetting (msg* keys)
// Components should use getMessages() and fall back to these defaults
const DEFAULT_MESSAGES = {
  contentComingSoon: 'কন্টেন্ট শীঘ্রই আসবে',
  chaptersComingSoon: 'এই বিষয়ের অধ্যায়সমূহ শীঘ্রই যোগ করা হবে',
  chapterContentSoon: 'এই অধ্যায়ের কন্টেন্ট শীঘ্রই যোগ করা হবে',
  mcqComingSoon: 'শীঘ্রই নতুন প্রশ্ন যোগ করা হবে',
  cqComingSoon: 'শীঘ্রই নতুন সৃজনশীল প্রশ্ন যোগ করা হবে',
  lectureComingSoon: 'শীঘ্রই নতুন লেকচার যোগ করা হবে',
  boardComingSoon: 'শীঘ্রই নতুন ক্লাস/প্রশ্ন যোগ করা হবে',
  contentLoadError: 'কন্টেন্ট লোড করতে সমস্যা হয়েছে',
  contentTypeSoon: 'শীঘ্রই কন্টেন্ট আসবে',
  noQuestionsFound: 'কোনো প্রশ্ন পাওয়া যায়নি',
  footerClassesSoon: 'শীঘ্রই শ্রেণি যোগ করা হবে',
  footerContactSoon: 'শীঘ্রই যোগাযোগ তথ্য যোগ করা হবে',
  subjectsComingSoon: 'এই শ্রেণির বিষয়সমূহ শীঘ্রই যোগ করা হবে',
}

export type Messages = typeof DEFAULT_MESSAGES

export function getMessages(override?: Partial<Messages>): Messages {
  return { ...DEFAULT_MESSAGES, ...override }
}

export { DEFAULT_MESSAGES }
