'use client'

import { useEffect, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import StudentProgressDialog from './StudentProgressDialog'

interface Student {
  id: string
  user: { id: string; name: string | null; email: string; avatar: string | null }
  enrolledAt: string
  source: string
  isActive: boolean
}

interface Props {
  courseId: string
}

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  purchase: { label: 'ক্রয়', color: 'bg-blue-100 text-blue-700' },
  free_enroll: { label: 'ফ্রি এনরোল', color: 'bg-green-100 text-green-700' },
  enrollment: { label: 'এনরোলমেন্ট', color: 'bg-purple-100 text-purple-700' },
}

export default function StudentsTab({ courseId }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => { fetchStudents() }, [courseId])

  async function fetchStudents() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses?action=students&id=${courseId}`)
      const json = await res.json()
      setStudents(json.data?.students || json.students || [])
    } catch { setStudents([]) } finally { setLoading(false) }
  }

  const filtered = students.filter(s =>
    !search || s.user.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ছাত্র খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">মোট {students.length} জন</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">কোনো ছাত্র-ছাত্রী নেই</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const sourceInfo = SOURCE_LABEL[s.source] || { label: s.source, color: 'bg-gray-100 text-gray-700' }
            return (
              <Card
                key={s.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setSelectedUser({ id: s.user.id, name: s.user.name || s.user.email })}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{s.user.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.user.name || 'নাম নেই'}</p>
                    <p className="text-xs text-muted-foreground">{s.user.email}</p>
                  </div>
                  <Badge className={sourceInfo.color}>{sourceInfo.label}</Badge>
                  <Badge variant={s.isActive ? 'default' : 'secondary'}>
                    {s.isActive ? 'একটিভ' : 'নিষ্ক্রিয়'}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedUser && (
        <StudentProgressDialog
          courseId={courseId}
          userId={selectedUser.id}
          userName={selectedUser.name}
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
