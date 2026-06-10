'use client'

import { Trophy, ArrowLeft, Crown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { MCQExamSetResultRecord } from '@/types/admin-mcq-exam'
import { formatTime } from './MCQExamConstants'

interface LeaderboardProps {
  loading: boolean
  title: string
  data: MCQExamSetResultRecord[]
  onBack: () => void
  classLevelLabels: Record<string, string>
}

export function Leaderboard({ loading, title, data, onBack, classLevelLabels }: LeaderboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" /> লিডারবোর্ড
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{title} • {data.length} জন পরীক্ষার্থী</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">কোনো ফলাফল পাওয়া যায়নি</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {data[1] && (
              <div className="flex flex-col items-center pt-6">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 mb-2">{data[1].user?.name?.charAt(0)}</div>
                <Badge className="bg-gray-100 text-gray-700 mb-1">২য়</Badge>
                <p className="text-sm font-medium text-center truncate w-full">{data[1].user?.name}</p>
                <p className="text-xs text-emerald-600 font-semibold">{data[1].marksObtained} নম্বর</p>
              </div>
            )}
            <div className="flex flex-col items-center">
              <Crown className="h-6 w-6 text-amber-500 mb-1" />
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-700 mb-2">{data[0].user?.name?.charAt(0)}</div>
              <Badge className="bg-amber-100 text-amber-700 mb-1">১ম</Badge>
              <p className="text-sm font-medium text-center truncate w-full">{data[0].user?.name}</p>
              <p className="text-xs text-emerald-600 font-semibold">{data[0].marksObtained} নম্বর</p>
            </div>
            {data[2] && (
              <div className="flex flex-col items-center pt-8">
                <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-lg font-bold text-amber-600 mb-2">{data[2].user?.name?.charAt(0)}</div>
                <Badge className="bg-amber-50 text-amber-600 mb-1">৩য়</Badge>
                <p className="text-sm font-medium text-center truncate w-full">{data[2].user?.name}</p>
                <p className="text-xs text-emerald-600 font-semibold">{data[2].marksObtained} নম্বর</p>
              </div>
            )}
          </div>

          <Card className="border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">র‍্যাংক</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>নম্বর</TableHead>
                  <TableHead className="hidden md:table-cell">সময়</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((result, index) => (
                  <TableRow key={result.id} className={cn(index === 0 && 'bg-amber-50/50', index === 1 && 'bg-gray-50/50', index === 2 && 'bg-amber-50/30')}>
                    <TableCell>
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-amber-50 text-amber-600' : 'bg-muted text-muted-foreground')}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{result.user?.name?.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium">{result.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{result.user?.classLevel && classLevelLabels[result.user.classLevel]}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-semibold text-emerald-600">{result.marksObtained}</span><span className="text-muted-foreground text-xs">/{result.totalMarks}</span></TableCell>
                    <TableCell className="hidden md:table-cell"><span className="text-sm">{formatTime(result.timeTaken)}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}
