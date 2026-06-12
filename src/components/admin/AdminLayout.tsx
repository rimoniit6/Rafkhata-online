'use client'

import React, { useState, useCallback, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileText,
  FileQuestion,
  AlignLeft,
  BookOpen,
  Archive,
  CreditCard,
  ClipboardCheck,
  Image as ImageIcon,
  Bell,
  Megaphone,
  Lightbulb,
  Package,
  Box,
  Settings,
  Menu,
  ChevronLeft,
  ExternalLink,
  LogOut,
  Layers,
  X,
  Upload,
  Star,
  Tags,
  HelpCircle,
  MessageSquareQuote,
  StickyNote,
  Trophy,
  ShoppingCart,
  CalendarCheck,
  Filter,
  GraduationCap,
} from 'lucide-react'
import { useRouterStore, RoutePath, isAdminRoute } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import AdminAuthGuard from './AdminAuthGuard'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSiteConfig } from '@/hooks/use-metadata'
import Image from 'next/image'

// Lazy load admin pages by feature group - only loads the needed page
const AdminPages = {
  // Core
  'admin-dashboard': lazy(() => import('./AdminDashboardPage')),
  'admin-users': lazy(() => import('./AdminUsersPage')),
  'admin-content': lazy(() => import('./AdminContentPage')),
  'admin-hierarchy': lazy(() => import('./AdminHierarchyPage')),
  'admin-bulk-import': lazy(() => import('./AdminBulkImportPage')),  // Questions
  'admin-mcq': lazy(() => import('./AdminMCQPage')),
  'admin-cq': lazy(() => import('./AdminCQPage')),

  // Exams
  'admin-exams': lazy(() => import('./AdminExamsPage')),

  // Content
  'admin-lectures': lazy(() => import('./AdminLecturesPage')),
  'admin-board': lazy(() => import('./AdminBoardPage')),
  'admin-notices': lazy(() => import('./AdminNoticePage')),
  'admin-suggestions': lazy(() => import('./AdminSuggestionPage')),
  'admin-featured': lazy(() => import('./AdminFeaturedPage')),
  'admin-content-types': lazy(() => import('./AdminContentTypesPage')),
  
  // Bundles & Packages
  'admin-bundles': lazy(() => import('./AdminBundlesPage')),
  'admin-packages': lazy(() => import('./AdminPackagesPage')),
  
  // MCQ Exam
  'admin-mcq-exam-packages': lazy(() => import('@/features/mcq-exam/admin/MCQExamAdminContainer')),
  'admin-mcq-exam-purchases': lazy(() => import('./AdminMCQExamPurchasesPage')),
  
  // CQ Exam
  'admin-cq-exam-packages': lazy(() => import('@/features/cq-exam/admin/CQExamAdminContainer')),
  'admin-exam-results': lazy(() => import('./AdminExamResultsPage')),
  
  // Commerce
  'admin-payments': lazy(() => import('./AdminPaymentsPage')),
  'admin-subscriptions': lazy(() => import('./AdminSubscriptionsPage')),
  'admin-content-purchases': lazy(() => import('./AdminContentPurchasesPage')),
  
  // CMS
  'admin-banners': lazy(() => import('./AdminBannersPage')),
  'admin-notifications': lazy(() => import('./AdminNotificationsPage')),
  'admin-faqs': lazy(() => import('./AdminFAQsPage')),
  'admin-testimonials': lazy(() => import('./AdminTestimonialsPage')),
  'admin-notes': lazy(() => import('./AdminNotesPage')),
  'admin-teacher-moderators': lazy(() => import('./AdminTeacherModeratorsPage')),
  
  // Settings
  'admin-settings': lazy(() => import('./AdminSettingsPage')),
}

interface SidebarItem {
  label: string
  icon: React.ElementType
  route: RoutePath
}

const sidebarItems: SidebarItem[] = [
  { label: 'ড্যাশবোর্ড', icon: LayoutDashboard, route: 'admin-dashboard' },
  { label: 'ব্যবহারকারী', icon: Users, route: 'admin-users' },
  { label: 'কন্টেন্ট', icon: FileText, route: 'admin-content' },
  { label: 'হায়ারার্কি', icon: Layers, route: 'admin-hierarchy' },
  { label: 'বাল্ক ইম্পোর্ট', icon: Upload, route: 'admin-bulk-import' },
  { label: 'MCQ ব্যবস্থাপনা', icon: FileQuestion, route: 'admin-mcq' },
  { label: 'CQ ব্যবস্থাপনা', icon: AlignLeft, route: 'admin-cq' },
  { label: 'লেকচার', icon: BookOpen, route: 'admin-lectures' },
  { label: 'বোর্ড প্রশ্ন', icon: Archive, route: 'admin-board' },
  { label: 'নোটিশ', icon: Megaphone, route: 'admin-notices' },
  { label: 'সাজেশন', icon: Lightbulb, route: 'admin-suggestions' },
  { label: 'পেমেন্ট', icon: CreditCard, route: 'admin-payments' },
  { label: 'এক্সাম', icon: ClipboardCheck, route: 'admin-exams' },
  { label: 'বান্ডেল', icon: Package, route: 'admin-bundles' },
  { label: 'প্যাকেজ', icon: Box, route: 'admin-packages' },
  { label: 'MCQ এক্সাম প্যাকেজ', icon: FileQuestion, route: 'admin-mcq-exam-packages' },
  { label: 'CQ এক্সাম প্যাকেজ', icon: AlignLeft, route: 'admin-cq-exam-packages' },
  { label: 'এক্সাম ফলাফল', icon: Trophy, route: 'admin-exam-results' },
  { label: 'MCQ ক্রয়', icon: ShoppingCart, route: 'admin-mcq-exam-purchases' },
  { label: 'সাবস্ক্রিপশন', icon: CalendarCheck, route: 'admin-subscriptions' },
  { label: 'কন্টেন্ট ক্রয়', icon: Filter, route: 'admin-content-purchases' },
  { label: 'ফিচার্ড কন্টেন্ট', icon: Star, route: 'admin-featured' },
  { label: 'কন্টেন্ট টাইপ', icon: Tags, route: 'admin-content-types' },
  { label: 'ব্যানার', icon: ImageIcon, route: 'admin-banners' },
  { label: 'নোটিফিকেশন', icon: Bell, route: 'admin-notifications' },
  { label: 'FAQ', icon: HelpCircle, route: 'admin-faqs' },
  { label: 'টেস্টিমোনিয়াল', icon: MessageSquareQuote, route: 'admin-testimonials' },
  { label: 'নোট', icon: StickyNote, route: 'admin-notes' },
  { label: 'শিক্ষক ও মডারেটর', icon: GraduationCap, route: 'admin-teacher-moderators' },
  { label: 'সেটিংস', icon: Settings, route: 'admin-settings' },
]

