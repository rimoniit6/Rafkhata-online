'use client'

import DataTable,{ type BulkAction,type ColumnDef } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toDecimal } from '@/lib/decimal'
import { Card,CardContent } from '@/components/ui/card'
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useContentTypes } from '@/hooks/use-content-types'
import { useTableSelection } from '@/hooks/use-table-selection'
import { useToast } from '@/hooks/use-toast'
import {
AlertTriangle,
CheckCircle,
Clock,
CreditCard,
DollarSign,
Eye,
Image as ImageIcon,
MessageSquare,
Search,
Trash2,
TrendingUp,
XCircle
} from 'lucide-react'
import Image from 'next/image'
import { useCallback,useEffect,useState } from 'react'

interface PaymentRecord {
  id: string
  amount: number
  method: string
  transactionId: string
  paymentNumber: string
  contentType: string | null
  contentId: string | null
  contentTitle: string | null
  screenshot: string | null
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  user: { id: string; name: string; email: string; phone?: string; isPremium: boolean }
}

const statusLabels: Record<string, string> = { pending: 'অপেক্ষমাণ', approved: 'অনুমোদিত', rejected: 'প্রত্যাখ্যাত' }
const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}
const methodLabels: Record<string, string> = { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট' }

export default function AdminPaymentsPage() {
  const { toast } = useToast()
  const { getLabel, getIcon } = useContentTypes()

  const renderContentTypeIcon = (type: string | null) => {
    if (!type) return <CreditCard className="size-4 text-muted-foreground" />
    const Icon = getIcon(type)
    return <Icon className="size-4" />
  }

  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [contentTypeFilter, setContentTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [detailPayment, setDetailPayment] = useState<PaymentRecord | null>(null)
  const [approveDialog, setApproveDialog] = useState<PaymentRecord | null>(null)
  const [rejectDialog, setRejectDialog] = useState<PaymentRecord | null>(null)
  const [processing, setProcessing] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)

  const selection = useTableSelection(payments)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(perPage))
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (methodFilter !== 'all') params.set('method', methodFilter)
      if (contentTypeFilter !== 'all') params.set('contentType', contentTypeFilter)
      if (search) params.set('q', search)

      const res = await fetch(`/api/admin/payments?${params}`)
      if (res.ok) {
        const json = await res.json()
        const paymentsData = json.data?.data ?? json.data ?? []
        setPayments(paymentsData)
        setTotal(json.data?.pagination?.total ?? json.pagination?.total ?? 0)

        setTotalRevenue(paymentsData.filter((p: PaymentRecord) => p.status === 'approved').reduce((s: number, p: PaymentRecord) => s + toDecimal(p.amount), 0))
        setPendingCount(paymentsData.filter((p: PaymentRecord) => p.status === 'pending').length)
        setApprovedCount(paymentsData.filter((p: PaymentRecord) => p.status === 'approved').length)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [page, perPage, statusFilter, methodFilter, contentTypeFilter, search])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const handleApprove = async () => {
    if (!approveDialog) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: approveDialog.id,
          status: 'approved',
          adminNote: adminNote || undefined,
          reviewedBy: 'admin',
        }),
      })
      if (res.ok) {
        toast({ title: 'পেমেন্ট অনুমোদিত হয়েছে', description: `${approveDialog.user?.name} এর পেমেন্ট অনুমোদিত` })
        setApproveDialog(null)
        setAdminNote('')
        fetchPayments()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setProcessing(false) }
  }

  const handleReject = async () => {
    if (!rejectDialog) return
    if (!rejectReason.trim()) {
      toast({ title: 'প্রত্যাখ্যানের কারণ লিখুন', variant: 'destructive' })
      return
    }
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rejectDialog.id,
          status: 'rejected',
          adminNote: rejectReason,
          reviewedBy: 'admin',
        }),
      })
      if (res.ok) {
        toast({ title: 'পেমেন্ট প্রত্যাখ্যাত হয়েছে', description: `${rejectDialog.user?.name} এর পেমেন্ট প্রত্যাখ্যাত` })
        setRejectDialog(null)
        setRejectReason('')
        fetchPayments()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setProcessing(false) }
  }

  const handleBulkDelete = async (ids: string[]) => {
    if (processing) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/payments?ids=${ids.join(',')}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: `${ids.length}টি পেমেন্ট মুছে ফেলা হয়েছে` })
        selection.clearSelection()
        fetchPayments()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setProcessing(false) }
  }

  const columns: ColumnDef<PaymentRecord>[] = [
    {
      key: 'user',
      header: 'ব্যবহারকারী',
      render: (payment) => (
        <div>
          <p className="font-medium text-sm">{payment.user?.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{payment.user?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'কন্টেন্ট',
      render: (payment) => (
        <div className="flex items-center gap-2">
          {renderContentTypeIcon(payment.contentType)}
          <div>
            <p className="text-sm font-medium line-clamp-1">
              {payment.contentTitle || getLabel(payment.contentType || '') || payment.contentType || 'কন্টেন্ট'}
            </p>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[9px] h-4 px-1">
                {getLabel(payment.contentType || '') || payment.contentType || '-'}
              </Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'পরিমাণ',
      render: (payment) => <span className="font-semibold">৳{payment.amount}</span>,
    },
    {
      key: 'method',
      header: 'মেথড',
      headerClass: 'hidden sm:table-cell',
      cellClass: 'hidden sm:table-cell',
      render: (payment) => methodLabels[payment.method] || payment.method,
    },
    {
      key: 'status',
      header: 'স্ট্যাটাস',
      render: (payment) => <Badge className={statusColors[payment.status]}>{statusLabels[payment.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      cellClass: 'w-28',
      render: (payment) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailPayment(payment)} aria-label="বিস্তারিত"><Eye className="h-4 w-4" /></Button>
          {payment.status === 'pending' && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => { setApproveDialog(payment); setAdminNote('') }} aria-label="অনুমোদন করুন"><CheckCircle className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setRejectDialog(payment); setRejectReason('') }} aria-label="প্রত্যাখ্যান করুন"><XCircle className="h-4 w-4" /></Button>
            </>
          )}
        </div>
      ),
    },
  ]

  const bulkActions: BulkAction[] = [
    {
      label: 'মুছুন',
      icon: <Trash2 className="size-4" />,
      variant: 'destructive',
      handler: handleBulkDelete,
      disabled: processing,
    },
  ]

  const filters = (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ব্যবহারকারী, কন্টেন্ট বা ট্রানজেকশন ID দিয়ে খুঁজুন..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
              <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
              <SelectItem value="approved">অনুমোদিত</SelectItem>
              <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="মেথড" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব মেথড</SelectItem>
              <SelectItem value="bkash">বিকাশ</SelectItem>
              <SelectItem value="nagad">নগদ</SelectItem>
              <SelectItem value="rocket">রকেট</SelectItem>
            </SelectContent>
          </Select>
          <Select value={contentTypeFilter} onValueChange={(v) => { setContentTypeFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="কন্টেন্ট টাইপ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব কন্টেন্ট</SelectItem>
              <SelectItem value="mcq">MCQ প্রশ্ন</SelectItem>
              <SelectItem value="cq">CQ প্রশ্ন</SelectItem>
              <SelectItem value="lecture">লেকচার</SelectItem>
              <SelectItem value="exam">পরীক্ষা</SelectItem>
              <SelectItem value="suggestion">সাজেশন</SelectItem>
              <SelectItem value="bundle">বান্ডেল</SelectItem>
              <SelectItem value="board-mcq">বোর্ড MCQ</SelectItem>
              <SelectItem value="board-cq">বোর্ড CQ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )

  if (loading && payments.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-emerald-600" /> পেমেন্ট ব্যবস্থাপনা
        </h1>
        <p className="text-muted-foreground text-sm mt-1">পেমেন্ট অনুরোধ পর্যালোচনা ও পরিচালনা করুন</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">মোট আয়</p><p className="text-xl font-bold">৳{totalRevenue.toLocaleString("bn-BD")}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30"><Clock className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">অপেক্ষমান</p><p className="text-xl font-bold">{pendingCount}টি</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">অনুমোদিত</p><p className="text-xl font-bold">{approvedCount}টি</p></div>
        </CardContent></Card>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={payments}
        total={total}
        page={page}
        pageSize={perPage}
        onPageChange={setPage}
        onPageSizeChange={setPerPage}
        loading={loading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো পেমেন্ট পাওয়া যায়নি"
        filters={filters}
      />

      {/* Detail Modal */}
      <Dialog open={!!detailPayment} onOpenChange={() => setDetailPayment(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>পেমেন্ট বিস্তারিত</DialogTitle></DialogHeader>
          {detailPayment && (
            <div className="space-y-4">
              {detailPayment.screenshot ? (
                <div className="rounded-lg overflow-hidden border border-border/50">
                  <Image
                    src={detailPayment.screenshot}
                    alt="পেমেন্ট স্ক্রিনশট"
                    width={600}
                    height={300}
                    className="w-full max-h-48 object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">স্ক্রিনশট দেওয়া হয়নি</p>
                  </div>
                </div>
              )}
              <Separator />

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  {renderContentTypeIcon(detailPayment.contentType)}
                  <span className="font-semibold text-sm">ক্রয়ের তথ্য</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">কন্টেন্ট:</div>
                  <div className="font-medium line-clamp-2">{detailPayment.contentTitle || '-'}</div>
                  <div className="text-muted-foreground">কন্টেন্টের ধরন:</div>
                  <div className="font-medium">{getLabel(detailPayment.contentType || '') || detailPayment.contentType || '-'}</div>
                  {detailPayment.contentId && (
                    <>
                      <div className="text-muted-foreground">কন্টেন্ট ID:</div>
                      <div className="font-mono text-xs">{detailPayment.contentId}</div>
                    </>
                  )}
                  <div className="text-muted-foreground">মূল্য:</div>
                  <div className="font-semibold">৳{detailPayment.amount}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">ব্যবহারকারী:</span></div>
                <div className="font-medium">{detailPayment.user?.name || 'N/A'}</div>
                <div><span className="text-muted-foreground">ইমেইল:</span></div>
                <div className="font-medium text-xs">{detailPayment.user?.email || '-'}</div>
                <div><span className="text-muted-foreground">ফোন:</span></div>
                <div>{detailPayment.paymentNumber || '-'}</div>
                <div><span className="text-muted-foreground">মেথড:</span></div>
                <div>{methodLabels[detailPayment.method] || detailPayment.method}</div>
                <div><span className="text-muted-foreground">ট্রানজেকশন ID:</span></div>
                <div className="font-mono text-xs">{detailPayment.transactionId}</div>
                <div><span className="text-muted-foreground">তারিখ:</span></div>
                <div>{new Date(detailPayment.createdAt).toLocaleDateString('bn-BD')}</div>
                <div><span className="text-muted-foreground">স্ট্যাটাস:</span></div>
                <div><Badge className={statusColors[detailPayment.status]}>{statusLabels[detailPayment.status]}</Badge></div>
              </div>

              {detailPayment.adminNote && (
                <>
                  <Separator />
                  <div className={`rounded-lg p-3 ${
                    detailPayment.status === 'rejected'
                      ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <div className="flex items-start gap-2">
                      <MessageSquare className={`size-4 mt-0.5 shrink-0 ${
                        detailPayment.status === 'rejected' ? 'text-red-500' : 'text-emerald-500'
                      }`} />
                      <div>
                        <p className="text-xs font-semibold mb-1">
                          {detailPayment.status === 'rejected' ? 'প্রত্যাখ্যানের কারণ' : 'অ্যাডমিন নোট'}
                        </p>
                        <p className="text-sm">{detailPayment.adminNote}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {detailPayment.reviewedAt && (
                <div className="text-xs text-muted-foreground text-center">
                  রিভিউ করা হয়েছে: {new Date(detailPayment.reviewedAt).toLocaleDateString('bn-BD')}
                  {detailPayment.reviewedBy && ` (${detailPayment.reviewedBy})`}
                </div>
              )}

              {detailPayment.status === 'pending' && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                      onClick={() => { setDetailPayment(null); setApproveDialog(detailPayment); setAdminNote('') }}
                    >
                      <CheckCircle className="size-4" /> অনুমোদন
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => { setDetailPayment(null); setRejectDialog(detailPayment); setRejectReason('') }}
                    >
                      <XCircle className="size-4" /> প্রত্যাখ্যান
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailPayment(null)}>বন্ধ করুন</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => { setApproveDialog(null); setAdminNote('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-600" /> পেমেন্ট অনুমোদন
            </DialogTitle>
            <DialogDescription>
              {approveDialog?.user?.name} এর{' '}
              &quot;{approveDialog?.contentTitle || getLabel(approveDialog?.contentType || '') || approveDialog?.contentType}&quot; ক্রয়ের জন্য ৳{approveDialog?.amount} পেমেন্ট অনুমোদন করতে চান?
            </DialogDescription>
          </DialogHeader>

          {approveDialog && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">কন্টেন্ট:</div>
                <div className="font-medium line-clamp-2 flex items-center gap-1.5">
                  {renderContentTypeIcon(approveDialog.contentType)}
                  {approveDialog.contentTitle || getLabel(approveDialog.contentType || '') || approveDialog.contentType}
                </div>
                <div className="text-muted-foreground">মেথড:</div>
                <div className="font-medium">{methodLabels[approveDialog.method] || approveDialog.method}</div>
                <div className="text-muted-foreground">ট্রানজেকশন ID:</div>
                <div className="font-mono text-xs">{approveDialog.transactionId}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="adminNote">অ্যাডমিন নোট (ঐচ্ছিক)</Label>
            <Textarea
              id="adminNote"
              placeholder="অনুমোদনের বিষয়ে কিছু লিখুন..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveDialog(null); setAdminNote('') }}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleApprove} disabled={processing}>
              <CheckCircle className="size-4" /> {processing ? 'প্রক্রিয়াধীন...' : 'অনুমোদন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-destructive" /> পেমেন্ট প্রত্যাখ্যান
            </DialogTitle>
            <DialogDescription>
              {rejectDialog?.user?.name} এর ৳{rejectDialog?.amount} পেমেন্ট প্রত্যাখ্যান করতে চান?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">
                প্রত্যাখ্যানের কারণ লিখুন। ব্যবহারকারী এই কারণ দেখতে পাবেন।
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejectReason">প্রত্যাখ্যানের কারণ *</Label>
            <Textarea
              id="rejectReason"
              placeholder="প্রত্যাখ্যানের কারণ লিখুন..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason('') }}>বাতিল</Button>
            <Button variant="destructive" className="gap-2" onClick={handleReject} disabled={processing || !rejectReason.trim()}>
              <XCircle className="size-4" /> {processing ? 'প্রক্রিয়াধীন...' : 'প্রত্যাখ্যান'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
