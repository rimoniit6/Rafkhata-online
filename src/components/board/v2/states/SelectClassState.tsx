import { GraduationCap, ArrowRight } from 'lucide-react'

export function SelectClassState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-in-up">
      <div className="relative mb-8 animate-float">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
          <GraduationCap className="w-14 h-14 text-primary/40" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary/15 animate-pulse-soft" />
        <div className="absolute -bottom-1 -left-4 w-5 h-5 rounded-full bg-amber-500/15 animate-pulse-soft" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3">
        Select a Class to Begin
      </h2>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-4">
        Choose a class level from the filter bar above to start exploring board questions.
        You can filter by board, year, subject, and more once a class is selected.
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
        <span>Select</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted font-medium text-foreground/80">
          Class
        </span>
        <ArrowRight className="h-3 w-3" />
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted font-medium text-foreground/60">
          Subject
        </span>
        <ArrowRight className="h-3 w-3" />
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted font-medium text-foreground/60">
          Chapter
        </span>
      </div>
    </div>
  )
}
