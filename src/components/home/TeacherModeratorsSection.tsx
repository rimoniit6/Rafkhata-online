'use client'

import { GraduationCap, Loader2, Quote } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { useSiteConfig, useTeacherModerators } from '@/hooks/use-metadata'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.slice(0, 2)
}

export default function TeacherModeratorsSection() {
  const { teachers, loading } = useTeacherModerators()
  const { config } = useSiteConfig()

  if (!loading && teachers.length === 0) return null

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-transparent via-emerald-50/30 to-transparent dark:via-emerald-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {config?.homepageTeachersTitle || 'আমাদের শিক্ষক ও মডারেটর'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {config?.homepageTeachersSubtitle || 'যারা আছেন আপনার পাশে'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teachers.map((teacher, idx) => (
              <div
                key={teacher.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-card hover:-translate-y-1">
                  <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                  <CardContent className="p-6 text-center">
                    <div className="relative mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 scale-125 group-hover:scale-150 transition-transform duration-500" />
                      <Avatar className="h-20 w-20 mx-auto ring-2 ring-emerald-200 dark:ring-emerald-800 group-hover:ring-emerald-400 transition-all">
                        <AvatarImage src={teacher.image || undefined} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-lg font-bold">
                          {getInitials(teacher.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {teacher.name}
                    </h3>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                      {teacher.title}
                    </p>
                    {teacher.institution && (
                      <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1">
                        <GraduationCap className="w-3 h-3 shrink-0" />
                        {teacher.institution}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
