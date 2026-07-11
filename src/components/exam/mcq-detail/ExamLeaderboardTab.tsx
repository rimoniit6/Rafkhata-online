import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SafeImage from '@/components/ui/safe-image'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Trophy, Users } from 'lucide-react'
import type {
  ExamSet,
  LeaderboardEntry,
} from '@/components/exam/mcq-exam-detail-utils'
import { formatDuration } from '@/components/exam/mcq-exam-detail-utils'

interface ExamLeaderboardTabProps {
  examSets: ExamSet[]
  leaderboardSetId: string
  leaderboardLoading: boolean
  leaderboardData: LeaderboardEntry[]
  leaderboardMyRank: number | null
  user: { id: string; name: string } | null
  onFetchLeaderboard: (setId: string) => void
}

export default function ExamLeaderboardTab({
  examSets,
  leaderboardSetId,
  leaderboardLoading,
  leaderboardData,
  leaderboardMyRank,
  user,
  onFetchLeaderboard,
}: ExamLeaderboardTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="size-5 text-emerald-500" />
        লিডারবোর্ড
      </h3>

      {examSets.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {examSets.map((set) => (
              <Button
                key={set.id}
                size="sm"
                variant={leaderboardSetId === set.id ? 'default' : 'outline'}
                className={cn(
                  'text-xs gap-1',
                  leaderboardSetId === set.id && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
                onClick={() => onFetchLeaderboard(set.id)}
              >
                {set.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {leaderboardLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : leaderboardData.length === 0 ? (
        <Card className="p-6 text-center">
          <Users className="size-8 text-muted-foreground mx-auto mb-2" />
          {leaderboardSetId ? (
            <p className="text-sm text-muted-foreground">
              এখনো কেউ পরীক্ষা সম্পন্ন করেননি। আপনি প্রথম হন!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              লিডারবোর্ড দেখতে একটি সেট নির্বাচন করুন
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {leaderboardMyRank && leaderboardMyRank > 10 && (
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-emerald-500 text-white font-bold text-sm shrink-0">
                  {toBengaliNumerals(leaderboardMyRank)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">আপনার অবস্থান</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {toBengaliNumerals(leaderboardMyRank)} তম
                </Badge>
              </CardContent>
            </Card>
          )}

          {leaderboardData.map((entry) => {
            const isMe = user?.id === entry.user.id
            const rankDisplay = entry.rank <= 3
              ? ['🥇', '🥈', '🥉'][entry.rank - 1]
              : toBengaliNumerals(entry.rank)

            return (
              <Card
                key={`${entry.user.id}-${entry.rank}`}
                className={cn(
                  'transition-colors',
                  isMe
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-border/50'
                )}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className={cn(
                      'flex items-center justify-center size-8 rounded-full font-bold text-sm shrink-0',
                      entry.rank === 1
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                        : entry.rank === 2
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        : entry.rank === 3
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {rankDisplay}
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {entry.user.avatar ? (
                      <SafeImage
                        src={entry.user.avatar}
                        alt={entry.user.name}
                        className="size-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium">
                          {entry.user.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={cn('text-sm font-medium truncate', isMe && 'text-emerald-700 dark:text-emerald-400')}>
                        {entry.user.name}
                        {isMe && <span className="text-xs ml-1">(আপনি)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        সঠিক: {toBengaliNumerals(entry.totalCorrect)} | সময়: {formatDuration(entry.timeTaken)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={cn(
                      'text-sm font-bold',
                      isMe ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                    )}>
                      {toBengaliNumerals(Math.round(entry.marksObtained))}/{toBengaliNumerals(Math.round(entry.totalMarks))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
