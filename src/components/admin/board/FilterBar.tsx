'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { memo } from 'react'
import type { ClassItem, SubjectItem } from './types'

interface FilterBarProps {
  search: string
  setSearch: (v: string) => void
  boardFilter: string
  setBoardFilter: (v: string) => void
  yearFilter: string
  setYearFilter: (v: string) => void
  classFilter: string
  setClassFilter: (v: string) => void
  subjectFilter: string
  setSubjectFilter: (v: string) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  setPage: (v: number) => void
  classes: ClassItem[]
  filterSubjects: SubjectItem[]
  boardOptions: { value: string; label: string }[]
}

function FilterBar({
  search, setSearch, boardFilter, setBoardFilter,
  yearFilter, setYearFilter, classFilter, setClassFilter,
  subjectFilter, setSubjectFilter, typeFilter, setTypeFilter,
  setPage, classes, filterSubjects, boardOptions,
}: FilterBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="বোর্ড প্রশ্ন খুঁজুন..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="ধরন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ধরন</SelectItem>
              <SelectItem value="mcq">MCQ</SelectItem>
              <SelectItem value="cq">CQ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={boardFilter} onValueChange={(v) => { setBoardFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="বোর্ড" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব বোর্ড</SelectItem>
              {boardOptions.map((b) => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="সাল"
            value={yearFilter === 'all' ? '' : yearFilter}
            onChange={(e) => { setYearFilter(e.target.value || 'all'); setPage(1) }}
            className="w-full sm:w-32"
          />
          <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="ক্লাস" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ক্লাস</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterSubjects.length > 0 && (
            <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="বিষয়" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব বিষয়</SelectItem>
                {filterSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(FilterBar)