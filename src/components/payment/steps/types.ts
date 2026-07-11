export type PaymentStep = 'method' | 'pay' | 'verify'
export type PaymentMethod = 'bkash' | 'nagad' | 'rocket'
export type PaymentStatus = 'idle' | 'submitting' | 'success' | 'pending' | 'error'
export type PaymentMode = 'content' | 'bundle'

export interface ContentInfo {
  contentType: string
  contentId: string
  title: string
  price: number
  type: string
  description?: string
  isPremium?: boolean
  originalPrice?: number
  itemCount?: number
  duration?: number
  durationLabel?: string
  classLevel?: string
  mcqCount?: number
  cqCount?: number
  lectureCount?: number
  totalContent?: number
}

export interface PaymentMethodInfo {
  id: PaymentMethod
  name: string
  color: string
  bgColor: string
  borderColor: string
  accountNumber: string
  instructions: string[]
}
