'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Lock, Eye, Play, FileQuestion, Video, Radio, StickyNote, Paperclip, Code, Megaphone, Link, AlignLeft, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CourseContentRecord {
  id: string; courseId: string; contentType: string; referenceId: string | null
  sourceType: string | null; sourceId: string | null
  title: string | null; description: string | null
  displayOrder: number; isPreview: boolean; isPublished: boolean
  releaseAt: string | null; metadata: Record<string, unknown> | null
}

const CONTENT_TYPE_CONFIG: Record<string, { label: string; group: string; icon: string }> = {}

interface Props {
  contents: CourseContentRecord[]
  hasAccess: boolean
  progress: Record<string, boolean>
  onToggleProgress: (contentId: string, completed: boolean) => void
}

const ICON_MAP: Record<string, React.ElementType> = {
  Radio, Video, FileQuestion, AlignLeft, StickyNote, Paperclip, Code, Megaphone, Link, FileText,
}

export default function StudentCurriculumTab({ contents, hasAccess, progress, onToggleProgress }: Props) {
  const sorted = [...contents].sort((a, b) => a.displayOrder - b.displayOrder)
  const published = sorted.filter(c => c.isPublished)

  if (published.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium">কোনো কন্টেন্ট নেই</p>
        <p className="text-sm text-muted-foreground">কোর্সের কন্টেন্ট শীঘ্রই যোগ করা হবে</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {published.map((item, idx) => {
        const typeInfo = CONTENT_TYPE_CONFIG[item.contentType] || { label: item.contentType, group: '', icon: 'FileQuestion' }
        const Icon = ICON_MAP[typeInfo.icon] || FileQuestion
        const isCompleted = progress[item.id] || false
        const isLocked = item.isPreview ? false : !hasAccess

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card className={`transition-colors ${isLocked ? 'opacity-60' : ''}`}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title || `${typeInfo.label} #${idx + 1}`}
                    </p>
                    <Badge variant="outline" className="shrink-0 text-[10px]">{typeInfo.label}</Badge>
                    {item.isPreview && <Badge variant="secondary" className="shrink-0 bg-blue-100 text-blue-700 text-[10px]">ফ্রি</Badge>}
                  </div>
                  {item.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {hasAccess && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onToggleProgress(item.id, !isCompleted)}
                    >
                      {isCompleted ? <Eye className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                  )}
                  {isLocked ? (
                    <div className="flex h-8 w-8 items-center justify-center text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
