import { api } from '@/lib/api-client'

export interface TestimonialRecord {
  id: string
  name: string
  role: string | null
  avatar: string | null
  content: string
  rating: number
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface TestimonialInput {
  name: string
  role?: string | null
  avatar?: string | null
  content: string
  rating?: number
  isActive?: boolean
  order?: number
}

export const testimonialService = {
  list: () => api.get<TestimonialRecord[]>('admin/testimonials'),
  create: (data: TestimonialInput) =>
    api.post<TestimonialRecord>('admin/testimonials', data),
  update: (id: string, data: Partial<TestimonialInput>) =>
    api.put<TestimonialRecord>('admin/testimonials', { id, ...data }),
  remove: (id: string) =>
    api.delete<{ id: string }>('admin/testimonials', { id }),
}
