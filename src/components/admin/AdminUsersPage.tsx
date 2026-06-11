'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Edit,
  Trash2,
  Crown,
  Users,
  Download,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useTableSelection } from '@/hooks/use-table-selection'
import DataTable, { type ColumnDef, type BulkAction } from '@/components/shared/DataTable'

interface UserRecord {
  id: string
  name: string | null
  email: string
  role: string
  isPremium: boolean
  createdAt: string
}

const roleLabels: Record<string, string> = { student: 'শিক্ষার্থী', admin: 'অ্যাডমিন', super_admin: 'সুপার অ্যাডমিন' }

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [premiumFilter, setPremiumFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editUser, setEditUser] = useState<UserRecord | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editPremium, setEditPremium] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null)
  const [perPage, setPerPage] = useState(10)

  const selection = useTableSelection(users)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(perPage))
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (premiumFilter === 'premium') params.set('isPremium', 'true')
      else if (premiumFilter === 'free') params.set('isPremium', 'false')

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const json = await res.json()
        setUsers(Array.isArray(json.data) ? json.data : [])
        setTotal(json.pagination?.total || 0)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [page, perPage, search, roleFilter, premiumFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const getInitials = (name: string | null) =>
    (name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2)

  const handleSaveUser = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editUser.id, role: editRole, isPremium: editPremium }),
      })
      if (res.ok) {
        toast({ title: 'ব্যবহারকারী আপডেট হয়েছে' })
        setEditUser(null)
        fetchUsers()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleDeleteUser = async () => {
    if (!deleteUser) return
    try {
      const res = await fetch(`/api/admin/users?id=${deleteUser.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'ব্যবহারকারী মুছে ফেলা হয়েছে' }); setDeleteUser(null); fetchUsers() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const res = await fetch(`/api/admin/users?ids=${ids.join(',')}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: `${ids.length} জন ব্যবহারকারী মুছে ফেলা হয়েছে` })
        selection.clearSelection()
        fetchUsers()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const handleBulkRole = async (ids: string[], role: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, role }),
      })
      if (res.ok) {
        toast({ title: `${ids.length} জন ব্যবহারকারীর ভূমিকা আপডেট হয়েছে` })
        selection.clearSelection()
        fetchUsers()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const handleBulkPremium = async (ids: string[], isPremium: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isPremium }),
      })
      if (res.ok) {
        toast({ title: `${ids.length} জন ব্যবহারকারীর প্রিমিয়াম স্ট্যাটাস আপডেট হয়েছে` })
        selection.clearSelection()
        fetchUsers()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const columns: ColumnDef<UserRecord>[] = [
    {
      key: 'name',
      header: 'নাম',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{user.name || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'ইমেইল',
      sortable: true,
      headerClass: 'hidden md:table-cell',
      cellClass: 'hidden md:table-cell text-muted-foreground text-sm',
      render: (user) => user.email,
    },
    {
      key: 'role',
      header: 'ভূমিকা',
      sortable: true,
      render: (user) => (
        <Badge variant="outline" className={
          user.role === 'super_admin' ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
            : user.role === 'admin' ? 'border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400' : ''
        }>
          {roleLabels[user.role] || user.role}
        </Badge>
      ),
    },
    {
      key: 'isPremium',
      header: 'প্রিমিয়াম',
      sortable: true,
      render: (user) => (
        user.isPremium ? (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1"><Crown className="h-3 w-3" /> প্রিমিয়াম</Badge>
        ) : (
          <Badge variant="secondary">ফ্রি</Badge>
        )
      ),
    },
    {
      key: 'createdAt',
      header: 'যোগদান',
      sortable: true,
      headerClass: 'hidden sm:table-cell',
      cellClass: 'hidden sm:table-cell text-muted-foreground text-sm',
      render: (user) => new Date(user.createdAt).toLocaleDateString('bn-BD'),
    },
    {
      key: 'actions',
      header: '',
      cellClass: 'w-10',
      render: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditUser(user); setEditRole(user.role); setEditPremium(user.isPremium) }}>
              <Edit className="h-4 w-4 mr-2" /> সম্পাদনা
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteUser(user)}>
              <Trash2 className="h-4 w-4 mr-2" /> মুছুন
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const bulkActions: BulkAction[] = [
    {
      label: 'মুছুন',
      icon: <Trash2 className="size-4" />,
      variant: 'destructive',
      handler: handleBulkDelete,
    },
    {
      label: 'অ্যাডমিন করুন',
      handler: (ids) => handleBulkRole(ids, 'admin'),
    },
    {
      label: 'শিক্ষার্থী করুন',
      handler: (ids) => handleBulkRole(ids, 'student'),
    },
    {
      label: 'প্রিমিয়াম করুন',
      handler: (ids) => handleBulkPremium(ids, true),
    },
    {
      label: 'ফ্রি করুন',
      handler: (ids) => handleBulkPremium(ids, false),
    },
  ]

  const filters = (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="ভূমিকা" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ভূমিকা</SelectItem>
              <SelectItem value="student">শিক্ষার্থী</SelectItem>
              <SelectItem value="admin">অ্যাডমিন</SelectItem>
              <SelectItem value="super_admin">সুপার অ্যাডমিন</SelectItem>
            </SelectContent>
          </Select>
          <Select value={premiumFilter} onValueChange={(v) => { setPremiumFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="প্রিমিয়াম" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব</SelectItem>
              <SelectItem value="premium">প্রিমিয়াম</SelectItem>
              <SelectItem value="free">ফ্রি</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-32" /></div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-emerald-600" /> ব্যবহারকারী ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground text-sm mt-1">মোট {total} জন ব্যবহারকারী</p>
        </div>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> রপ্তানি</Button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={users}
        total={total}
        page={page}
        pageSize={perPage}
        onPageChange={setPage}
        onPageSizeChange={setPerPage}
        loading={loading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো ব্যবহারকারী পাওয়া যায়নি"
        filters={filters}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>ব্যবহারকারী সম্পাদনা</DialogTitle><DialogDescription>{editUser?.name} এর তথ্য পরিবর্তন করুন</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>ভূমিকা</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">শিক্ষার্থী</SelectItem>
                  <SelectItem value="admin">অ্যাডমিন</SelectItem>
                  <SelectItem value="super_admin">সুপার অ্যাডমিন</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><Label>প্রিমিয়াম</Label><Switch checked={editPremium} onCheckedChange={setEditPremium} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveUser} disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>ব্যবহারকারী মুছুন</DialogTitle>
            <DialogDescription>আপনি কি নিশ্চিত যে {deleteUser?.name} কে মুছে ফেলতে চান?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>মুছুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
