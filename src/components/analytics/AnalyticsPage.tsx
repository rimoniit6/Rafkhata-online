'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Radio,
  BarChart3,
  GraduationCap,
  BookOpen,
  FileQuestion,
  AlignLeft,
  CreditCard,
  UserPlus,
  Search,
  Monitor,
  Globe,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouterStore } from '@/store/router'
import type { RoutePath } from '@/store/router'
import AnalyticsFilters from './AnalyticsFilters'
import OverviewDashboard from './OverviewDashboard'
import RevenueDashboard from './RevenueDashboard'
import StudentDashboard from './StudentDashboard'
import RealtimeDashboard from './RealtimeDashboard'
import RetentionDashboard from './RetentionDashboard'
import ConversionDashboard from './ConversionDashboard'
import DropOffDashboard from './DropOffDashboard'
import CoursesDashboard from './CoursesDashboard'
import LecturesDashboard from './LecturesDashboard'
import MCQDashboard from './MCQDashboard'
import CQDashboard from './CQDashboard'
import PaymentsDashboard from './PaymentsDashboard'
import AcquisitionDashboard from './AcquisitionDashboard'
import SearchDashboard from './SearchDashboard'
import DevicesDashboard from './DevicesDashboard'
import GeoDashboard from './GeoDashboard'
import ReportsDashboard from './ReportsDashboard'

export interface TabItem {
  id: string
  label: string
  icon: React.ElementType
  group: 'main' | 'content' | 'analytics'
}

const tabs: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'main' },
  { id: 'revenue', label: 'Revenue', icon: DollarSign, group: 'main' },
  { id: 'students', label: 'Students', icon: Users, group: 'main' },
  { id: 'live', label: 'Live', icon: Radio, group: 'main' },
  { id: 'retention', label: 'Retention', icon: TrendingUp, group: 'analytics' },
  { id: 'conversion', label: 'Funnel', icon: BarChart3, group: 'analytics' },
  { id: 'courses', label: 'Courses', icon: BookOpen, group: 'content' },
  { id: 'lectures', label: 'Lectures', icon: GraduationCap, group: 'content' },
  { id: 'mcq', label: 'MCQ', icon: FileQuestion, group: 'content' },
  { id: 'cq', label: 'CQ', icon: AlignLeft, group: 'content' },
  { id: 'payments', label: 'Payments', icon: CreditCard, group: 'analytics' },
  { id: 'acquisition', label: 'Acquisition', icon: UserPlus, group: 'analytics' },
  { id: 'search', label: 'Search', icon: Search, group: 'analytics' },
  { id: 'devices', label: 'Devices', icon: Monitor, group: 'analytics' },
  { id: 'geo', label: 'Geo', icon: Globe, group: 'analytics' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'analytics' },
]

const TAB_ROUTES: Record<string, RoutePath> = {
  overview: 'admin-analytics',
  revenue: 'admin-analytics-revenue',
  students: 'admin-analytics-students',
  live: 'admin-analytics-realtime',
  retention: 'admin-analytics-retention',
  conversion: 'admin-analytics-conversion',
  courses: 'admin-analytics-courses',
  lectures: 'admin-analytics-lectures',
  mcq: 'admin-analytics-mcq',
  cq: 'admin-analytics-cq',
  payments: 'admin-analytics-payments',
  acquisition: 'admin-analytics-acquisition',
  search: 'admin-analytics-search',
  devices: 'admin-analytics-devices',
  geo: 'admin-analytics-geo',
  reports: 'admin-analytics-reports',
}

export default function AnalyticsPage() {
  const { currentRoute, navigate } = useRouterStore()
  const [showAll, setShowAll] = useState(false)

  const activeTab = currentRoute === 'admin-analytics'
    ? 'overview'
    : currentRoute.replace('admin-analytics-', '') || 'overview'

  const mainTabs = tabs.filter((t) => t.group === 'main')
  const overflowTabs = showAll ? tabs.filter((t) => t.group !== 'main') : tabs.filter((t) => t.group !== 'main').slice(0, 4)

  const handleTabClick = useCallback((tabId: string) => {
    const route = TAB_ROUTES[tabId]
    if (route) navigate(route)
  }, [navigate])

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />
      case 'revenue':
        return <RevenueDashboard />
      case 'students':
        return <StudentDashboard />
      case 'live':
        return <RealtimeDashboard />
      case 'retention':
        return <RetentionDashboard />
      case 'conversion':
        return <ConversionDashboard />
      case 'dropoff':
        return <DropOffDashboard />
      case 'courses':
        return <CoursesDashboard />
      case 'lectures':
        return <LecturesDashboard />
      case 'mcq':
        return <MCQDashboard />
      case 'cq':
        return <CQDashboard />
      case 'payments':
        return <PaymentsDashboard />
      case 'acquisition':
        return <AcquisitionDashboard />
      case 'search':
        return <SearchDashboard />
      case 'devices':
        return <DevicesDashboard />
      case 'geo':
        return <GeoDashboard />
      case 'reports':
        return <ReportsDashboard />
      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="p-4 rounded-full bg-muted mb-4">
              <BarChart3 className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium">{tabs.find((t) => t.id === activeTab)?.label || activeTab} Analytics</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Coming soon</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Business intelligence & performance metrics</p>
        </div>
        <AnalyticsFilters />
      </div>

      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex items-center gap-1 min-w-max">
          {mainTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
          <div className="w-px h-6 bg-border mx-1" />
          {overflowTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
          {tabs.filter((t) => t.group !== 'main').length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-all',
                showAll ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {showAll ? 'Less ▲' : `+${tabs.filter((t) => t.group !== 'main').length - 4} More`}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
