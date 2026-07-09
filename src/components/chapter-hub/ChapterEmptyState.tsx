
import { BookOpen, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const emptyContent: Record<string, { icon: React.ElementType; title: string; subtitle: string }> = {
  all: {
    icon: BookOpen,
    title: 'No content yet',
    subtitle: 'This chapter has no learning content available yet.',
  },
  lecture: {
    icon: BookOpen,
    title: 'No video lectures',
    subtitle: 'Video lectures for this chapter will be added soon.',
  },
  mcq: {
    icon: BookOpen,
    title: 'No MCQs found',
    subtitle: 'MCQ questions for this chapter will be added soon.',
  },
  cq: {
    icon: BookOpen,
    title: 'No CQs found',
    subtitle: 'Creative questions for this chapter will be added soon.',
  },
  board: {
    icon: BookOpen,
    title: 'No board questions',
    subtitle: 'No board questions match your current filters.',
  },
  knowledge: {
    icon: BookOpen,
    title: 'No knowledge questions',
    subtitle: 'Knowledge questions for this chapter will be added soon.',
  },
  suggestion: {
    icon: BookOpen,
    title: 'No suggestions',
    subtitle: 'Suggestions for this chapter will be added soon.',
  },
  exam: {
    icon: BookOpen,
    title: 'No exams',
    subtitle: 'Exams for this chapter will be added soon.',
  },
}

interface ChapterEmptyStateProps {
  tab: string
  hasFilters?: boolean
  onClearFilters?: () => void
}

export function ChapterEmptyState({ tab, hasFilters = false, onClearFilters = () => {} }: ChapterEmptyStateProps) {
  const content = emptyContent[tab] || emptyContent.all
  const Icon = hasFilters ? SearchX : content.icon

  return (
    <div className="animate-fade-in-up">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-muted mb-5">
            <Icon className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {hasFilters ? 'No results found' : content.title}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            {hasFilters ? 'Try adjusting your filters or search query.' : content.subtitle}
          </p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters} className="rounded-xl">
              Clear All Filters
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