function SidebarContent({
  collapsed,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed: boolean
  onNavigate?: () => void
  onToggleCollapse: () => void
}) {
  const { currentRoute, navigate } = useRouterStore()
  const { user, logout } = useAuthStore()
  const { config } = useSiteConfig()
  const siteName = config?.siteName || 'শিক্ষা বাংলা'

  const handleNavigate = (route: RoutePath) => {
    navigate(route)
    onNavigate?.()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border p-4 shrink-0">
        {config?.logo ? (
          <Image
            src={config.logo}
            alt={siteName}
            width={36}
            height={36}
            className="w-9 h-9 rounded-lg object-contain shrink-0"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shrink-0">
            {siteName.charAt(0)}
          </div>
        )}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-bold text-sm">{siteName}</h1>
              <p className="text-xs text-sidebar-foreground/60">অ্যাডমিন প্যানেল</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation — scrollable when items overflow */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-1 px-2 py-2">
          <TooltipProvider delayDuration={0}>
            {sidebarItems.map((item) => {
              const isActive = currentRoute === item.route
              const Icon = item.icon
              return (
                <Tooltip key={item.route}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleNavigate(item.route)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive &&
                          'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20',
                        collapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          isActive && 'text-emerald-600 dark:text-emerald-400'
                        )}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {isActive && !collapsed && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="font-normal">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </nav>
      </ScrollArea>

      {/* Bottom section — user info + actions */}
      <div className="border-t border-sidebar-border p-3 space-y-2 shrink-0">
        {/* Visit website link */}
        <button
          onClick={() => handleNavigate('home')}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full',
            collapsed && 'justify-center px-2'
          )}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                ওয়েবসাইটে যান
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <Separator className="bg-sidebar-border" />

        {/* Admin user */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2',
            collapsed && 'justify-center px-2'
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.avatar} alt={user?.name || 'User avatar'} />
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
              {user?.name ? getInitials(user.name) : 'A'}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden min-w-0"
              >
                <p className="text-sm font-medium truncate">{user?.name || 'অ্যাডমিন'}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.role === 'SUPER_ADMIN' ? 'সুপার অ্যাডমিন' : 'অ্যাডমিন'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-sidebar-foreground/50 hover:text-destructive"
              onClick={() => {
                logout()
                navigate('home')
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapse toggle - desktop only */}
      <div className="hidden lg:block border-t border-sidebar-border p-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              collapsed && 'rotate-180'
            )}
          />
        </Button>
      </div>
    </div>
  )
}

function AdminContent() {
  const { currentRoute } = useRouterStore()
  const Page = AdminPages[currentRoute as keyof typeof AdminPages] || AdminPages['admin-dashboard']

  return (
    <AdminAuthGuard>
      <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" /></div>}>
        <Page />
      </Suspense>
    </AdminAuthGuard>
  )
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { currentRoute } = useRouterStore()
  const { config } = useSiteConfig()
  const siteName = config?.siteName || 'শিক্ষা বাংলা'

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false)
  }, [])

  if (!isAdminRoute(currentRoute)) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' } as const}
        className="hidden lg:flex flex-col border-r border-sidebar-border shrink-0 overflow-hidden"
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={closeMobileSidebar}
              aria-hidden="true"
            />
            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden shadow-xl"
            >
              {/* Close button */}
              <button
                onClick={closeMobileSidebar}
                className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                aria-label="মেনু বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent
                collapsed={false}
                onNavigate={closeMobileSidebar}
                onToggleCollapse={() => {}}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar for mobile */}
        <header className="lg:hidden flex items-center gap-3 border-b px-4 py-3 bg-card shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="মেনু খুলুন"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            {config?.logo ? (
              <Image
                src={config.logo}
                alt={siteName}
                width={28}
                height={28}
                className="w-7 h-7 rounded-md object-contain"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-xs">
                {siteName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-sm">{siteName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 md:p-6 lg:p-8">
            <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" /></div>}>
              <AdminContent />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
