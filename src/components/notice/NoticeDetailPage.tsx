'use client'

import Image from 'next/image'
import React, { useState, useEffect } from 'react'

import {
  ArrowLeft,
  Megaphone,
  Pin,
  FileText,
  ExternalLink,
  Calendar,
  Download,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { useRouterStore } from '@/store/router'
import { cn } from '@/lib/utils'
import {
  getNoticeFromCache,
  setNoticesCache,
  type NoticeRecord,
} from '@/lib/notice-cache'
import { downloadPdf, getFilenameFromUrl } from '@/lib/pdf-download'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

// ─── Constants ──────────────────────────────────────────────────

const typeBadgeConfig: Record<
  NoticeRecord['type'],
  { label: string; color: string; bgColor: string; iconBgColor: string }
> = {
  text: {
    label: 'টেক্সট',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/60',
    iconBgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  pdf: {
    label: 'পিডিএফ',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/60',
    iconBgColor: 'bg-orange-100 dark:bg-orange-900/40',
  },
  link: {
    label: 'লিংক',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/60',
    iconBgColor: 'bg-cyan-100 dark:bg-cyan-900/40',
  },
}



// ─── Component ──────────────────────────────────────────────────

export default function NoticeDetailPage() {
  const { params, goBack, navigate } = useRouterStore()
  const { classLevelLabels } = useHierarchyMetadata()
  const [notice, setNotice] = useState<NoticeRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotice = async () => {
      setLoading(true)
      const noticeId = params.noticeId

      // Try cache first
      if (noticeId) {
        const cached = getNoticeFromCache(noticeId)
        if (cached) {
          setNotice(cached)
          setLoading(false)
          return
        }
      }

      // If not in cache, fetch from API
      try {
        const res = await fetch('/api/notices?limit=100')
        if (res.ok) {
          const json = await res.json()
          const data: NoticeRecord[] = Array.isArray(json.data) ? json.data : []
          setNoticesCache(data)
          if (noticeId) {
            const found = data.find((n) => n.id === noticeId)
            if (found) setNotice(found)
          }
        }
      } catch {
        /* */
      } finally {
        setLoading(false)
      }
    }

    fetchNotice()
  }, [params.noticeId])

  // ─── Helpers ────────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // ─── Loading State ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-emerald-500 to-teal-600" />
        <div className="max-w-3xl mx-auto px-4 -mt-6 space-y-4">
          <div className="h-10 w-64 bg-muted/40 rounded-lg animate-pulse" />
          <div className="h-48 bg-muted/30 rounded-xl animate-pulse" />
          <div className="h-32 bg-muted/30 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="animate-fade-in-up text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50 mb-4 mx-auto">
            <Megaphone className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold mb-2">নোটিশ পাওয়া যায়নি</h3>
          <p className="text-sm text-muted-foreground mb-4">
            এই নোটিশটি আর পাওয়া যাচ্ছে না
          </p>
          <Button variant="outline" className="gap-2" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" /> ফিরে যান
          </Button>
        </div>
      </div>
    )
  }

  const badgeConfig = typeBadgeConfig[notice.type]

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative h-28 sm:h-36 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative z-10 flex items-center h-full max-w-3xl mx-auto px-4">
          <div className="animate-fade-in-up flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 -ml-2"
              onClick={goBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                নোটিশ বিস্তারিত
              </h1>
              <p className="text-emerald-100 text-sm mt-0.5">
                নোটিশ পড়ুন ও জানুন
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 -mt-6 pb-8">
        <div className="animate-fade-in-up delay-100">
          <Card className="border-border/50 shadow-lg overflow-hidden">
            {/* Thumbnail */}
            {notice.thumbnail && (
              <div className="relative h-48 sm:h-64 overflow-hidden bg-muted/30">
                <Image
                  src={notice.thumbnail}
                  alt={notice.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <CardContent className="p-5 sm:p-6">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground mb-4 -ml-2"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4" />
                ফিরে যান
              </Button>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold leading-snug mb-3">
                {notice.title}
              </h2>

              {/* Badges Row */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {/* Type Badge */}
                <Badge
                  className={cn(
                    'text-xs h-6 px-2 gap-1 border-0',
                    badgeConfig.bgColor,
                    badgeConfig.color
                  )}
                >
                  {notice.type === 'text' && (
                    <BookOpen className="h-3 w-3" />
                  )}
                  {notice.type === 'pdf' && (
                    <FileText className="h-3 w-3" />
                  )}
                  {notice.type === 'link' && (
                    <ExternalLink className="h-3 w-3" />
                  )}
                  {badgeConfig.label}
                </Badge>

                {/* Pinned Badge */}
                {notice.isPinned && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 text-xs h-6 px-2 gap-1 border-0">
                    <Pin className="h-3 w-3" /> পিন করা
                  </Badge>
                )}

                {/* Class Level Badge */}
                {notice.classLevel && (
                  <Badge
                    variant="outline"
                    className="text-xs h-6 px-2 shrink-0"
                  >
                    {classLevelLabels[notice.classLevel] || notice.classLevel}
                  </Badge>
                )}

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(notice.createdAt)}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/50 mb-5" />

              {/* Content Area */}
              <div className="space-y-4">
                {/* Text Content */}
                {notice.type === 'text' && notice.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <RichContentRenderer
                      content={notice.content}
                      className="text-sm leading-relaxed whitespace-pre-line"
                    />
                  </div>
                )}

                {/* PDF Content */}
                {notice.type === 'pdf' && notice.pdfUrl && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30">
                      <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/40">
                        <FileText className="h-8 w-8 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">
                          {notice.pdfTitle || 'PDF ডকুমেন্ট'}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {notice.pdfUrl}
                        </p>
                      </div>
                    </div>

                    {/* PDF Embed */}
                    <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                      <iframe
                        src={notice.pdfUrl}
                        className="w-full h-[500px] sm:h-[600px]"
                        title={notice.pdfTitle || 'PDF'}
                      />
                    </div>

                    {/* Download Button */}
                    <Button
                      className="gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-600/20"
                      onClick={() => downloadPdf(notice.pdfUrl!, notice.pdfTitle || getFilenameFromUrl(notice.pdfUrl!))}
                    >
                      <Download className="h-4 w-4" />
                      PDF ডাউনলোড
                    </Button>
                  </div>
                )}

                {/* Link Content */}
                {notice.type === 'link' && notice.linkUrl && (
                  <div className="space-y-4">
                    <Card className="border-cyan-200/50 dark:border-cyan-800/30 bg-gradient-to-br from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/10 dark:to-teal-950/10 overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 shrink-0">
                            <ExternalLink className="h-6 w-6 text-cyan-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1">
                              {notice.linkLabel || 'বাহ্যিক লিংক'}
                            </h4>
                            <p className="text-sm text-muted-foreground break-all">
                              {notice.linkUrl}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-cyan-200/30 dark:border-cyan-800/20">
                          <Button
                            asChild
                            className="gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/20 w-full sm:w-auto"
                          >
                            <a
                              href={notice.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                              খুলুন
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Actions */}
        <div className="animate-fade-in-up delay-200 mt-6 flex justify-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('notices')}
          >
            <ArrowLeft className="h-4 w-4" />
            সকল নোটিশে ফিরে যান
          </Button>
        </div>
      </div>
    </div>
  )
}
