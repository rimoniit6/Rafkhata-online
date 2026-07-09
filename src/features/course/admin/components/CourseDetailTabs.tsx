'use client'

import { motion } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Layers, Table2, Users, BarChart3, Settings, CalendarClock, PenSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourseDetail, type TabId } from '../hooks/use-course-detail'
import OverviewTab from './OverviewTab'
import LessonsTab from './LessonsTab'
import SyllabusTab from './SyllabusTab'
import ExamCalendarTab from './ExamCalendarTab'
import AssignmentsTab from './AssignmentsTab'
import StudentsTab from './StudentsTab'
import AnalyticsTab from './AnalyticsTab'
import SettingsTab from './SettingsTab'

interface Props {
  courseId: string
  courseTitle: string
  onBack: () => void
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'ওভারভিউ', icon: BookOpen },
  { id: 'lessons', label: 'পাঠ', icon: Layers },
  { id: 'syllabus', label: 'সিলেবাস', icon: Table2 },
  { id: 'exams', label: 'পরীক্ষার সময়সূচী', icon: CalendarClock },
  { id: 'assignments', label: 'অ্যাসাইনমেন্ট', icon: PenSquare },
  { id: 'students', label: 'ছাত্র-ছাত্রী', icon: Users },
  { id: 'analytics', label: 'এনালাইটিক্স', icon: BarChart3 },
  { id: 'settings', label: 'সেটিংস', icon: Settings },
]

export default function CourseDetailTabs({ courseId, courseTitle, onBack }: Props) {
  const h = useCourseDetail(courseId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h2 className="text-xl font-bold">{courseTitle}</h2>
          <p className="text-sm text-muted-foreground">/admin/courses/{courseId}</p>
        </div>
      </div>

      {h.loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      ) : !h.course ? (
        <div className="py-20 text-center text-muted-foreground">কোর্স লোড করা যায়নি</div>
      ) : (
        <Tabs value={h.activeTab} onValueChange={v => h.setActiveTab(v as TabId)}>
          <TabsList className="w-full flex-wrap">
            {TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <OverviewTab course={h.course} onSave={h.updateCourse} saving={h.saving} onRefresh={h.fetchDetail} />
              </motion.div>
            </TabsContent>

            <TabsContent value="lessons">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <LessonsTab
                  courseId={courseId}
                  lessons={h.lessons}
                  onCreate={h.createLesson}
                  onUpdate={h.updateLesson}
                  onDelete={h.deleteLesson}
                  onReorder={h.reorderLessons}
                  onDuplicate={h.duplicateLesson}
                  onAddNote={h.addNoteToLesson}
                  onRemoveNote={h.removeNoteFromLesson}
                  onAddResource={h.addResourceToLesson}
                  onRemoveResource={h.removeResourceFromLesson}
                  onSetSchedule={h.setScheduleForLesson}
                  onRemoveSchedule={h.removeScheduleFromLesson}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="exams">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ExamCalendarTab
                  courseId={courseId}
                  onAddFromPackage={h.addExamSchedulesFromPackage}
                  onUpdate={h.updateExamSchedule}
                  onRemove={h.removeExamSchedule}
                  onRefresh={h.fetchDetail}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="assignments">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AssignmentsTab courseId={courseId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="syllabus">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <SyllabusTab courseId={courseId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="students">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <StudentsTab courseId={courseId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AnalyticsTab courseId={courseId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="settings">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <SettingsTab courseId={courseId} />
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  )
}
