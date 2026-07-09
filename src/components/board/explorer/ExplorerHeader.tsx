
import { BookOpen, GraduationCap, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, toBengaliNumerals } from '@/lib/utils'

interface ExplorerHeaderProps {
  totalQuestions: number
  recentAdded: number
  activeStudents: number
}

export function ExplorerHeader({ totalQuestions, recentAdded, activeStudents }: ExplorerHeaderProps) {
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Board Question Explorer
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Search and practice questions from all education boards across Bangladesh.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 animate-fade-in-up delay-100">
          <StatCard
            icon={BookOpen}
            label="Total Questions Available"
            value={toBengaliNumerals(totalQuestions)}
            gradient="from-blue-500 to-cyan-500"
            delay={0.15}
          />
          <StatCard
            icon={TrendingUp}
            label="Recently Added"
            value={toBengaliNumerals(recentAdded)}
            gradient="from-emerald-500 to-teal-500"
            delay={0.2}
          />
          <StatCard
            icon={Users}
            label="Active Students"
            value={toBengaliNumerals(activeStudents)}
            gradient="from-violet-500 to-purple-500"
            delay={0.25}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: string
  gradient: string
  delay: number
}) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
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
    </div>
  )
}
