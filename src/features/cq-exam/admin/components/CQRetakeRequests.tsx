'use client'

import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, Loader2, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { CQExamRetakeRequestRecord, CQExamSetRecord } from '../../types'

const requestStatusInfo: Record<string, { label: string; className: string }> = {
  pending: { label: 'অপেক্ষমাণ', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'অনুমোদিত', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected: { label: 'প্রত্যাখ্যাত', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return dateStr }
}

interface CQRetakeRequestsProps {
  loading: boolean
  requests: CQExamRetakeRequestRecord[]
  currentSet: CQExamSetRecord | null
  saving: boolean
  onBack: () => void
  onRefresh: (setId: string) => void
  onApprove: (requestId: string, approve: boolean) => void
}

export function CQRetakeRequests({
  loading, requests, currentSet, saving, onBack, onRefresh, onApprove,
}: CQRetakeRequestsProps) {
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" /> পুনরায় পরীক্ষার অনুরোধ
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentSet?.title || ''} • {requests.length}টি অনুরোধ{pendingCount > 0 && ` (${pendingCount} অপেক্ষমাণ)`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <User className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">কোনো অনুরোধ পাওয়া যায়নি</p>
          <p className="text-sm text-muted-foreground mt-1">শিক্ষার্থীরা এখানে পুনরায় পরীক্ষার অনুরোধ করতে পারবেন</p>
        </div>
      ) : (
        <>
          <Card className="border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>শিক্ষার্থী</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>কারণ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const statusInfo = requestStatusInfo[req.status] || requestStatusInfo.pending
                  return (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                            {req.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{req.user?.name || 'অজানা'}</p>
                            <p className="text-xs text-muted-foreground">{req.user?.email || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{formatDateTime(req.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{req.reason || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px] px-1.5', statusInfo.className)}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                              onClick={() => onApprove(req.id, true)}
                              disabled={saving}
                            >
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              অনুমোদন
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                              onClick={() => onApprove(req.id, false)}
                              disabled={saving}
                            >
                              <XCircle className="h-3 w-3" />
                              প্রত্যাখ্যান
                            </Button>
                          </div>
                        ) : req.status === 'approved' ? (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3 mr-1" /> অনুমোদিত
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <XCircle className="h-3 w-3 mr-1" /> প্রত্যাখ্যাত
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="flex justify-end">
            {currentSet && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => onRefresh(currentSet.id)}
                disabled={loading}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                রিফ্রেশ
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
