'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Save, Globe, Phone, Share2, Wallet,
  Database, Download, Upload, Trash2, Shield, AlertTriangle,
  CheckCircle2, XCircle, Loader2, FileJson, RefreshCw, Info, Sparkles, Palette, Terminal,
  MessageSquareText, FileText, Scale,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import ImageUploader from '@/components/ui/image-uploader'
import { cn } from '@/lib/utils'
import AdminFeedbackTab from './AdminFeedbackTab'

const MESSAGE_CONFIG = [
  { key: 'msg_contentComingSoon', label: 'কন্টেন্ট শীঘ্রই আসবে', desc: 'কন্টেন্ট লোড না থাকলে দেখানো বার্তা' },
  { key: 'msg_chaptersComingSoon', label: 'অধ্যায় শীঘ্রই আসবে', desc: 'বিষয়ের অধ্যায় লোড না থাকলে দেখানো বার্তা' },
  { key: 'msg_chapterContentSoon', label: 'অধ্যায় কন্টেন্ট শীঘ্রই আসবে', desc: 'অধ্যায়ের কন্টেন্ট না থাকলে দেখানো বার্তা' },
  { key: 'msg_mcqComingSoon', label: 'MCQ শীঘ্রই আসবে', desc: 'MCQ না থাকলে দেখানো বার্তা' },
  { key: 'msg_cqComingSoon', label: 'CQ শীঘ্রই আসবে', desc: 'সৃজনশীল প্রশ্ন না থাকলে দেখানো বার্তা' },
  { key: 'msg_lectureComingSoon', label: 'লেকচার শীঘ্রই আসবে', desc: 'লেকচার না থাকলে দেখানো বার্তা' },
  { key: 'msg_boardComingSoon', label: 'বোর্ড প্রশ্ন শীঘ্রই আসবে', desc: 'বোর্ড প্রশ্ন না থাকলে দেখানো বার্তা' },
  { key: 'msg_contentLoadError', label: 'কন্টেন্ট লোড ত্রুটি', desc: 'কন্টেন্ট লোড করতে সমস্যা হলে দেখানো বার্তা' },
  { key: 'msg_contentTypeSoon', label: 'কন্টেন্ট টাইপ শীঘ্রই আসবে', desc: 'কন্টেন্ট টাইপ না থাকলে দেখানো বার্তা' },
  { key: 'msg_noQuestionsFound', label: 'প্রশ্ন পাওয়া যায়নি', desc: 'প্রশ্ন না পাওয়া গেলে দেখানো বার্তা' },
  { key: 'msg_footerClassesSoon', label: 'ফুটার শ্রেণি শীঘ্রই আসবে', desc: 'ফুটারে শ্রেণি না থাকলে দেখানো বার্তা' },
  { key: 'msg_footerContactSoon', label: 'ফুটার যোগাযোগ শীঘ্রই আসবে', desc: 'ফুটারে যোগাযোগ তথ্য না থাকলে দেখানো বার্তা' },
  { key: 'msg_subjectsComingSoon', label: 'বিষয় শীঘ্রই আসবে', desc: 'বিষয় না থাকলে দেখানো বার্তা' },
]

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [siteName, setSiteName] = useState('শিক্ষা বাংলা')
  const [siteDescription, setSiteDescription] = useState('বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম')
  const [contactEmail, setContactEmail] = useState('info@shikhabangla.com')
  const [contactPhone, setContactPhone] = useState('+৮৮০ ১৭০০-০০০০০০')
  const [facebook, setFacebook] = useState('https://facebook.com/shikhabangla')
  const [youtube, setYoutube] = useState('https://youtube.com/@shikhabangla')
  const [telegram, setTelegram] = useState('https://t.me/shikhabangla')
  const [bkash, setBkash] = useState('01712345678')
  const [nagad, setNagad] = useState('01812345678')
  const [rocket, setRocket] = useState('01612345678')

  // UI Content states
  const [heroBadge, setHeroBadge] = useState('')
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [statsSubtitle, setStatsSubtitle] = useState('')
  const [footerDescription, setFooterDescription] = useState('')
  const [premiumFeaturesText, setPremiumFeaturesText] = useState('')
  const [mcqFeaturesText, setMcqFeaturesText] = useState('')
  const [searchSuggestionsText, setSearchSuggestionsText] = useState('')

  // Homepage section text states
  const [homepageClassesBadge, setHomepageClassesBadge] = useState('')
  const [homepageClassesTitle, setHomepageClassesTitle] = useState('')
  const [homepageClassesSubtitle, setHomepageClassesSubtitle] = useState('')
  const [homepageBoardTitle, setHomepageBoardTitle] = useState('')
  const [homepageBoardSubtitle, setHomepageBoardSubtitle] = useState('')
  const [homepageMcqTitle, setHomepageMcqTitle] = useState('')
  const [homepageMcqSubtitle, setHomepageMcqSubtitle] = useState('')
  const [homepageFaqTitle, setHomepageFaqTitle] = useState('')
  const [homepageFaqSubtitle, setHomepageFaqSubtitle] = useState('')
  const [homepageTestimonialsTitle, setHomepageTestimonialsTitle] = useState('')
  const [homepageTestimonialsSubtitle, setHomepageTestimonialsSubtitle] = useState('')
  const [homepageStatsTitle, setHomepageStatsTitle] = useState('')
  const [homepageStatsSubtitleState, setHomepageStatsSubtitleState] = useState('')
  const [homepageFeaturedTitle, setHomepageFeaturedTitle] = useState('')
  const [homepageFeaturedSubtitle, setHomepageFeaturedSubtitle] = useState('')
  const [homepagePremiumTitle, setHomepagePremiumTitle] = useState('')
  const [homepagePremiumSubtitle, setHomepagePremiumSubtitle] = useState('')

  // Messages state — single record for dynamic rendering
  const [messages, setMessages] = useState<Record<string, string>>({})

  // SEO states
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [seoAuthor, setSeoAuthor] = useState('')

  // Legal states
  const [privacyContent, setPrivacyContent] = useState('')
  const [termsContent, setTermsContent] = useState('')

  // Appearance tab states
  const [logoUrl, setLogoUrl] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')

  // Database tab states
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<Record<string, { imported: number; errors: number }> | null>(null)
  const [deleteStep, setDeleteStep] = useState(0)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const json = await res.json()
        const map = json.data?.map || json.map || {}
        if (map.siteName) setSiteName(map.siteName)
        if (map.siteDescription) setSiteDescription(map.siteDescription)
        if (map.contactEmail) setContactEmail(map.contactEmail)
        if (map.contactPhone) setContactPhone(map.contactPhone)
        if (map.facebook) setFacebook(map.facebook)
        if (map.youtube) setYoutube(map.youtube)
        if (map.telegram) setTelegram(map.telegram)
        if (map.bkash) setBkash(map.bkash)
        if (map.nagad) setNagad(map.nagad)
        if (map.rocket) setRocket(map.rocket)
        if (map.heroBadge) setHeroBadge(map.heroBadge)
        if (map.heroTitle) setHeroTitle(map.heroTitle)
        if (map.heroSubtitle) setHeroSubtitle(map.heroSubtitle)
        if (map.statsSubtitle) setStatsSubtitle(map.statsSubtitle)
        if (map.footerDescription) setFooterDescription(map.footerDescription)
        if (map.premiumFeatures) {
          try { setPremiumFeaturesText(JSON.parse(map.premiumFeatures).join('\n')) } catch { setPremiumFeaturesText(map.premiumFeatures) }
        }
        if (map.mcqFeatures) {
          try { setMcqFeaturesText(JSON.parse(map.mcqFeatures).join('\n')) } catch { setMcqFeaturesText(map.mcqFeatures) }
        }
        if (map.searchSuggestions) {
          try { setSearchSuggestionsText(JSON.parse(map.searchSuggestions).join('\n')) } catch { setSearchSuggestionsText(map.searchSuggestions) }
        }
        if (map.logo) setLogoUrl(map.logo)
        if (map.favicon) setFaviconUrl(map.favicon)
        // SEO
        if (map.seo_title) setSeoTitle(map.seo_title)
        if (map.seo_description) setSeoDescription(map.seo_description)
        if (map.seo_keywords) setSeoKeywords(map.seo_keywords)
        if (map.seo_author) setSeoAuthor(map.seo_author)
        // Legal
        if (map.privacy_content) setPrivacyContent(map.privacy_content)
        if (map.terms_content) setTermsContent(map.terms_content)
        // Homepage section text
        if (map.homepage_classes_badge) setHomepageClassesBadge(map.homepage_classes_badge)
        if (map.homepage_classes_title) setHomepageClassesTitle(map.homepage_classes_title)
        if (map.homepage_classes_subtitle) setHomepageClassesSubtitle(map.homepage_classes_subtitle)
        if (map.homepage_board_title) setHomepageBoardTitle(map.homepage_board_title)
        if (map.homepage_board_subtitle) setHomepageBoardSubtitle(map.homepage_board_subtitle)
        if (map.homepage_mcq_title) setHomepageMcqTitle(map.homepage_mcq_title)
        if (map.homepage_mcq_subtitle) setHomepageMcqSubtitle(map.homepage_mcq_subtitle)
        if (map.homepage_faq_title) setHomepageFaqTitle(map.homepage_faq_title)
        if (map.homepage_faq_subtitle) setHomepageFaqSubtitle(map.homepage_faq_subtitle)
        if (map.homepage_testimonials_title) setHomepageTestimonialsTitle(map.homepage_testimonials_title)
        if (map.homepage_testimonials_subtitle) setHomepageTestimonialsSubtitle(map.homepage_testimonials_subtitle)
        if (map.homepage_stats_title) setHomepageStatsTitle(map.homepage_stats_title)
        if (map.homepage_stats_subtitle) setHomepageStatsSubtitleState(map.homepage_stats_subtitle)
        if (map.homepage_featured_title) setHomepageFeaturedTitle(map.homepage_featured_title)
        if (map.homepage_featured_subtitle) setHomepageFeaturedSubtitle(map.homepage_featured_subtitle)
        if (map.homepage_premium_title) setHomepagePremiumTitle(map.homepage_premium_title)
        if (map.homepage_premium_subtitle) setHomepagePremiumSubtitle(map.homepage_premium_subtitle)
        // Messages — dynamically load all msg_* keys
        const msgMap: Record<string, string> = {}
        for (const key of Object.keys(map)) {
          if (key.startsWith('msg_')) msgMap[key] = map[key]
        }
        setMessages(msgMap)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const settings = [
        { key: 'siteName', value: siteName },
        { key: 'siteDescription', value: siteDescription },
        { key: 'contactEmail', value: contactEmail },
        { key: 'contactPhone', value: contactPhone },
        { key: 'facebook', value: facebook },
        { key: 'youtube', value: youtube },
        { key: 'telegram', value: telegram },
        { key: 'bkash', value: bkash },
        { key: 'nagad', value: nagad },
        { key: 'rocket', value: rocket },
        { key: 'heroBadge', value: heroBadge },
        { key: 'heroTitle', value: heroTitle },
        { key: 'heroSubtitle', value: heroSubtitle },
        { key: 'statsSubtitle', value: statsSubtitle },
        { key: 'footerDescription', value: footerDescription },
        { key: 'premiumFeatures', value: JSON.stringify(premiumFeaturesText.split('\n').filter(Boolean)) },
        { key: 'mcqFeatures', value: JSON.stringify(mcqFeaturesText.split('\n').filter(Boolean)) },
        { key: 'searchSuggestions', value: JSON.stringify(searchSuggestionsText.split('\n').filter(Boolean)) },
        { key: 'logo', value: logoUrl },
        { key: 'favicon', value: faviconUrl },
        // SEO
        { key: 'seo_title', value: seoTitle, group: 'seo', label: 'সাইট শিরোনাম (SEO Title)' },
        { key: 'seo_description', value: seoDescription, group: 'seo', label: 'সাইট বিবরণ (SEO Description)' },
        { key: 'seo_keywords', value: seoKeywords, group: 'seo', label: 'কীওয়ার্ড (SEO Keywords)' },
        { key: 'seo_author', value: seoAuthor, group: 'seo', label: 'লেখক (SEO Author)' },
        // Legal
        { key: 'privacy_content', value: privacyContent, group: 'legal', label: 'প্রাইভেসি পলিসি কন্টেন্ট' },
        { key: 'terms_content', value: termsContent, group: 'legal', label: 'শর্তাবলী কন্টেন্ট' },
        // Homepage section text
        { key: 'homepage_classes_badge', value: homepageClassesBadge, group: 'homepage', label: 'হিরো ব্যাজ' },
        { key: 'homepage_classes_title', value: homepageClassesTitle, group: 'homepage', label: 'শ্রেণি সেকশন শিরোনাম' },
        { key: 'homepage_classes_subtitle', value: homepageClassesSubtitle, group: 'homepage', label: 'শ্রেণি সেকশন উপশিরোনাম' },
        { key: 'homepage_board_title', value: homepageBoardTitle, group: 'homepage', label: 'বোর্ড প্রশ্ন সেকশন শিরোনাম' },
        { key: 'homepage_board_subtitle', value: homepageBoardSubtitle, group: 'homepage', label: 'বোর্ড প্রশ্ন সেকশন উপশিরোনাম' },
        { key: 'homepage_mcq_title', value: homepageMcqTitle, group: 'homepage', label: 'MCQ সেকশন শিরোনাম' },
        { key: 'homepage_mcq_subtitle', value: homepageMcqSubtitle, group: 'homepage', label: 'MCQ সেকশন উপশিরোনাম' },
        { key: 'homepage_faq_title', value: homepageFaqTitle, group: 'homepage', label: 'FAQ সেকশন শিরোনাম' },
        { key: 'homepage_faq_subtitle', value: homepageFaqSubtitle, group: 'homepage', label: 'FAQ সেকশন উপশিরোনাম' },
        { key: 'homepage_testimonials_title', value: homepageTestimonialsTitle, group: 'homepage', label: 'টেস্টিমোনিয়াল সেকশন শিরোনাম' },
        { key: 'homepage_testimonials_subtitle', value: homepageTestimonialsSubtitle, group: 'homepage', label: 'টেস্টিমোনিয়াল সেকশন উপশিরোনাম' },
        { key: 'homepage_stats_title', value: homepageStatsTitle, group: 'homepage', label: 'পরিসংখ্যান সেকশন শিরোনাম' },
        { key: 'homepage_stats_subtitle', value: homepageStatsSubtitleState, group: 'homepage', label: 'পরিসংখ্যান সেকশন উপশিরোনাম' },
        { key: 'homepage_featured_title', value: homepageFeaturedTitle, group: 'homepage', label: 'ফিচার্ড সেকশন শিরোনাম' },
        { key: 'homepage_featured_subtitle', value: homepageFeaturedSubtitle, group: 'homepage', label: 'ফিচার্ড সেকশন উপশিরোনাম' },
        { key: 'homepage_premium_title', value: homepagePremiumTitle, group: 'homepage', label: 'প্রিমিয়াম ব্যানার শিরোনাম' },
        { key: 'homepage_premium_subtitle', value: homepagePremiumSubtitle, group: 'homepage', label: 'প্রিমিয়াম ব্যানার উপশিরোনাম' },
        // Messages — dynamically from record
        ...Object.entries(messages).map(([key, value]) => ({
          key, value, group: 'messages' as const,
          label: MESSAGE_CONFIG.find(m => m.key === key)?.label || key,
        })),
      ]

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'সংরক্ষণ ব্যর্থ')
      }

      toast({ title: 'সেটিংস সংরক্ষিত হয়েছে' })
    } catch {
      toast({ title: 'ত্রুটি', description: 'সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/database/export')
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `database-backup-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: 'এক্সপোর্ট সফল হয়েছে' })
      } else {
        toast({ title: 'ত্রুটি', description: 'এক্সপোর্ট করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'এক্সপোর্ট করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setImporting(true)
    setImportProgress(0)
    setImportResults(null)
    try {
      const text = await importFile.text()
      const data = JSON.parse(text)

      setImportProgress(10)

      const res = await fetch('/api/admin/database/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      setImportProgress(80)

      if (res.ok) {
        const result = await res.json()
        setImportResults(result.results || null)
        setImportProgress(100)
        toast({ title: 'ইম্পোর্ট সফল হয়েছে' })
      } else {
        const err = await res.json()
        toast({ title: 'ত্রুটি', description: err.error || 'ইম্পোর্ট করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'ফাইল পড়তে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteAll = async () => {
    if (deleteConfirmText !== 'ডিলিট করুন') return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE_ALL_DATA_CONFIRMED' }),
      })
      if (res.ok) {
        toast({ title: 'সকল ডাটা ডিলিট হয়েছে' })
        cancelDelete()
      } else {
        toast({ title: 'ত্রুটি', description: 'ডিলিট করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'ডিলিট করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteStep(0)
    setDeleteConfirmText('')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-emerald-600" /> সেটিংস</h1>
          <p className="text-muted-foreground text-sm mt-1">সাইটের সেটিংস পরিচালনা করুন</p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9 max-w-4xl">
          <TabsTrigger value="general">সাধারণ</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="size-3.5" />
            উপস্থিতি
          </TabsTrigger>
          <TabsTrigger value="ui-content">হোমপেজ</TabsTrigger>
          <TabsTrigger value="messages">মেসেজ</TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquareText className="size-3.5" />
            ফিডব্যাক
          </TabsTrigger>
          <TabsTrigger value="contact">যোগাযোগ</TabsTrigger>
          <TabsTrigger value="payment">পেমেন্ট</TabsTrigger>
          <TabsTrigger value="legal" className="gap-1.5">
            <Scale className="size-3.5" />
            লিগ্যাল
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-1.5">
            <Database className="size-3.5" />
            ডাটাবেজ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-5 w-5 text-emerald-600" /> সাইট তথ্য</CardTitle>
              <CardDescription>ওয়েবসাইটের সাধারণ তথ্য কনফিগার করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>সাইটের নাম</Label><Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="সাইটের নাম" /></div>
              <div className="space-y-2"><Label>বিবরণ</Label><Textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} placeholder="সাইটের বিবরণ" rows={3} /></div>
              <Separator />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">SEO সেটিংস</h3>
              <div className="space-y-2"><Label>SEO শিরোনাম</Label><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম" /><p className="text-xs text-muted-foreground">ব্রাউজার ট্যাবে ও সার্চ ইঞ্জিনে দেখানো হবে। ফাঁকা রাখলে সাইটের নাম ব্যবহার হবে।</p></div>
              <div className="space-y-2"><Label>SEO বিবরণ</Label><Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।" rows={3} /></div>
              <div className="space-y-2"><Label>SEO কীওয়ার্ড (কমা দিয়ে আলাদা)</Label><Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="শিক্ষা বাংলা,অনলাইন শিক্ষা,MCQ,বোর্ড প্রশ্ন,HSC,SSC,বাংলাদেশ" /></div>
              <div className="space-y-2"><Label>SEO লেখক</Label><Input value={seoAuthor} onChange={(e) => setSeoAuthor(e.target.value)} placeholder="শিক্ষা বাংলা" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-5 w-5 text-emerald-600" />
                উপস্থিতি সেটিংস
              </CardTitle>
              <CardDescription>সাইটের লোগো ও ফেভিকন আপলোড ও পরিবর্তন করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">লোগো</h3>
                <div className="flex items-start gap-6">
                  {/* Logo Preview */}
                  <div className="shrink-0">
                    {logoUrl ? (
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/30 flex items-center justify-center">
                        <img
                          src={logoUrl}
                          alt="সাইট লোগো"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg">
                            শি
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">ডিফল্ট</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Logo Uploader */}
                  <div className="flex-1 min-w-0">
                    <ImageUploader
                      value={logoUrl}
                      onChange={setLogoUrl}
                      label="সাইট লোগো"
                      placeholder="লোগো ছবি আপলোড করুন বা টেনে আনুন"
                      maxSize={2 * 1024 * 1024}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      হেডার, ফুটার ও এডমিন সাইডবারে এই লোগো দেখানো হবে। PNG, SVG বা WebP ফরম্যাট সুপারিশকৃত। সর্বোচ্চ আকার ২MB।
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Favicon */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ফেভিকন</h3>
                <div className="flex items-start gap-6">
                  {/* Favicon Preview */}
                  <div className="shrink-0">
                    {faviconUrl ? (
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/30 flex items-center justify-center">
                        <img
                          src={faviconUrl}
                          alt="ফেভিকন"
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto rounded bg-gray-400 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">ডিফল্ট</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Favicon Uploader */}
                  <div className="flex-1 min-w-0">
                    <ImageUploader
                      value={faviconUrl}
                      onChange={setFaviconUrl}
                      label="সাইট ফেভিকন"
                      placeholder="ফেভিকন ছবি আপলোড করুন বা টেনে আনুন"
                      accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/gif"
                      maxSize={1 * 1024 * 1024}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      ব্রাউজার ট্যাবে এই আইকন দেখানো হবে। ICO, PNG বা SVG ফরম্যাট সুপারিশকৃত। ৩২×৩২ বা ১৬×১৬ পিক্সেল আকার ভালো। সর্বোচ্চ আকার ১MB।
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <Info className="size-4 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  লোগো ও ফেভিকন পরিবর্তনের পর সংরক্ষণ বাটনে ক্লিক করুন। ব্রাউজারে ফেভিকন দেখতে পেজ রিফ্রেশ করতে হতে পারে।
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ui-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                হোমপেজ সেকশন সেটিংস
              </CardTitle>
              <CardDescription>হোম পেজের প্রতিটি সেকশনের শিরোনাম ও উপশিরোনাম কনফিগার করুন। ফাঁকা রাখলে ডিফল্ট দেখাবে।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">হিরো সেকশন</h3>
                <div className="space-y-2">
                  <Label>হিরো ব্যাজ টেক্সট</Label>
                  <Input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম" />
                  <p className="text-xs text-muted-foreground">হিরো সেকশনের উপরে ছোট ব্যাজে দেখানো হবে</p>
                </div>
                <div className="space-y-2">
                  <Label>হিরো শিরোনাম</Label>
                  <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="বাংলাদেশের সেরা" />
                  <p className="text-xs text-muted-foreground">হিরো সেকশনের প্রধান শিরোনাম</p>
                </div>
                <div className="space-y-2">
                  <Label>হিরো সাবটাইটেল</Label>
                  <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন" rows={2} />
                </div>
              </div>

              <Separator />

              {/* Class Categories Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">শ্রেণি সেকশন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>ব্যাজ</Label><Input value={homepageClassesBadge} onChange={(e) => setHomepageClassesBadge(e.target.value)} placeholder="শিক্ষা যাত্রা" /></div>
                  <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageClassesTitle} onChange={(e) => setHomepageClassesTitle(e.target.value)} placeholder="আপনার ক্লাস বেছে নিন" /></div>
                  <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageClassesSubtitle} onChange={(e) => setHomepageClassesSubtitle(e.target.value)} placeholder="আপনার শ্রেণি অনুযায়ী সকল বিষয় ও কন্টেন্ট দেখুন" /></div>
                </div>
              </div>

              <Separator />

              {/* Board Questions Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">বোর্ড প্রশ্ন সেকশন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageBoardTitle} onChange={(e) => setHomepageBoardTitle(e.target.value)} placeholder="বোর্ড প্রশ্ন সমাধান" /></div>
                  <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageBoardSubtitle} onChange={(e) => setHomepageBoardSubtitle(e.target.value)} placeholder="সকল বোর্ডের বিগত বছরের প্রশ্ন ও সমাধান অনুশীলন করুন" /></div>
                </div>
              </div>

              <Separator />

              {/* MCQ Practice Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">MCQ প্র্যাকটিস সেকশন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageMcqTitle} onChange={(e) => setHomepageMcqTitle(e.target.value)} placeholder="MCQ প্র্যাকটিস" /></div>
                  <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageMcqSubtitle} onChange={(e) => setHomepageMcqSubtitle(e.target.value)} placeholder="সময় নির্ধারিত পরীক্ষায় অংশ নিয়ে নিজেকে যাচাই করুন" /></div>
                </div>
              </div>

              <Separator />

              {/* FAQ Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">FAQ সেকশন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageFaqTitle} onChange={(e) => setHomepageFaqTitle(e.target.value)} placeholder="সচরাচর জিজ্ঞাসা" /></div>
                  <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageFaqSubtitle} onChange={(e) => setHomepageFaqSubtitle(e.target.value)} placeholder="আপনার প্রশ্নের উত্তর এখানে" /></div>
                </div>
              </div>

              <Separator />

              {/* Testimonials Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">টেস্টিমোনিয়াল সেকশন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageTestimonialsTitle} onChange={(e) => setHomepageTestimonialsTitle(e.target.value)} placeholder="শিক্ষার্থীরা যা বলেন" /></div>
                  <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageTestimonialsSubtitle} onChange={(e) => setHomepageTestimonialsSubtitle(e.target.value)} placeholder="আমাদের প্ল্যাটফর্ম ব্যবহারকারী শিক্ষার্থীদের মতামত" /></div>
                </div>
              </div>

              <Separator />

              {/* Stats Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">পরিসংখ্যান সেকশন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageStatsTitle} onChange={(e) => setHomepageStatsTitle(e.target.value)} placeholder="আমাদের অর্জন" /></div>
                  <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageStatsSubtitleState} onChange={(e) => setHomepageStatsSubtitleState(e.target.value)} placeholder="সারা বাংলাদেশের শিক্ষার্থীদের সাথে আমরা এগিয়ে যাচ্ছি" /></div>
                </div>
              </div>

              <Separator />

              {/* Featured Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ফিচার্ড কন্টেন্ট সেকশন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepageFeaturedTitle} onChange={(e) => setHomepageFeaturedTitle(e.target.value)} placeholder="ফিচার্ড কন্টেন্ট" /></div>
                  <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepageFeaturedSubtitle} onChange={(e) => setHomepageFeaturedSubtitle(e.target.value)} placeholder="আমাদের সেরা কন্টেন্টসমূহ" /></div>
                </div>
              </div>

              <Separator />

              {/* Premium Banner Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">প্রিমিয়াম ব্যানার সেকশন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>শিরোনাম</Label><Input value={homepagePremiumTitle} onChange={(e) => setHomepagePremiumTitle(e.target.value)} placeholder="প্রিমিয়াম কন্টেন্ট" /></div>
                  <div className="space-y-2"><Label>উপশিরোনাম</Label><Input value={homepagePremiumSubtitle} onChange={(e) => setHomepagePremiumSubtitle(e.target.value)} placeholder="প্রতিটি কন্টেন্ট আলাদাভাবে কিনুন অথবা বান্ডেলে আকর্ষণীয় ছাড়ে পান!" /></div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ফুটার</h3>
                <div className="space-y-2">
                  <Label>ফুটার বিবরণ</Label>
                  <Textarea value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} placeholder="বাংলাদেশের শিক্ষার্থীদের জন্য সবচেয়ে বিশ্বস্ত অনলাইন শিক্ষা প্ল্যাটফর্ম।" rows={3} />
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ফিচার লিস্ট</h3>
                <div className="space-y-2">
                  <Label>প্রিমিয়াম ফিচারসমূহ (প্রতিটি লাইনে একটি করে)</Label>
                  <Textarea value={premiumFeaturesText} onChange={(e) => setPremiumFeaturesText(e.target.value)} placeholder={'প্রিমিয়াম লেকচার ও কোর্স\nবিস্তারিত MCQ ব্যাখ্যা\nসৃজনশীল প্রশ্নের সমাধান\nবিশেষ সাজেশন ও গাইড\nসকল বোর্ড প্রশ্ন সমাধান'} rows={5} />
                  <p className="text-xs text-muted-foreground">প্রিমিয়াম ব্যানারে দেখানো ফিচার লিস্ট। প্রতিটি ফিচার নতুন লাইনে লিখুন। ফাঁকা রাখলে ডিফল্ট দেখাবে।</p>
                </div>
                <div className="space-y-2">
                  <Label>MCQ প্র্যাকটিস ফিচারসমূহ (প্রতিটি লাইনে একটি করে)</Label>
                  <Textarea value={mcqFeaturesText} onChange={(e) => setMcqFeaturesText(e.target.value)} placeholder={'বিষয়ভিত্তিক পরীক্ষা\nসময় নির্ধারিত পরীক্ষা\nবিস্তারিত ফলাফল ও ব্যাখ্যা\nবোর্ড প্যাটার্ন অনুসারে প্রশ্ন'} rows={4} />
                  <p className="text-xs text-muted-foreground">MCQ প্র্যাকটিস সেকশনে দেখানো ফিচার। ফাঁকা রাখলে ডিফল্ট দেখাবে।</p>
                </div>
              </div>

              <Separator />

              {/* Search */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">সার্চ</h3>
                <div className="space-y-2">
                  <Label>সার্চ সাজেশন (প্রতিটি লাইনে একটি করে)</Label>
                  <Textarea value={searchSuggestionsText} onChange={(e) => setSearchSuggestionsText(e.target.value)} placeholder={'গণিত\nপদার্থবিজ্ঞান\nরসায়ন\nজীববিজ্ঞান\nবাংলা\nইংরেজি'} rows={4} />
                  <p className="text-xs text-muted-foreground">সার্চ পেজে দেখানো সাজেশন টার্ম। ফাঁকা রাখলে ডিফল্ট দেখাবে।</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareText className="h-5 w-5 text-emerald-600" />
                মেসেজ সেটিংস
              </CardTitle>
              <CardDescription>সাইটের বিভিন্ন জায়গায় দেখানো বার্তাগুলো কাস্টমাইজ করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {MESSAGE_CONFIG.map(({ key, label, desc }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    value={messages[key] || ''}
                    onChange={(e) => setMessages(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={label}
                  />
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <AdminFeedbackTab />
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-5 w-5 text-emerald-600" />
                লিগ্যাল পেজ সেটিংস
              </CardTitle>
              <CardDescription>প্রাইভেসি পলিসি ও শর্তাবলী পেজের কন্টেন্ট কাস্টমাইজ করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-emerald-600" />
                  <Label className="text-base font-semibold">প্রাইভেসি পলিসি</Label>
                </div>
                <Textarea
                  value={privacyContent}
                  onChange={(e) => setPrivacyContent(e.target.value)}
                  placeholder="আপনার প্রাইভেসি পলিসি কন্টেন্ট লিখুন..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  এই কন্টেন্ট /privacy পেজে দেখানো হবে। HTML ট্যাগ ব্যবহার করা যাবে।
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Scale className="size-4 text-emerald-600" />
                  <Label className="text-base font-semibold">শর্তাবলী</Label>
                </div>
                <Textarea
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  placeholder="আপনার সেবার শর্তাবলী কন্টেন্ট লিখুন..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  এই কন্টেন্ট /terms পেজে দেখানো হবে। HTML ট্যাগ ব্যবহার করা যাবে।
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Phone className="h-5 w-5 text-emerald-600" /> যোগাযোগ তথ্য</CardTitle>
              <CardDescription>যোগাযোগের তথ্য এবং সোশ্যাল লিংক</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>ইমেইল</Label><Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" /></div>
                <div className="space-y-2"><Label>ফোন</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+৮৮০..." /></div>
              </div>
              <Separator />
              <div className="space-y-2"><Label className="flex items-center gap-2"><Share2 className="h-4 w-4" /> সোশ্যাল মিডিয়া</Label></div>
              <div className="space-y-3">
                <div className="space-y-2"><Label className="text-sm text-muted-foreground">ফেসবুক</Label><Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." /></div>
                <div className="space-y-2"><Label className="text-sm text-muted-foreground">ইউটিউব</Label><Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/..." /></div>
                <div className="space-y-2"><Label className="text-sm text-muted-foreground">টেলিগ্রাম</Label><Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/..." /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-5 w-5 text-emerald-600" /> পেমেন্ট অ্যাকাউন্ট</CardTitle>
              <CardDescription>মোবাইল ব্যাংকিং অ্যাকাউন্ট নম্বর</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-pink-500 flex items-center justify-center text-white text-xs font-bold">ব</div> বিকাশ</Label>
                <Input value={bkash} onChange={(e) => setBkash(e.target.value)} placeholder="বিকাশ নম্বর" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center text-white text-xs font-bold">ন</div> নগদ</Label>
                <Input value={nagad} onChange={(e) => setNagad(e.target.value)} placeholder="নগদ নম্বর" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center text-white text-xs font-bold">র</div> রকেট</Label>
                <Input value={rocket} onChange={(e) => setRocket(e.target.value)} placeholder="রকেট নম্বর" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <div className="space-y-6">
            {/* Super Admin CLI Management Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  সুপার অ্যাডমিন ব্যবস্থাপনা
                </CardTitle>
                <CardDescription>সুপার অ্যাডমিন তৈরি ও পরিচালনার জন্য CLI কমান্ড ব্যবহার করুন</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <Terminal className="size-4 text-blue-600 shrink-0" />
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p><code className="font-mono font-semibold">npm run create-super-admin &lt;email&gt;</code> — ব্যবহারকারীকে সুপার অ্যাডমিন করুন</p>
                    <p><code className="font-mono font-semibold">npm run list-super-admins</code> — সব সুপার অ্যাডমিন দেখুন</p>
                    <p><code className="font-mono font-semibold">npm run revoke-super-admin &lt;email&gt;</code> — সুপার অ্যাডমিনের ভূমিকা প্রত্যাহার করুন</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    সুপার অ্যাডমিন শুধুমাত্র CLI স্ক্রিপ্টের মাধ্যমে তৈরি/পরিবর্তন করা যায়। শেষ সুপার অ্যাডমিনকে সরানো যাবে না।
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Export Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Download className="h-5 w-5 text-blue-600" /> ডাটাবেজ এক্সপোর্ট</CardTitle>
                <CardDescription>সম্পূর্ণ ডাটাবেজের ব্যাকআপ JSON ফাইল হিসেবে ডাউনলোড করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-4">
                  <Info className="size-4 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">এক্সপোর্ট করা JSON ফাইলে সকল ডাটা অন্তর্ভুক্ত থাকবে। এই ফাইল দিয়ে পরে ইম্পোর্ট করা যাবে।</p>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleExport} disabled={exporting}>
                  {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileJson className="size-4" />}
                  {exporting ? 'এক্সপোর্ট হচ্ছে...' : 'এক্সপোর্ট করুন'}
                </Button>
              </CardContent>
            </Card>

            {/* Import Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Upload className="h-5 w-5 text-amber-600" /> ডাটাবেজ ইম্পোর্ট</CardTitle>
                <CardDescription>পূর্বে এক্সপোর্ট করা JSON ব্যাকআপ ফাইল থেকে ডাটা পুনরুদ্ধার করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">ইম্পোর্ট করলে বর্তমান সকল ডাটা মুছে যাবে এবং ফাইলের ডাটা দিয়ে প্রতিস্থাপিত হবে। সুপার অ্যাডমিন .env থেকে পুনরায় তৈরি হবে।</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept=".json" onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResults(null) }}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-950/30 dark:file:text-amber-300" />
                  </div>
                  {importFile && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileJson className="size-4 text-amber-600" />
                      <span>{importFile.name}</span>
                      <Badge variant="secondary" className="text-xs">{(importFile.size / 1024).toFixed(1)} KB</Badge>
                    </div>
                  )}
                  {importing && (
                    <div className="space-y-2">
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">ইম্পোর্ট হচ্ছে... {importProgress}%</p>
                    </div>
                  )}
                  {importResults && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">ইম্পোর্ট ফলাফল:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {Object.entries(importResults).map(([key, val]) => (
                          <div key={key} className="text-xs">
                            <span className="text-muted-foreground">{key}:</span>{' '}
                            <span className="text-emerald-700 dark:text-emerald-300">{val.imported}</span>
                            {val.errors > 0 && <span className="text-red-500 ml-1">({val.errors} ত্রুটি)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={handleImport} disabled={!importFile || importing}>
                    {importing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    {importing ? 'ইম্পোর্ট হচ্ছে...' : 'ইম্পোর্ট করুন'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delete All Data Card */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400"><Trash2 className="h-5 w-5" /> সকল ডাটা ডিলিট</CardTitle>
                <CardDescription>সতর্কতা: এই অপশন সম্পূর্ণ ডাটাবেজ মুছে ফেলবে!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 mb-4">
                  <AlertTriangle className="size-4 text-red-600 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">এই কাজটি অপরিবর্তনীয়! সকল ডাটা ডিলিট হয়ে যাবে। তবে সুপার অ্যাডমিন (.env ফাইল থেকে) পুনরায় তৈরি হবে।</p>
                </div>

                {deleteStep === 0 && (
                  <Button variant="destructive" className="gap-2" onClick={() => setDeleteStep(1)}>
                    <Trash2 className="size-4" /> সকল ডাটা ডিলিট করুন
                  </Button>
                )}

                {deleteStep >= 1 && (
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className={`p-4 rounded-lg border-2 transition-colors ${deleteStep === 1 ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30' : 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`size-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${deleteStep > 1 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                          {deleteStep > 1 ? <CheckCircle2 className="size-4" /> : '১'}
                        </div>
                        <span className="font-medium text-sm">প্রথম ধাপ: আপনি কি নিশ্চিত?</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">সকল ব্যবহারকারী, কন্টেন্ট, পেমেন্ট, প্রশ্ন এবং অন্যান্য ডাটা ডিলিট হয়ে যাবে।</p>
                      {deleteStep === 1 && (
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" onClick={() => setDeleteStep(2)}>হ্যাঁ, আমি নিশ্চিত</Button>
                          <Button variant="outline" size="sm" onClick={cancelDelete}>বাতিল</Button>
                        </div>
                      )}
                    </div>

                    {/* Step 2 */}
                    {deleteStep >= 2 && (
                      <div className={`p-4 rounded-lg border-2 transition-colors ${deleteStep === 2 ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30' : 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`size-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${deleteStep > 2 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                            {deleteStep > 2 ? <CheckCircle2 className="size-4" /> : '২'}
                          </div>
                          <span className="font-medium text-sm">দ্বিতীয় ধাপ: এটি অপরিবর্তনীয়!</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">ডিলিট হলে ডাটা আর ফিরে পাওয়া যাবে না। আপনি কি সত্যিই সব মুছে ফেলতে চান?</p>
                        {deleteStep === 2 && (
                          <div className="flex gap-2">
                            <Button variant="destructive" size="sm" onClick={() => setDeleteStep(3)}>হ্যাঁ, সব মুছে ফেলুন</Button>
                            <Button variant="outline" size="sm" onClick={cancelDelete}>বাতিল</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3 */}
                    {deleteStep >= 3 && (
                      <div className="p-4 rounded-lg border-2 border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/40">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-red-600">৩</div>
                          <span className="font-medium text-sm text-red-700 dark:text-red-300">চূড়ান্ত ধাপ: টাইপ করুন &quot;ডিলিট করুন&quot;</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">নিচের ফিল্ডে <strong className="text-red-600 dark:text-red-400">&quot;ডিলিট করুন&quot;</strong> লিখুন ডিলিট নিশ্চিত করতে:</p>
                        <div className="space-y-3">
                          <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder='ডিলিট করুন' className="border-red-300 focus:border-red-500 dark:border-red-700" />
                          <div className="flex gap-2">
                            <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={deleteConfirmText !== 'ডিলিট করুন' || deleting} className="gap-2">
                              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                              {deleting ? 'ডিলিট হচ্ছে...' : 'সকল ডাটা ডিলিট করুন'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={cancelDelete} disabled={deleting}>বাতিল</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation overlay dialog */}
      <Dialog open={deleteStep >= 1} onOpenChange={(open) => { if (!open) cancelDelete() }}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="size-5" /> সকল ডাটা ডিলিট করুন
          </DialogTitle>
          <DialogDescription className="sr-only">ডাটাবেজ রিসেট কনফার্মেশন</DialogDescription>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    deleteStep > step ? 'bg-emerald-500 text-white' : deleteStep === step ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {deleteStep > step ? <CheckCircle2 className="size-4" /> : step}
                  </div>
                  {step < 3 && <div className={`h-0.5 flex-1 transition-colors ${deleteStep > step ? 'bg-emerald-500' : 'bg-muted'}`} />}
                </React.Fragment>
              ))}
            </div>
            <div className={`p-4 rounded-lg border-2 transition-colors ${deleteStep === 1 ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30' : deleteStep > 1 ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30' : 'border-muted bg-muted/30'}`}>
              <span className="font-medium text-sm">ধাপ ১: আপনি কি নিশ্চিত?</span>
              <p className="text-sm text-muted-foreground mt-1">সকল ডাটা ডিলিট হয়ে যাবে। সুপার অ্যাডমিন .env থেকে পুনরায় তৈরি হবে।</p>
              {deleteStep === 1 && (
                <div className="flex gap-2 mt-3">
                  <Button variant="destructive" size="sm" onClick={() => setDeleteStep(2)}>হ্যাঁ, আমি নিশ্চিত</Button>
                  <Button variant="outline" size="sm" onClick={cancelDelete}>বাতিল</Button>
                </div>
              )}
            </div>
            {deleteStep >= 2 && (
              <div className={`p-4 rounded-lg border-2 transition-colors ${deleteStep === 2 ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30' : deleteStep > 2 ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30' : 'border-muted bg-muted/30'}`}>
                <span className="font-medium text-sm">ধাপ ২: এটি অপরিবর্তনীয়!</span>
                <p className="text-sm text-muted-foreground mt-1">ডাটা আর কখনো ফিরে পাওয়া যাবে না।</p>
                {deleteStep === 2 && (
                  <div className="flex gap-2 mt-3">
                    <Button variant="destructive" size="sm" onClick={() => setDeleteStep(3)}>হ্যাঁ, সব মুছে ফেলুন</Button>
                    <Button variant="outline" size="sm" onClick={cancelDelete}>বাতিল</Button>
                  </div>
                )}
              </div>
            )}
            {deleteStep >= 3 && (
              <div className="p-4 rounded-lg border-2 border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/40">
                <span className="font-medium text-sm text-red-700 dark:text-red-300">ধাপ ৩: টাইপ করুন &quot;ডিলিট করুন&quot;</span>
                <p className="text-sm text-muted-foreground mt-1 mb-3">নিচে <strong className="text-red-600">&quot;ডিলিট করুন&quot;</strong> লিখুন:</p>
                <div className="space-y-3">
                  <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder='ডিলিট করুন' className="border-red-300 focus:border-red-500 dark:border-red-700" autoFocus />
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={deleteConfirmText !== 'ডিলিট করুন' || deleting} className="gap-2">
                      {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      {deleting ? 'ডিলিট হচ্ছে...' : 'সকল ডাটা ডিলিট করুন'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelDelete} disabled={deleting}>বাতিল</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
