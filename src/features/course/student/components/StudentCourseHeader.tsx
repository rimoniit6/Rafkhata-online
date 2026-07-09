'use client'

import { BookOpen, Crown, Clock, User, GraduationCap, BarChart3, Check, Loader2, Play, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface Props {
  course: {
    title: string; description: string | null; thumbnail: string | null
    teacherName: string | null; hasCertificate: boolean
    duration: number | null; language: string | null; difficulty: string | null
    isPremium: boolean; price: number | null; originalPrice?: number | null; classCategory: { name: string } | null
    subject: { name: string } | null
  }
  hasAccess: boolean
  isEnrolled: boolean
  enrollmentStatus?: string
  overallProgress: { total: number; completed: number; percent: number }
  purchasing: boolean
  enrolling: boolean
  onPurchase: () => void
  onEnroll: () => void
}

export default function StudentCourseHeader({ course, hasAccess, isEnrolled, enrollmentStatus, overallProgress, purchasing, enrolling, onPurchase, onEnroll }: Props) {
  const isCompleted = enrollmentStatus === 'COMPLETED'

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {course.classCategory && (
              <Badge variant="secondary">{course.classCategory.name}</Badge>
            )}
            {course.subject && (
              <Badge variant="outline">{course.subject.name}</Badge>
            )}
            {course.isPremium ? (
              <Badge className="bg-amber-100 text-amber-700"><Crown className="mr-1 h-3 w-3" />প্রিমিয়াম</Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-100 text-green-700">ফ্রি</Badge>
            )}
            {isEnrolled && (
              <Badge className="bg-blue-100 text-blue-700"><Check className="mr-1 h-3 w-3" />এনরোলড</Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">{course.title}</h1>

          {course.description && <p className="text-muted-foreground">{course.description}</p>}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {course.teacherName && (
              <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{course.teacherName}</span>
            )}
            {course.duration && (
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{course.duration} দিন</span>
            )}
            {course.difficulty && (
              <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" />{course.difficulty === 'beginner' ? 'বিগিনার' : course.difficulty === 'advanced' ? 'এডভান্সড' : 'ইন্টারমিডিয়েট'}</span>
            )}
            {course.hasCertificate && (
              <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />সার্টিফিকেট</span>
            )}
          </div>
        </div>

        <Card className="w-full shrink-0 lg:w-64">
          <CardContent className="p-5">
            {course.isPremium && !hasAccess && (
              <div className="mb-4 text-center">
                <p className="text-3xl font-bold">৳{course.price || 0}</p>
                {course.originalPrice && course.originalPrice > 0 && course.originalPrice > (course.price || 0) && (
                  <p className="text-sm text-muted-foreground line-through">৳{course.originalPrice}</p>
                )}
                <p className="text-xs text-muted-foreground">এককালীন পেমেন্ট</p>
              </div>
            )}

            {isCompleted ? (
              <div className="space-y-3 text-center">
                <Award className="mx-auto h-10 w-10 text-green-600" />
                <p className="font-medium text-green-600">কোর্স সম্পন্ন হয়েছে</p>
              </div>
            ) : isEnrolled ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">এনরোল করা হয়েছে</span>
                </div>
                {overallProgress.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>সামগ্রিক অগ্রগতি</span>
                      <span>{overallProgress.completed}/{overallProgress.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress.percent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : hasAccess && course.isPremium ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">কেনা হয়েছে</span>
                </div>
                <Button className="w-full" size="lg" onClick={onEnroll} disabled={enrolling}>
                  {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Play className="mr-2 h-4 w-4" />এনরোল করুন
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {course.isPremium ? (
                  <Button className="w-full" size="lg" onClick={onPurchase} disabled={purchasing}>
                    {purchasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    এখনই কিনুন
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" onClick={onEnroll} disabled={enrolling}>
                    {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Play className="mr-2 h-4 w-4" />এনরোল করুন
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
