import { BookOpen, GraduationCap, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface HeroBannerProps {
  totalQuestions: number
  recentAdded: number
  activeStudents: number
}

export function HeroBanner({ totalQuestions, recentAdded, activeStudents }: HeroBannerProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/5 to-background border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold tracking-tight truncate">Board Questions</h1>
              <p className="text-[11px] text-muted-foreground truncate">
                Explore questions from all education boards
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2.5">
            <MetricPill icon={BookOpen} value={toBengaliNumerals(totalQuestions)} label="Total" />
            <MetricPill icon={TrendingUp} value={toBengaliNumerals(recentAdded)} label="New" />
            <MetricPill icon={Users} value={toBengaliNumerals(activeStudents)} label="Students" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/5 to-background border-b border-border/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(var(--primary)/0.08),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Board Question Explorer</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Search and practice questions from all education boards across Bangladesh.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 animate-fade-in-up delay-100">
          <StatCard icon={BookOpen} label="Total Questions" value={toBengaliNumerals(totalQuestions)} gradient="from-blue-500 to-cyan-500" />
          <StatCard icon={TrendingUp} label="Recently Added" value={toBengaliNumerals(recentAdded)} gradient="from-emerald-500 to-teal-500" />
          <StatCard icon={Users} label="Active Students" value={toBengaliNumerals(activeStudents)} gradient="from-violet-500 to-purple-500" />
        </div>
      </div>
    </div>
  )
}

function MetricPill({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10">
      <Icon className="h-3 w-3 text-primary/60" />
      <span className="text-xs font-semibold text-foreground/80">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, gradient }: { icon: React.ElementType; label: string; value: string; gradient: string }) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn('p-3 rounded-xl bg-gradient-to-br', gradient, 'shadow-sm')}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
