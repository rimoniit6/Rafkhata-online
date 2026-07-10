'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useShallowAuth } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { Check,Loader2,Save } from 'lucide-react'
import { useCallback,useEffect,useRef,useState } from 'react'

interface NoteEditorProps {
  contentId: string
  contentType: 'lecture' | 'mcq' | 'cq'
}

export default function NoteEditor({ contentId, contentType }: NoteEditorProps) {
  const { user, isAuthenticated } = useShallowAuth()
  const navigate = useRouterStore((s) => s.navigate)
  const { toast } = useToast()
  const [content, setContent] = useState('')
  const [_noteId, setNoteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const savePromiseRef = useRef<Promise<void> | undefined>(undefined)
  const csrfRef = useRef<string | null>(null)

  useEffect(() => {
    if (!contentId || !user?.id) {
      setLoading(false)
      return
    }
    const init = async () => {
      try {
        const csrfRes = await fetch('/api/csrf-token')
        if (csrfRes.ok) {
          const csrfJson = await csrfRes.json()
          csrfRef.current = csrfJson.token
        }
      } catch { /* ignore */ }

      try {
        const res = await fetch(`/api/notes?contentId=${contentId}&contentType=${contentType}&limit=1`)
        if (res.ok) {
          const json = await res.json()
          const notes = Array.isArray(json.data) ? json.data : []
          if (notes.length > 0) {
            setNoteId(notes[0].id)
            setContent(notes[0].content)
          }
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    init()
  }, [contentId, contentType, user?.id])

  const saveNote = useCallback(async () => {
    if (!isAuthenticated) return
    const trimmed = content.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      const body: Record<string, unknown> = { contentId, contentType, content: trimmed }
      if (!csrfRef.current) {
        const csrfRes = await fetch('/api/csrf-token')
        if (csrfRes.ok) {
          const csrfJson = await csrfRes.json()
          csrfRef.current = csrfJson.token
        }
      }
      if (csrfRef.current) body._csrf = csrfRef.current

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const json = await res.json()
        setNoteId(json.data?.id || null)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }, [content, contentId, contentType, isAuthenticated])

  const handleChange = (value: string) => {
    setContent(value)
    setSaved(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      savePromiseRef.current = saveNote()
    }, 1000)
  }

  const handleLogin = () => {
    toast({ title: 'লগইন প্রয়োজন', description: 'নোট সংরক্ষণ করতে লগইন করুন' })
    navigate('login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          className="w-full h-32 text-sm bg-muted/50 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          placeholder="আপনার নোটস লিখুন..."
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          disabled={!isAuthenticated}
        />
        {!isAuthenticated && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-lg flex items-center justify-center cursor-pointer" onClick={handleLogin}>
            <p className="text-sm text-muted-foreground">নোট লিখতে লগইন করুন</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {content ? `${content.length} অক্ষর` : ''}
        </p>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" /> সংরক্ষণ হচ্ছে...
            </span>
          )}
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="size-3" /> সংরক্ষিত
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={saveNote}
            disabled={saving || !content.trim() || !isAuthenticated}
          >
            <Save className="size-3" />
            সেভ
          </Button>
        </div>
      </div>
    </div>
  )
}
