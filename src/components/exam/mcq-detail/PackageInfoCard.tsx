import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SafeImage from '@/components/ui/safe-image'
import {
  BookOpen,
  CheckCircle,
  Crown,
  FileQuestion,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { memo } from 'react'
import type { ExamPackageDetail } from '@/components/exam/mcq-exam-detail-utils'

interface PackageInfoCardProps {
  pkgDetail: ExamPackageDetail
  purchased: boolean
  accessSource: 'direct_purchase' | 'course' | 'none'
  onPurchaseClick: () => void
}

function PackageInfoCard({
  pkgDetail,
  purchased,
  accessSource,
  onPurchaseClick,
}: PackageInfoCardProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-5">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-200/50 dark:border-emerald-800/30">
                {pkgDetail.thumbnail ? (
                  <SafeImage
                    src={pkgDetail.thumbnail}
                    alt={pkgDetail.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="size-8 text-emerald-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground mb-1">
                  {pkgDetail.title}
                </h2>
                {pkgDetail.description && (
                  <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    <RichContentRenderer content={pkgDetail.description} inline />
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary" className="gap-1">
                    <FileQuestion className="size-3" />
                    {pkgDetail.examSets?.length || 0}টি সেট
                  </Badge>
                  {purchased ? (
                    accessSource === 'course' ? (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 gap-1">
                        <CheckCircle className="size-3" />
                        কোর্সের মাধ্যমে
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1">
                        <CheckCircle className="size-3" />
                        ক্রয় সম্পন্ন
                      </Badge>
                    )
                  ) : pkgDetail.isPremium && pkgDetail.price > 0 ? (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1">
                      <Crown className="size-3" />
                      ৳{Math.round(pkgDetail.price)}
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      ফ্রি
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {!purchased && pkgDetail.isPremium && pkgDetail.price > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
                  <Crown className="size-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">প্যাকেজটি কিনুন</h3>
                  <p className="text-xs text-muted-foreground">
                    সকল এক্সাম সেটে অংশ নিতে প্যাকেজটি কিনুন
                  </p>
                </div>
                <Button
                  className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shrink-0"
                  onClick={onPurchaseClick}
                >
                  <Crown className="size-4" />
                  ৳{Math.round(pkgDetail.price)} কিনুন
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  )
}

export default memo(PackageInfoCard)
