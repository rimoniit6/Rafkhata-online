'use client'

import { StickyNote, FileText, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CourseNoteRecord {
  id: string; courseId: string; title: string; contentType: string
  content: string | null; fileUrl: string | null; description: string | null; displayOrder: number
}

interface Props {
  notes: CourseNoteRecord[]
}

export default function StudentNotesTab({ notes }: Props) {
  const sorted = [...notes].sort((a, b) => a.displayOrder - b.displayOrder)

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <StickyNote className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium">কোনো নোট নেই</p>
        <p className="text-sm text-muted-foreground">নোট শীঘ্রই যোগ করা হবে</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map(n => (
        <Card key={n.id}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {n.contentType === 'pdf' ? <FileText className="h-5 w-5" /> : <StickyNote className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{n.title}</p>
              {n.description && <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>}
              <Badge variant="outline" className="mt-1 text-[10px]">
                {n.contentType === 'pdf' ? 'PDF' : n.contentType === 'html' ? 'HTML' : n.contentType === 'markdown' ? 'মার্কডাউন' : n.contentType}
              </Badge>
            </div>
            {n.fileUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={n.fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-3 w-3" /> খুলুন
                </a>
              </Button>
            )}
            {n.content && !n.fileUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(`/notes/${n.id}`, '_blank')}>
                দেখুন
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
