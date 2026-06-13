'use client'

import { useState, useEffect } from 'react'
import { Timer, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouterStore } from '@/store/router'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

const gradients = [
  'from-emerald-400 to-emerald-600',
  'from-teal-400 to-teal-600',
  'from-cyan-400 to-cyan-600',
  'from-emerald-500 to-teal-500',
  'from-teal-500 to-emerald-500',
]

export default function MCQPracticeSection() {
  const { navigate } = useRouterStore()
  const { metadata, loading } = useHierarchyMetadata()
  const classes = metadata?.classes || []
  const { config } = useSiteConfig()

  const mcqFeatures = (config?.mcqFeatures && config.mcqFeatures.length > 0)
    ? config.mcqFeatures
    : ['বিষয়ভিত্তিক পরীক্ষা', 'সময় নির্ধারিত পরীক্ষা', 'বিস্তারিত ফলাফল ও ব্যাখ্যা', 'বোর্ড প্যাটার্ন অনুসারে প্রশ্ন']

  const handleStartExam = (classSlug: string) => {
    navigate('mcq-practice', { classSlug })
  }

  // Don't show section if no classes from database
  if (!loading && classes.length === 0) {
    return null
  }

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-10 sm:mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3" suppressHydrationWarning>
            {config?.homepageMcqTitle || 'MCQ প্র্যাকটিস'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto" suppressHydrationWarning>
            {config?.homepageMcqSubtitle || 'সময় নির্ধারিত পরীক্ষায় অংশ নিয়ে নিজেকে যাচাই করুন'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left - Class Quick Start */}
          <div className="stagger-children">
            <Card className="border-0 shadow-lg h-full">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Timer className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xl font-semibold text-foreground">ক্লাস অনুযায়ী শুরু করুন</h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">ক্লাস লোড হচ্ছে...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {classes.map((cls, i) => (
                      <div
                        key={cls.slug}
                        onClick={() => handleStartExam(cls.slug)}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors hover:translate-x-1 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${gradients[i % gradients.length]}`} />
                          <div>
                            <p className="font-medium text-foreground">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">MCQ প্র্যাকটিস</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right - Quick CTA */}
          <div className="animate-fade-in-right">
            <Card className="border-0 shadow-lg h-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white overflow-hidden">
              <CardContent className="p-6 sm:p-8 flex flex-col justify-between h-full">
                <div>
                  <CheckCircle className="w-12 h-12 mb-4 opacity-80" />
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                    এখনই পরীক্ষা দিন
                  </h3>
                  <p className="text-white/80 mb-2 text-lg">
                    সময় নির্ধারিত MCQ পরীক্ষায় অংশ নিন এবং আপনার প্রস্তুতি যাচাই করুন।
                  </p>
                  <ul className="space-y-2 text-white/80 text-sm mt-4">
                    {mcqFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-white/60" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  size="lg"
                  className="mt-8 bg-white text-emerald-700 hover:bg-white/90 font-semibold w-full"
                  onClick={() => {
                    // Navigate with first available class, or to class list
                    if (classes.length > 0) {
                      navigate('mcq-practice', { classSlug: classes[0].slug })
                    } else {
                      navigate('home', { scrollTarget: 'class-categories' })
                    }
                  }}
                >
                  এক্সাম শুরু করুন
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
