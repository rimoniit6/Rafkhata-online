import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { memo } from 'react'
import { cn, toBengaliNumerals } from '@/lib/utils'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react'

interface RetakeHistoryItem {
  id: string
  set?: { title: string }
  reason?: string
  createdAt: string
  status: 'approved' | 'rejected' | 'pending'
}

interface RetakeSectionProps {
  retakeHistory: RetakeHistoryItem[]
  retakeHistoryOpen: boolean
  onRetakeHistoryOpenChange: (open: boolean) => void
  retakeDialogOpen: boolean
  onRetakeDialogOpenChange: (open: boolean) => void
  retakeReason: string
  onRetakeReasonChange: (reason: string) => void
  retakeSubmitting: boolean
  onSubmitRetake: () => void
}

function RetakeSection({
  retakeHistory,
  retakeHistoryOpen,
  onRetakeHistoryOpenChange,
  retakeDialogOpen,
  onRetakeDialogOpenChange,
  retakeReason,
  onRetakeReasonChange,
  retakeSubmitting,
  onSubmitRetake,
}: RetakeSectionProps) {
  return (
    <>
      {retakeHistory.length > 0 && (
        <div className="mt-6">
          <Collapsible open={retakeHistoryOpen} onOpenChange={onRetakeHistoryOpenChange}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
                <RefreshCw className="size-3" />
                রিটেক ইতিহাস ({toBengaliNumerals(retakeHistory.length)})
                {retakeHistoryOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Card>
                <CardContent className="p-3 space-y-2">
                  {retakeHistory.map((req) => (
                    <div key={req.id} className="flex items-start justify-between gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{req.set?.title || 'সেট'}</p>
                        {req.reason && <p className="text-[11px] text-muted-foreground mt-0.5">{req.reason}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(req.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge className={cn(
                        'text-[10px] shrink-0',
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      )}>
                        {req.status === 'approved' ? 'অনুমোদিত' : req.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমাণ'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      <Dialog open={retakeDialogOpen} onOpenChange={onRetakeDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পুনরায় পরীক্ষার অনুরোধ</DialogTitle>
            <DialogDescription>
              আপনি কি এই পরীক্ষাটি পুনরায় দিতে চান? আপনার অনুরোধটি পর্যালোচনা করে অনুমোদন দেওয়া হবে।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">কারণ (ঐচ্ছিক)</label>
              <Textarea
                placeholder="পুনরায় পরীক্ষা দেওয়ার কারণ লিখুন..."
                value={retakeReason}
                onChange={(e) => onRetakeReasonChange(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onRetakeDialogOpenChange(false)} disabled={retakeSubmitting}>
              বাতিল
            </Button>
            <Button onClick={onSubmitRetake} disabled={retakeSubmitting} className="gap-2">
              {retakeSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {retakeSubmitting ? 'অনুরোধ পাঠানো হচ্ছে...' : 'অনুরোধ জমা দিন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default memo(RetakeSection)