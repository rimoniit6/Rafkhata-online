'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Crown, Loader2, Calendar, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouterStore } from '@/store/router'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { courseService, type CourseRecord } from '@/services/api/course.service'

export default function CourseListPage() {
  const { params, navigate, goBack } = useRouterStore()
  const { metadata } = useHierarchyMetadata()
  const classList = (metadata?.classes || []) as { id: string; name: string; slug: string }[]
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClassId, setFilterClassId] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [filterClassId])

  async function fetchCourses() {
    setLoading(true)
    try {
      const result = await courseService.list({ classId: filterClassId || undefined })
      setCourses(result.courses || [])
    } catch { setCourses([]) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">কোর্স সমূহ</h1>
            <p className="text-sm text-muted-foreground">আপনার পছন্দের কোর্স বেছে নিন</p>
          </div>
        </div>

        {/* Class Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant={!filterClassId ? 'default' : 'outline'} size="sm" onClick={() => setFilterClassId('')}>সব</Button>
          {classList.map(c => (
            <Button key={c.id} variant={filterClassId === c.id ? 'default' : 'outline'} size="sm" onClick={() => setFilterClassId(c.id)}>
              {c.name}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h3 className="text-lg font-medium">কোর্স পাওয়া যায়নি</h3>
            <p className="mt-1 text-sm text-muted-foreground">শীঘ্রই নতুন কোর্স আসবে</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}>
                <Card className="cursor-pointer transition-all hover:shadow-lg overflow-hidden" onClick={() => navigate('course-detail', { courseSlug: course.slug })}>
                  {course.thumbnail && (
                    <div className="h-40 overflow-hidden">
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-2 text-lg">{course.title}</h3>
                      {course.isPremium && <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Crown className="mr-1 h-3 w-3" />প্রিমিয়াম</Badge>}
                    </div>
                    {course.description && <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {course.subject && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.subject.name}</span>}
                      {course._count && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{course._count.lessons || 0}টি ক্লাস</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {course.isPremium ? (
                        <span className="text-lg font-bold text-amber-600">৳{course.price}</span>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">ফ্রি</Badge>
                      )}
                      <Button size="sm" variant="ghost">বিস্তারিত →</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
