'use client'

import { ArrowLeft, Upload, Plus, FileQuestion, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { 
  MCQExamSetRecord, 
  MCQExamSetQuestionRecord 
} from '@/types/admin-mcq-exam'
import { 
  difficultyLabels, 
  difficultyColors 
} from './MCQExamConstants'

interface QuestionManagerProps {
  loading: boolean
  currentSet: (MCQExamSetRecord & { questions?: MCQExamSetQuestionRecord[] }) | null
  onBack: () => void
  onOpenBulkUpload: () => void
  onOpenAddQuestion: () => void
  onRemoveQuestion: (mcqId: string) => void
  onMoveQuestion: (id: string, direction: 'up' | 'down') => void
}

export function QuestionManager({
  loading, currentSet, onBack, onOpenBulkUpload, onOpenAddQuestion,
  onRemoveQuestion, onMoveQuestion
}: QuestionManagerProps) {
  const questions = currentSet?.questions || []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">প্রশ্ন ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentSet?.title || ''} • {questions.length}টি প্রশ্ন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" size="sm" onClick={onOpenBulkUpload}>
            <Upload className="h-4 w-4" /> বাল্ক আপলোড
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={onOpenAddQuestion}>
            <Plus className="h-4 w-4" /> প্রশ্ন যোগ করুন
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{questions.length}</p>
              <p className="text-xs text-muted-foreground">মোট প্রশ্ন</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{currentSet?.totalMarks || 0}</p>
              <p className="text-xs text-muted-foreground">মোট নম্বর</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{currentSet?.marksPerQ || 1}</p>
              <p className="text-xs text-muted-foreground">প্রতি প্রশ্ন</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <FileQuestion className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">কোনো প্রশ্ন নেই</p>
          <p className="text-sm text-muted-foreground mt-1">প্রশ্ন যোগ করুন বাটনে ক্লিক করে প্রশ্ন যোগ করুন</p>
        </div>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ক্রম</TableHead>
                <TableHead>প্রশ্ন</TableHead>
                <TableHead className="w-20">নম্বর</TableHead>
                <TableHead className="w-24">কঠিনতা</TableHead>
                <TableHead className="w-24 text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q, idx) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell className="max-w-md">
                    <RichContentRenderer content={q.mcq.question} className="text-sm line-clamp-2" inline />
                    {q.mcq.questionImage && (
                      <img src={q.mcq.questionImage} alt="প্রশ্ন" className="h-8 mt-1 rounded" />
                    )}
                  </TableCell>
                  <TableCell>{q.marks}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', difficultyColors[q.mcq.difficulty] || difficultyColors['medium'])}>
                      {difficultyLabels[q.mcq.difficulty] || q.mcq.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => onMoveQuestion(q.id, 'up')}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === questions.length - 1} onClick={() => onMoveQuestion(q.id, 'down')}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onRemoveQuestion(q.mcqId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
