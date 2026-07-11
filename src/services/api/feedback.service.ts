import { api } from '@/lib/api-client'

export interface FeedbackUser {
  id: string
  name: string | null
  email: string | null
  phone: string | null
}

export interface Message {
  id: string
  senderId: string
  senderRole: 'user' | 'admin'
  message: string
  createdAt: string
  sender: { id: string; name: string | null; role: string }
}

export interface FeedbackRecord {
  id: string
  userId: string
  subject: string
  status: 'pending' | 'replied' | 'closed'
  createdAt: string
  updatedAt: string
  user: FeedbackUser
  messages: Message[]
  _count: { messages: number }
}

export interface FeedbackMessageResponse {
  feedback: FeedbackRecord
  messages: Message[]
}

export interface FeedbackListParams {
  status?: string
  q?: string
}

export const feedbackService = {
  list: (params?: FeedbackListParams) =>
    api.get<{ data: FeedbackRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('admin/feedback', params),
  update: (id: string, status: string) =>
    api.put<FeedbackRecord>('admin/feedback', { id, status }),
  listMessages: (id: string) =>
    api.get<FeedbackMessageResponse>(`admin/feedback/${id}/messages`),
  createMessage: (id: string, message: string) =>
    api.post<Message>(`admin/feedback/${id}/messages`, { message }),
}
