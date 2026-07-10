'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import SafeImage from '@/components/ui/safe-image'
import { useContentTypes } from '@/hooks/use-content-types'
import { useFeaturedCourses,type FeaturedItem } from '@/hooks/use-home-data'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useRouterStore } from '@/store/router'
import {
ArrowRight,
Loader2,
Lock,
Star
} from 'lucide-react'

// Gradient map for featured cards (by content type key)
const GRADIENT_MAP: Record<string, string> = {
  lecture: 'from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30',
  cq: 'from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30',
  bundle: 'from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30',
  package: 'from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30',
  suggestion: 'from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30',
  exam: 'from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30',
  course: 'from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30',
}

export default function FeaturedCourses() {
  const navigate = useRouterStore((s) => s.navigate)
  const { contentTypesWithIcons, getLabel, getIcon } = useContentTypes()
  const { config } = useSiteConfig()
  const { data: items = [], isLoading: loading } = useFeaturedCourses()

  // Don't show section if no featured content
  if (!loading && items.length === 0) {
    return null
  }

  const handleCardClick = (item: FeaturedItem) => {
    const classSlug = item.extra.classSlug as string | undefined
    const subjectId = item.extra.subjectId as string | undefined
    const chapterId = item.extra.chapterId as string | undefined

    switch (item.contentType) {
      case 'lecture': {
        // Navigate directly to the lecture viewer if we have the lectureId
        const lectureId = item.extra.lectureId as string | undefined
        if (lectureId) {
          navigate('lecture-viewer', {
            lectureId,
            chapterId: chapterId || '',
            subjectId: subjectId || '',
            classSlug: classSlug || '',
          })
        } else if (chapterId && subjectId) {
          // Fallback: go to chapter detail to see all content
          navigate('chapter-detail', { chapterId, subjectId, classSlug: classSlug || '' })
        } else if (subjectId) {
          navigate('subject-detail', { subjectId, classSlug: classSlug || '' })
        }
        break
      }

      case 'cq': {
        // Navigate directly to the CQ viewer if we have cqId, otherwise to CQ list
        const cqId = item.extra.cqId as string | undefined
        if (cqId && chapterId && subjectId) {
          navigate('cq-viewer', {
            cqId,
            chapterId,
            subjectId,
            classSlug: classSlug || '',
          })
        } else if (chapterId && subjectId) {
          navigate('cq-list', {
            chapterId,
            subjectId,
            classSlug: classSlug || '',
          })
        } else if (subjectId) {
          navigate('subject-detail', { subjectId, classSlug: classSlug || '' })
        }
        break
      }
      case 'bundle':
      case 'package':
        navigate('premium')
        break
      case 'suggestion':
        navigate('suggestion-detail', {
          suggestionId: item.id,
        })
        break
      case 'exam':
        navigate('exam-center')
        break
      case 'course': {
        const courseSlug = item.extra.courseSlug as string | undefined
        if (courseSlug) {
          navigate('course-detail', { courseSlug })
        }
        break
      }
      default:
        break
    }
  }

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-10 sm:mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {config?.homepageFeaturedTitle || 'ফিচার্ড কন্টেন্ট'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {config?.homepageFeaturedSubtitle || 'আমাদের সেরা কন্টেন্টসমূহ'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto no-scrollbar pb-4 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6 stagger-children"
          >
            {items.map((item) => {
              const Icon = getIcon(item.contentType)
              const label = getLabel(item.contentType)
              const ctInfo = contentTypesWithIcons.find(ct => ct.key === item.contentType)
              const gradient = GRADIENT_MAP[item.contentType] || 'from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30'
              const colorClass = ctInfo?.lightColor || 'bg-gray-100 text-gray-700'
              const textColorClass = ctInfo?.textColor || 'text-gray-600 dark:text-gray-400'
              return (
                <div
                  key={`${item.contentType}-${item.id}`}
                  role="button"
                  tabIndex={0}
                  className="min-w-[260px] sm:min-w-0 cursor-pointer transition-all duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-emerald-500"
                  onClick={() => handleCardClick(item)}
                  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(item) } }}
                >
                  <Card className="border-0 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full">
                    <CardContent className="p-0">
                      {/* Thumbnail area */}
                      <div className={`relative bg-gradient-to-br ${gradient} h-36 flex items-center justify-center`}>
                        {item.thumbnail ? (
                          <SafeImage
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon className="w-10 h-10 text-emerald-600/60 dark:text-emerald-400/60" />
                        )}
                        {/* Content type badge */}
                        <Badge className={`absolute top-3 left-3 ${colorClass} ${textColorClass} gap-1 text-xs`}>
                          <Icon className="w-3 h-3" />
                          {label}
                        </Badge>
                        {item.isPremium && (
                          <Badge className="absolute top-3 right-3 bg-amber-500 text-white hover:bg-amber-600 gap-1">
                            <Lock className="w-3 h-3" />
                            প্রিমিয়াম
                          </Badge>
                        )}
                      </div>

                      {/* Item info */}
                      <div className="p-4">
                        {item.subtitle && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1 truncate">
                            {item.subtitle}
                          </p>
                        )}
                        <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" />
                            ফিচার্ড
                          </span>
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                            দেখুন
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
