'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCourses } from './hooks/use-courses'
import CourseList from './components/CourseList'
import CourseDetailTabs from './components/CourseDetailTabs'
import CreateCourseDialog from './components/CreateCourseDialog'

export default function CourseAdminContainer() {
  const h = useCourses()

  return (
    <div className="p-6">
      <AnimatePresence mode="wait">
        {h.viewMode === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <CourseList
              courses={h.courses} loading={h.loading} total={h.total}
              page={h.page} totalPages={h.totalPages} search={h.search}
              filterStatus={h.filterStatus} deleteTarget={h.deleteTarget}
              onSearchChange={h.setSearch}
              onFilterStatusChange={v => { h.setFilterStatus(v === 'all' ? '' : v); h.setPage(1) }}
              onPageChange={h.setPage}
              onAdd={() => h.setShowCreate(true)}
              onEdit={async c => {
                h.setEditId(c.id)
                h.setDetailTitle(c.title)
                h.setViewMode('detail')
              }}
              onDeleteRequest={h.setDeleteTarget}
              onDeleteConfirm={h.handleDelete}
              onDeleteCancel={() => h.setDeleteTarget(null)}
            />
          </motion.div>
        )}

        {h.viewMode === 'detail' && h.editId && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <CourseDetailTabs
              courseId={h.editId}
              courseTitle={h.detailTitle}
              onBack={() => { h.setEditId(null); h.setDetailTitle(''); h.setViewMode('list'); h.fetchCourses() }}
            />
          </motion.div>
        )}

        {h.viewMode === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div>Form</div>
          </motion.div>
        )}
      </AnimatePresence>

      {h.showCreate && (
        <CreateCourseDialog
          onClose={() => h.setShowCreate(false)}
          onCreated={async () => { h.setShowCreate(false); await h.fetchCourses() }}
        />
      )}
    </div>
  )
}
