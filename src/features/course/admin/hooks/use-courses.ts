'use client'

import { useCallback, useEffect, useState } from 'react'
import { courseAdminService } from '@/services/api/course-admin.service'
import type { CourseRecord } from '@/services/api/course.service'

export type ViewMode = 'list' | 'form' | 'detail'

export function useCourses() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [detailTitle, setDetailTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const limit = 50

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const result = await courseAdminService.list({
        page, limit, search: search || undefined, status: filterStatus || undefined,
      })
      setCourses(result.courses || [])
      setTotal(result.pagination?.total || 0)
      setTotalPages(result.pagination?.totalPages || 1)
    } catch { setCourses([]) } finally { setLoading(false) }
  }, [page, search, filterStatus])

  useEffect(() => { if (viewMode === 'list') fetchCourses() }, [fetchCourses, viewMode])

  const resetForm = () => {
    setEditId(null)
    setDetailTitle('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await courseAdminService.delete(deleteTarget); setDeleteTarget(null); fetchCourses() }
    catch { }
  }

  return {
    viewMode, setViewMode, editId, setEditId, detailTitle, setDetailTitle,
    loading, courses, total, search, setSearch, filterStatus, setFilterStatus,
    page, setPage, totalPages, deleteTarget, setDeleteTarget,
    showCreate, setShowCreate,
    fetchCourses, resetForm, handleDelete,
  }
}
