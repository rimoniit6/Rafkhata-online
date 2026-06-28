'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ImageUploader from '@/components/ui/image-uploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MathBlock from '@/components/ui/math-block'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { Textarea } from '@/components/ui/textarea'
import { safeParseExcelClient } from '@/lib/excel-parse'
import { detectMathFormat,normalizeMathInput } from '@/lib/math-converter'
import { downloadPdf,getFilenameFromUrl } from '@/lib/pdf-download'
import { cn } from '@/lib/utils'
import LinkExt from '@tiptap/extension-link'
import UnderlineExt from '@tiptap/extension-underline'
import { EditorContent,useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { AnimatePresence,motion } from 'framer-motion'
import {
Bold,
ChevronDown,
ChevronUp,
Code2,
Columns,
Download,
ExternalLink,
Eye,
EyeOff,
FileText,
GitBranch,
GripVertical,
Heading,
Heading1,
ImagePlus,
Italic,
Link,
Link2,
List,
ListOrdered,
Loader2,
Palette,
PenTool,
Plus,
Quote,
Redo2,
Rows,
Sigma,
Sparkles,
Table2,
Trash2,
Type,
Underline,
Undo2,
Upload,
X,
} from 'lucide-react'
import { Markmap } from 'markmap-view'
import Image from 'next/image'
import React,{ memo,useCallback,useEffect,useMemo,useRef,useState } from 'react'

// ─── Block Types ────────────────────────────────────────────────

export type ContentBlock =
  | { id: string; type: 'heading'; level: number; content: string }
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'image'; url: string; caption: string }
  | { id: string; type: 'math'; content: string }
  | { id: string; type: 'data'; headers: string[]; rows: string[][]; caption: string }
  | { id: string; type: 'code'; language: string; content: string }
  | { id: string; type: 'divider' }
  | { id: string; type: 'pdf'; url: string; title: string }
  | { id: string; type: 'link'; url: string; label: string; description: string }
  | { id: string; type: 'richtext'; content: string }
  | { id: string; type: 'mindmap'; data: string; title: string }

interface MindMapNode {
  content: string
  children: MindMapNode[]
}

function createDefaultMindMap(): string {
  const root: MindMapNode = { content: 'কেন্দ্রীয় বিষয়', children: [] }
  return JSON.stringify(root)
}

function parseMindMap(data: string): MindMapNode {
  try {
    const parsed = JSON.parse(data)
    if (typeof parsed.content === 'string') return parsed
    return { content: 'কেন্দ্রীয় বিষয়', children: [] }
  } catch {
    return { content: 'কেন্দ্রীয় বিষয়', children: [] }
  }
}

function addMindMapChild(node: MindMapNode): MindMapNode {
  return {
    ...node,
    children: [...node.children, { content: '', children: [] }],
  }
}

function removeMindMapChild(node: MindMapNode, index: number): MindMapNode {
  return {
    ...node,
    children: node.children.filter((_, i) => i !== index),
  }
}

function updateMindMapNode(node: MindMapNode, path: number[], content: string): MindMapNode {
  if (path.length === 0) {
    return { ...node, content }
  }
  const [idx, ...rest] = path
  return {
    ...node,
    children: node.children.map((child, i) =>
      i === idx ? updateMindMapNode(child, rest, content) : child
    ),
  }
}

function addMindMapChildAt(node: MindMapNode, path: number[]): MindMapNode {
  if (path.length === 0) {
    return addMindMapChild(node)
  }
  const [idx, ...rest] = path
  return {
    ...node,
    children: node.children.map((child, i) =>
      i === idx ? addMindMapChildAt(child, rest) : child
    ),
  }
}

function removeMindMapChildAt(node: MindMapNode, path: number[]): MindMapNode {
  if (path.length === 1) {
    return removeMindMapChild(node, path[0])
  }
  const [idx, ...rest] = path
  return {
    ...node,
    children: node.children.map((child, i) =>
      i === idx ? removeMindMapChildAt(child, rest) : child
    ),
  }
}

function mindMapNodeCount(node: MindMapNode): number {
  return 1 + node.children.reduce((sum, c) => sum + mindMapNodeCount(c), 0)
}

let blockCounter = 0
function generateId() {
  return `block-${Date.now()}-${++blockCounter}`
}

export function createBlock(type: ContentBlock['type']): ContentBlock {
  switch (type) {
    case 'heading':
      return { id: generateId(), type: 'heading', level: 2, content: '' }
    case 'text':
      return { id: generateId(), type: 'text', content: '' }
    case 'image':
      return { id: generateId(), type: 'image', url: '', caption: '' }
    case 'math':
      return { id: generateId(), type: 'math', content: '' }
    case 'data':
      return { id: generateId(), type: 'data', headers: ['কলাম ১', 'কলাম ২'], rows: [['', '']], caption: '' }
    case 'code':
      return { id: generateId(), type: 'code', language: 'javascript', content: '' }
    case 'divider':
      return { id: generateId(), type: 'divider' }
    case 'pdf':
      return { id: generateId(), type: 'pdf', url: '', title: '' }
    case 'link':
      return { id: generateId(), type: 'link', url: '', label: '', description: '' }
    case 'richtext':
      return { id: generateId(), type: 'richtext', content: '' }
    case 'mindmap':
      return { id: generateId(), type: 'mindmap', data: createDefaultMindMap(), title: '' }
    default:
      return { id: generateId(), type: 'text', content: '' }
  }
}

// ─── Block Type Config ──────────────────────────────────────────

const blockTypeConfig: Record<string, { label: string; bnLabel: string; icon: React.ElementType; color: string; bg: string; description: string }> = {
  heading: {
    label: 'Heading',
    bnLabel: 'হেডিং',
    icon: Heading1,
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    description: 'শিরোনাম বা সাবটাইটেল',
  },
  text: {
    label: 'Text',
    bnLabel: 'টেক্সট',
    icon: Type,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    description: 'ম্যাথ সাপোর্ট সহ টেক্সট',
  },
  image: {
    label: 'Image',
    bnLabel: 'ছবি',
    icon: ImagePlus,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    description: 'ছবি আপলোড বা URL',
  },
  math: {
    label: 'Math',
    bnLabel: 'ম্যাথ',
    icon: Sigma,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    description: 'KaTeX সমীকরণ',
  },
  data: {
    label: 'Data',
    bnLabel: 'ডাটা',
    icon: Table2,
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    description: 'টেবিল বা ডাটা গ্রিড',
  },
  code: {
    label: 'Code',
    bnLabel: 'কোড',
    icon: Code2,
    color: 'text-sky-600',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    description: 'কোড স্নিপেট',
  },
  divider: {
    label: 'Divider',
    bnLabel: 'বিভাজক',
    icon: Sparkles,
    color: 'text-gray-500',
    bg: 'bg-gray-50 dark:bg-gray-950/30',
    description: 'বিভাজক রেখা',
  },
  pdf: {
    label: 'PDF',
    bnLabel: 'পিডিএফ',
    icon: FileText,
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    description: 'পিডিএফ ফাইল সংযুক্তি',
  },
  link: {
    label: 'Link',
    bnLabel: 'লিংক',
    icon: Link2,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    description: 'বাহ্যিক লিংক বা রেফারেন্স',
  },
  richtext: {
    label: 'Rich Text',
    bnLabel: 'রিচ টেক্সট',
    icon: PenTool,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    description: 'ব্লগ স্টাইল রিচ টেক্সট',
  },
  mindmap: {
    label: 'Mind Map',
    bnLabel: 'মাইন্ড ম্যাপ',
    icon: GitBranch,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    description: 'মাইন্ড ম্যাপ বা ধারণা চিত্র',
  },
}

// ─── Individual Block Editors ───────────────────────────────────

const HeadingBlockEditor = memo(function HeadingBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'heading' }; onChange: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">স্তর</Label>
        {[1, 2, 3].map((lvl) => (
          <button
            key={lvl}
            type="button"
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              block.level === lvl
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                : 'bg-muted/80 text-muted-foreground hover:bg-muted',
            )}
            onClick={() => onChange({ ...block, level: lvl })}
          >
            H{lvl}
          </button>
        ))}
      </div>
      <Input
        placeholder="হেডিং লিখুন..."
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        className={cn(
          'border-0 bg-muted/30 focus:bg-muted/50 transition-colors px-3',
          block.level === 1 && 'text-xl font-bold',
          block.level === 2 && 'text-lg font-semibold',
          block.level === 3 && 'text-base font-medium',
        )}
      />
    </div>
  )
})

const TextBlockEditor = memo(function TextBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'text' }; onChange: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Sigma className="h-3 w-3" />
        <span>ম্যাথের জন্য <code className="bg-muted/80 px-1 py-0.5 rounded text-[10px]">$...$</code>, <code className="bg-muted/80 px-1 py-0.5 rounded text-[10px]">$$...$$</code> বা <code className="bg-muted/80 px-1 py-0.5 rounded text-[10px]">&lt;math&gt;...&lt;/math&gt;</code> ব্যবহার করুন</span>
      </div>
      <Textarea
        placeholder="টেক্সট লিখুন... (ম্যাথ: $x^2+1$, MathML: <math>...</math>)"
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        rows={4}
        className="border-0 bg-muted/30 focus:bg-muted/50 transition-colors resize-y min-h-[80px]"
      />
    </div>
  )
})

function ImageBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'image' }; onChange: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-3">
      <ImageUploader
        value={block.url}
        onChange={(url) => onChange({ ...block, url })}
        label="ছবি"
        placeholder="ছবি আপলোড করুন বা টেনে আনুন"
      />
      <Input
        placeholder="ছবির ক্যাপশন (ঐচ্ছিক)..."
        value={block.caption}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        className="border-0 bg-muted/30 focus:bg-muted/50 text-sm"
      />
    </div>
  )
}

const MathBlockEditor = memo(function MathBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'math' }; onChange: (b: ContentBlock) => void }) {
  const format = detectMathFormat(block.content)
  const normalized = normalizeMathInput(block.content)
  const hasPreview = block.content.trim().length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sigma className="h-3 w-3" />
          <span>LaTeX বা MathML লিখুন</span>
        </div>
        <div className="flex items-center gap-1.5">
          {block.content && (
            <Badge variant={format === 'mathml' ? 'secondary' : 'default'} className="text-[10px] h-4 px-1.5">
              {format === 'mathml' ? 'MathML' : 'LaTeX'}
            </Badge>
          )}
          {normalized.converted && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-600 border-amber-300">
              → LaTeX
            </Badge>
          )}
        </div>
      </div>

      <Textarea
        placeholder="ম্যাথ সমীকরণ লিখুন... (LaTeX: \frac{-b \pm \sqrt{b^2-4ac}}{2a} বা MathML: <math>...</math>)"
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        rows={3}
        className="font-mono text-sm border-0 bg-muted/30 focus:bg-muted/50 transition-colors"
      />

      {hasPreview && (
        <div className="rounded-lg border border-border/40 bg-white p-4">
          <div className="text-[10px] text-muted-foreground mb-2 font-medium">পূর্বরূপ</div>
          <MathBlock content={normalized.content || block.content} displayMode className="text-base" />
        </div>
      )}
    </div>
  )
})

function DataBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'data' }; onChange: (b: ContentBlock) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')

  const addColumn = () => {
    onChange({
      ...block,
      headers: [...block.headers, `কলাম ${block.headers.length + 1}`],
      rows: block.rows.map((row) => [...row, '']),
    })
  }

  const removeColumn = (idx: number) => {
    if (block.headers.length <= 1) return
    onChange({
      ...block,
      headers: block.headers.filter((_, i) => i !== idx),
      rows: block.rows.map((row) => row.filter((_, i) => i !== idx)),
    })
  }

  const addRow = () => {
    onChange({ ...block, rows: [...block.rows, Array(block.headers.length).fill('')] })
  }

  const removeRow = (idx: number) => {
    if (block.rows.length <= 1) return
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== idx) })
  }

  const updateHeader = (idx: number, value: string) => {
    const newHeaders = [...block.headers]
    newHeaders[idx] = value
    onChange({ ...block, headers: newHeaders })
  }

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = block.rows.map((row, ri) =>
      ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? value : cell)) : row
    )
    onChange({ ...block, rows: newRows })
  }

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setImportError('')

    try {
      const result = await safeParseExcelClient(file)
      const rows = result.rows

      if (!rows || rows.length === 0) {
        setImportError('ফাইলে কোনো ডাটা নেই')
        setImportLoading(false)
        return
      }

      const keys = Object.keys(rows[0])
      if (keys.length === 0) {
        setImportError('ফাইলে কোনো কলাম পাওয়া যায়নি')
        setImportLoading(false)
        return
      }

      const headers = keys.map((_, i) => `কলাম ${i + 1}`)
      const dataRows = rows.map((row) =>
        keys.map((key) => String(row[key] ?? ''))
      )

      onChange({
        ...block,
        headers,
        rows: dataRows.length > 0 ? dataRows : [Array(keys.length).fill('')],
      })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'ফাইল পার্স করতে সমস্যা হয়েছে')
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleExcelImport}
      />

      <div className="overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              {block.headers.map((h, i) => (
                <th key={i} className="border-b border-r border-border/30 p-1.5">
                  <Input
                    value={h}
                    onChange={(e) => updateHeader(i, e.target.value)}
                    className="h-7 text-xs font-semibold border-0 bg-transparent p-1 focus:bg-background"
                  />
                </th>
              ))}
              <th className="w-8 border-b border-border/30 p-1">
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5 hover:bg-destructive/10" onClick={() => removeColumn(block.headers.length - 1)}>
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-muted/20 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="border-r border-b border-border/20 p-1.5">
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="h-7 text-xs border-0 bg-transparent p-1 focus:bg-background"
                      placeholder="..."
                    />
                  </td>
                ))}
                <td className="w-8 border-b border-border/20 p-1 text-center">
                  <Button type="button" variant="ghost" size="icon" className="h-5 w-5 hover:bg-destructive/10" onClick={() => removeRow(ri)}>
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addRow}>
          <Rows className="h-3 w-3" /> সারি যোগ
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addColumn}>
          <Columns className="h-3 w-3" /> কলাম যোগ
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-7 border-teal-300/50 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/30"
          disabled={importLoading}
          onClick={() => fileInputRef.current?.click()}
        >
          {importLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          {importLoading ? 'পার্স হচ্ছে...' : 'Excel ইম্পোর্ট'}
        </Button>
      </div>

      {importError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="h-3 w-3" /> {importError}
        </p>
      )}

      <Input
        placeholder="টেবিলের ক্যাপশন (ঐচ্ছিক)..."
        value={block.caption}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        className="text-xs border-0 bg-muted/30 focus:bg-muted/50"
      />
    </div>
  )
}

function PdfBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'pdf' }; onChange: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-3">
      <ImageUploader
        value={block.url}
        onChange={(url) => onChange({ ...block, url })}
        label="পিডিএফ"
        placeholder="পিডিএফ আপলোড করুন বা URL দিন"
      />
      <Input
        placeholder="পিডিএফ শিরোনাম (ঐচ্ছিক)..."
        value={block.title}
        onChange={(e) => onChange({ ...block, title: e.target.value })}
        className="border-0 bg-muted/30 focus:bg-muted/50 text-sm"
      />
    </div>
  )
}

function LinkBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'link' }; onChange: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="লিংক URL (https://...)"
        value={block.url}
        onChange={(e) => onChange({ ...block, url: e.target.value })}
        className="border-0 bg-muted/30 focus:bg-muted/50 text-sm"
      />
      <Input
        placeholder="লিংক লেবেল..."
        value={block.label}
        onChange={(e) => onChange({ ...block, label: e.target.value })}
        className="border-0 bg-muted/30 focus:bg-muted/50 text-sm"
      />
      <Textarea
        placeholder="বিবরণ (ঐচ্ছিক)..."
        value={block.description}
        onChange={(e) => onChange({ ...block, description: e.target.value })}
        rows={2}
        className="border-0 bg-muted/30 focus:bg-muted/50 transition-colors resize-y min-h-[40px] text-sm"
      />
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  icon: Icon,
  title,
}: {
  onClick: () => void
  active?: boolean
  icon: React.ElementType
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        active
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

function RichTextBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'richtext' }; onChange: (b: ContentBlock) => void }) {
  const prevContentRef = useRef(block.content)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExt,
      LinkExt.configure({ openOnClick: false, autolink: true }),
    ],
    content: block.content,
    onUpdate: ({ editor }) => {
      onChange({ ...block, content: editor.getHTML() })
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[160px] px-3 py-2 text-sm leading-relaxed',
      },
      transformPastedHTML: (html) => {
        return html
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')
        const html = event.clipboardData?.getData('text/html')
        if (html) return false
        if (text && /^https?:\/\/\S+$/i.test(text.trim())) {
          event.preventDefault()
          view.dispatch(view.state.tr.insertText(text.trim()))
          return true
        }
        return false
      },
    },
  })

  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const handleSetLink = () => {
    if (!editor) return
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setLinkDialogOpen(false)
    setLinkUrl('')
  }

  useEffect(() => {
    if (!editor) return
    if (block.content !== prevContentRef.current) {
      prevContentRef.current = block.content
      editor.commands.setContent(block.content, { emitUpdate: false })
    }
  }, [block.content, editor])

  if (!editor) {
    return (
      <div className="space-y-3">
        <div className="h-40 rounded-xl bg-muted/20 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 rounded-lg border border-border/30 bg-muted/20">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} title="বোল্ড" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} title="ইটালিক" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={Underline} title="আন্ডারলাইন" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} icon={Type} title="স্ট্রাইকথ্রু" />

        <span className="w-px h-5 bg-border/40 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} icon={Heading1} title="H1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} icon={Heading} title="H2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} icon={Heading} title="H3" />

        <span className="w-px h-5 bg-border/40 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={List} title="বুলেট লিস্ট" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={ListOrdered} title="নম্বর লিস্ট" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} icon={Quote} title="কোট" />

        <span className="w-px h-5 bg-border/40 mx-1" />

        <ToolbarButton
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run()
            } else {
              const previousUrl = editor.getAttributes('link').href
              setLinkUrl(previousUrl || 'https://')
              setLinkDialogOpen(true)
            }
          }}
          active={editor.isActive('link')}
          icon={Link}
          title="লিংক"
        />

        <span className="w-px h-5 bg-border/40 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} icon={Undo2} title="আনডু" />
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} icon={Redo2} title="রিডু" />
      </div>

      {/* Link dialog */}
      {linkDialogOpen && (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-indigo-200/50 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800/30">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="h-8 text-xs flex-1 border-0 bg-white dark:bg-background"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSetLink()
              if (e.key === 'Escape') setLinkDialogOpen(false)
            }}
          />
          <Button type="button" size="sm" className="h-7 text-xs" onClick={handleSetLink}>সেট</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setLinkDialogOpen(false)}>বাতিল</Button>
        </div>
      )}

      {/* Editor */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden focus-within:border-indigo-300/50 focus-within:ring-1 focus-within:ring-indigo-300/30 transition-all">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function MindMapBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'mindmap' }; onChange: (b: ContentBlock) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const markmapRef = useRef<Markmap | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mindMapData, setMindMapData] = useState<MindMapNode>(() => parseMindMap(block.data))
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    if (!svgRef.current) return
    if (!markmapRef.current) {
      markmapRef.current = Markmap.create(svgRef.current, {
        zoom: true,
        pan: true,
        fitRatio: 1,
      }, mindMapData)
    } else {
      markmapRef.current.setData(mindMapData)
      markmapRef.current.fit()
    }
  }, [mindMapData])

  const commit = (node: MindMapNode) => {
    setMindMapData(node)
    onChange({ ...block, data: JSON.stringify(node) })
  }

  const handleNodeChange = (path: number[], content: string) => {
    commit(updateMindMapNode(mindMapData, path, content))
  }

  const handleAddChild = (path: number[]) => {
    commit(addMindMapChildAt(mindMapData, path))
  }

  const handleRemoveChild = (path: number[]) => {
    commit(removeMindMapChildAt(mindMapData, path))
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setImportError('')

    try {
      const text = await file.text()
      if (!text.trim()) {
        setImportError('ফাইল খালি')
        setImportLoading(false)
        return
      }

      let node: MindMapNode | null = null

      try {
        const parsed = JSON.parse(text)
        if (typeof parsed.content === 'string') {
          node = parsed
        }
      } catch {
        // Not JSON — try markdown
      }

      if (!node) {
        const { Transformer } = await import('markmap-lib')
        const transformer = new Transformer()
        const { root } = transformer.transform(text)
        if (root && typeof root.content === 'string') {
          node = root as unknown as MindMapNode
        }
      }

      if (!node) {
        setImportError('ফাইলের ফরম্যাট সঠিক নয়। JSON বা মার্কডাউন ফাইল ব্যবহার করুন।')
        setImportLoading(false)
        return
      }

      commit(node)
    } catch {
      setImportError('ফাইল পড়তে সমস্যা হয়েছে')
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const renderNodeEditor = (node: MindMapNode, path: number[], depth: number) => (
    <div key={path.join('-')} className="space-y-1.5">
      <div className={cn(
        'flex items-center gap-1.5 rounded-lg transition-colors',
        depth > 0 && 'ml-5 pl-3 border-l-2 border-rose-200/50 dark:border-rose-800/30',
      )}>
        {depth > 0 && (
          <div className="shrink-0 w-2 h-px bg-rose-200/50 dark:bg-rose-800/30" />
        )}
        <Input
          value={node.content}
          onChange={(e) => handleNodeChange(path, e.target.value)}
          placeholder={depth === 0 ? 'মূল বিষয় লিখুন...' : 'উপশাখা লিখুন...'}
          className={cn(
            'h-8 text-xs border-0 bg-muted/20 focus:bg-muted/40 flex-1',
            depth === 0 && 'font-semibold text-sm',
          )}
        />
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-rose-100 dark:hover:bg-rose-900/30" onClick={() => handleAddChild(path)} title="শিশু যোগ">
          <Plus className="h-3 w-3 text-rose-500" />
        </Button>
        {depth > 0 && (
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-destructive/10" onClick={() => handleRemoveChild(path)} title="মুছুন">
            <X className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child, idx) =>
            renderNodeEditor(child, [...path, idx], depth + 1)
          )}
        </div>
      )}
    </div>
  )

  if (mindMapNodeCount(mindMapData) === 0) {
    return (
      <div className="space-y-3">
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">মাইন্ড ম্যাপে কোনো ডাটা নেই</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.md,.txt"
        className="hidden"
        onChange={handleFileImport}
      />

      {/* Editor */}
      <div className="rounded-xl border border-border/40 bg-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-muted-foreground">মাইন্ড ম্যাপ এডিটর</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 text-xs h-7 border-rose-300/50 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
            disabled={importLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            {importLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            {importLoading ? 'ইম্পোর্ট হচ্ছে...' : 'JSON/MD ইম্পোর্ট'}
          </Button>
        </div>
        {renderNodeEditor(mindMapData, [], 0)}
        {mindMapData.children.length > 0 && (
          <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-7 mt-2 ml-5" onClick={() => handleAddChild([mindMapData.children.length])}>
            <Plus className="h-3 w-3" /> শাখা যোগ
          </Button>
        )}
        {importError && (
          <p className="text-xs text-red-500 flex items-center gap-1 pt-1">
            <X className="h-3 w-3" /> {importError}
          </p>
        )}
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        <div className="bg-muted/20 px-3 py-1.5 border-b border-border/30">
          <Label className="text-xs font-semibold text-muted-foreground">পূর্বরূপ</Label>
        </div>
        <div className="w-full h-[300px]">
          <svg ref={svgRef} className="w-full h-full" />
        </div>
      </div>

      {/* Caption */}
      <Input
        placeholder="মাইন্ড ম্যাপের ক্যাপশন (ঐচ্ছিক)..."
        value={block.title}
        onChange={(e) => onChange({ ...block, title: e.target.value })}
        className="text-xs border-0 bg-muted/30 focus:bg-muted/50"
      />
    </div>
  )
}

const CodeBlockEditor = memo(function CodeBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'code' }; onChange: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">ভাষা</Label>
        <Input
          placeholder="javascript, python..."
          value={block.language}
          onChange={(e) => onChange({ ...block, language: e.target.value })}
          className="h-7 w-36 text-xs border-0 bg-muted/30 focus:bg-muted/50 font-mono"
        />
      </div>
      <Textarea
        placeholder="কোড লিখুন..."
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        rows={5}
        className="font-mono text-sm border-0 bg-zinc-950 text-zinc-100 focus:bg-zinc-900 transition-colors rounded-xl"
      />
    </div>
  )
})

// ─── Block Renderer (Preview) ───────────────────────────────────

function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <RichContentRenderer
          content={block.content || '(হেডিং)'}
          className={cn(
            block.level === 1 && 'text-xl font-bold',
            block.level === 2 && 'text-lg font-semibold',
            block.level === 3 && 'text-base font-medium',
          )}
        />
      )
    case 'text':
      return block.content ? (
        <RichContentRenderer content={block.content} className="text-sm leading-relaxed" />
      ) : (
        <p className="text-sm text-muted-foreground italic">(টেক্সট)</p>
      )
    case 'image':
      return (
        <div className="text-center">
          {block.url ? (
            <div className="inline-block">
              <Image src={block.url} alt={block.caption || 'ছবি'} width={800} height={400} className="max-w-full max-h-56 mx-auto rounded-xl shadow-sm" unoptimized />
              {block.caption && <p className="text-xs text-muted-foreground mt-2 italic">{block.caption}</p>}
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center gap-2 text-muted-foreground">
              <ImagePlus className="h-8 w-8 opacity-30" />
              <p className="text-xs">(ছবি যোগ করা হয়নি)</p>
            </div>
          )}
        </div>
      )
    case 'math':
      return block.content ? (
        <div className="text-center overflow-x-auto py-3 px-2">
          <MathBlock content={block.content} displayMode className="text-base" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic text-center py-2">(ম্যাথ সমীকরণ)</p>
      )
    case 'data':
      return (
        <div className="overflow-x-auto">
          {block.caption && <p className="text-xs text-muted-foreground mb-2 font-medium">{block.caption}</p>}
          <table className="w-full border-collapse text-xs rounded-lg overflow-hidden">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="border border-border/50 bg-muted/50 px-3 py-1.5 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-muted/20">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-border/30 px-3 py-1.5">
                      <RichContentRenderer content={cell} className="text-xs" inline />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'code':
      return (
        <div className="relative">
          {block.language && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-[9px] h-4 px-1.5 z-10 opacity-70">
              {block.language}
            </Badge>
          )}
          <pre className="bg-zinc-900 text-zinc-100 rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed">
            {block.content || '(কোড)'}
          </pre>
        </div>
      )
    case 'divider':
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border/50" />
          <Sparkles className="h-3 w-3 text-muted-foreground/40" />
          <div className="flex-1 h-px bg-border/50" />
        </div>
      )
    case 'pdf':
      return block.url ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400 truncate">
              {block.title || 'পিডিএফ ফাইল'}
            </p>
            <p className="text-xs text-orange-500/70 truncate">{block.url}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => downloadPdf(block.url!, block.title || getFilenameFromUrl(block.url!))}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              ডাউনলোড
            </button>
            <a
              href={block.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              খুলুন
            </a>
          </div>
        </div>
      ) : (
        <div className="py-4 flex flex-col items-center gap-2 text-muted-foreground">
          <FileText className="h-8 w-8 opacity-30" />
          <p className="text-xs">(পিডিএফ যোগ করা হয়নি)</p>
        </div>
      )
    case 'link':
      return block.url ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200/50 dark:border-cyan-800/30">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
            <ExternalLink className="h-6 w-6 text-cyan-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-cyan-700 dark:text-cyan-400 truncate">
              {block.label || block.url}
            </p>
            <p className="text-xs text-cyan-500/70 truncate">{block.url}</p>
            {block.description && (
              <p className="text-xs text-cyan-600/60 mt-0.5 line-clamp-2">{block.description}</p>
            )}
          </div>
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            খুলুন
          </a>
        </div>
      ) : (
        <div className="py-4 flex flex-col items-center gap-2 text-muted-foreground">
          <Link2 className="h-8 w-8 opacity-30" />
          <p className="text-xs">(লিংক যোগ করা হয়নি)</p>
        </div>
      )
    case 'richtext':
      return block.content ? (
        <RichContentRenderer content={block.content} className="text-sm leading-relaxed" />
      ) : (
        <p className="text-sm text-muted-foreground italic">(রিচ টেক্সট)</p>
      )
    case 'mindmap':
      return <MindMapPreview data={block.data} title={block.title} />
    default:
      return null
  }
}

function MindMapPreview({ data, title }: { data: string; title: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const mmRef = useRef<Markmap | null>(null)
  const node = useMemo(() => parseMindMap(data), [data])

  useEffect(() => {
    if (!svgRef.current) return
    if (!mmRef.current) {
      mmRef.current = Markmap.create(svgRef.current, {
        zoom: true,
        pan: true,
        fitRatio: 1,
      }, node)
    } else {
      mmRef.current.setData(node)
      mmRef.current.fit()
    }
  }, [node])

  if (mindMapNodeCount(node) === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm italic">(মাইন্ড ম্যাপ)</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {title && <p className="text-xs text-muted-foreground font-medium">{title}</p>}
      <div className="w-full h-[300px] rounded-lg border border-border/30 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  )
}

// ─── Single Block Wrapper ───────────────────────────────────────

const BlockItem = memo(function BlockItem({
  block,
  blockId,
  onUpdate,
  onRemove,
  onMove,
  onDuplicate,
  isFirst,
  isLast,
  index,
  total: _total,
}: {
  block: ContentBlock
  blockId: string
  onUpdate: (id: string, updated: ContentBlock) => void
  onRemove: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
  onDuplicate: (id: string) => void
  isFirst: boolean
  isLast: boolean
  index: number
  total: number
}) {
  const [collapsed, setCollapsed] = useState(false)
  const config = blockTypeConfig[block.type]
  const Icon = config.icon

  // Stable handlers that don't change between renders (blockId is stable, onUpdate/onRemove/etc. are stable refs)
  const handleChange = useCallback((updated: ContentBlock) => {
    onUpdate(blockId, updated)
  }, [blockId, onUpdate])

  const handleRemove = useCallback(() => {
    onRemove(blockId)
  }, [blockId, onRemove])

  const handleMoveUp = useCallback(() => {
    onMove(blockId, 'up')
  }, [blockId, onMove])

  const handleMoveDown = useCallback(() => {
    onMove(blockId, 'down')
  }, [blockId, onMove])

  const handleDuplicate = useCallback(() => {
    onDuplicate(blockId)
  }, [blockId, onDuplicate])

  return (
    <div
      className="group relative rounded-xl border border-border/50 bg-card hover:border-border hover:shadow-sm transition-all"
    >
      {/* Block Header */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border/30',
        config.bg,
      )}>
        <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />

        {/* Block type badge */}
        <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium', config.color)}>
          <Icon className="h-3.5 w-3.5" />
          {config.bnLabel}
        </div>

        {/* Block number */}
        <span className="text-[10px] text-muted-foreground/50">
          #{index + 1}
        </span>

        <div className="flex-1" />

        {/* Actions - visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="p-1 rounded-md hover:bg-background/80 text-muted-foreground disabled:opacity-30 transition-colors"
            disabled={isFirst}
            onClick={handleMoveUp}
            title="উপরে সরান"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-md hover:bg-background/80 text-muted-foreground disabled:opacity-30 transition-colors"
            disabled={isLast}
            onClick={handleMoveDown}
            title="নিচে সরান"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-md hover:bg-background/80 text-muted-foreground transition-colors"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'সম্পাদনা' : 'প্রিভিউ'}
          >
            {collapsed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            className="p-1 rounded-md hover:bg-background/80 text-muted-foreground transition-colors"
            onClick={handleDuplicate}
            title="ডুপ্লিকেট"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-destructive transition-colors"
            onClick={handleRemove}
            title="মুছুন"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Block Content */}
      <div className="p-3">
        {collapsed ? (
          <div className="py-2 px-1">
            <BlockPreview block={block} />
          </div>
        ) : (
          <>
            {block.type === 'heading' && <HeadingBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'text' && <TextBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'image' && <ImageBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'math' && <MathBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'data' && <DataBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'code' && <CodeBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'pdf' && <PdfBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'link' && <LinkBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'richtext' && <RichTextBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'mindmap' && <MindMapBlockEditor block={block} onChange={handleChange} />}
            {block.type === 'divider' && (
              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[11px] text-muted-foreground">বিভাজক</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})

// ─── Add Block Menu ─────────────────────────────────────────────

function AddBlockMenu({ onAdd }: { onAdd: (type: ContentBlock['type']) => void }) {
  const [open, setOpen] = useState(false)

  const types: ContentBlock['type'][] = ['heading', 'text', 'image', 'math', 'data', 'code', 'divider', 'pdf', 'link', 'richtext', 'mindmap']

  return (
    <div className="space-y-0">
      <button
        type="button"
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
          'border-2 border-dashed border-border/50 hover:border-emerald-400/60',
          'text-sm text-muted-foreground hover:text-emerald-600',
          'bg-transparent hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10',
          'transition-all duration-200',
        )}
        onClick={() => setOpen(!open)}
      >
        <Plus className="h-4 w-4" />
        ব্লক যোগ করুন
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' } as const}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {/* Section title */}
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  ব্লকের ধরন নির্বাচন করুন
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              {/* Grid of block types */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {types.map((type, idx) => {
                  const config = blockTypeConfig[type]
                  const Icon = config.icon
                  return (
                    <motion.button
                      key={type}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all',
                        'border border-border/40 hover:border-border',
                        'bg-card hover:shadow-md',
                        'group/card',
                      )}
                      onClick={() => {
                        onAdd(type)
                        setOpen(false)
                      }}
                    >
                      <div className={cn(
                        'p-2.5 rounded-xl transition-transform group-hover/card:scale-110',
                        config.bg,
                      )}>
                        <Icon className={cn('h-5 w-5', config.color)} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{config.bnLabel}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{config.description}</div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Close button */}
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-3 w-3" />
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Content Block Editor ──────────────────────────────────

interface ContentBlockEditorProps {
  blocks: ContentBlock[]
  onChange?: (blocks: ContentBlock[]) => void
  previewMode?: boolean
}

export default function ContentBlockEditor({ blocks, onChange, previewMode = false }: ContentBlockEditorProps) {
  const noop = useCallback(() => {}, [])
  const onChangeRef = useRef(onChange ?? noop)
  useEffect(() => { onChangeRef.current = onChange ?? noop })

  const blocksRef = useRef(blocks)
  useEffect(() => { blocksRef.current = blocks })

  const updateBlock = useCallback((id: string, updated: ContentBlock) => {
    onChangeRef.current(blocksRef.current.map((b) => (b.id === id ? updated : b)))
  }, [])

  const removeBlock = useCallback((id: string) => {
    onChangeRef.current(blocksRef.current.filter((b) => b.id !== id))
  }, [])

  const addBlock = useCallback((type: ContentBlock['type'], afterId?: string) => {
    const newBlock = createBlock(type)
    const currentBlocks = blocksRef.current
    if (afterId) {
      const idx = currentBlocks.findIndex((b) => b.id === afterId)
      const newBlocks = [...currentBlocks]
      newBlocks.splice(idx + 1, 0, newBlock)
      onChangeRef.current(newBlocks)
    } else {
      onChangeRef.current([...currentBlocks, newBlock])
    }
  }, [])

  const duplicateBlock = useCallback((id: string) => {
    const currentBlocks = blocksRef.current
    const idx = currentBlocks.findIndex((b) => b.id === id)
    if (idx === -1) return
    const source = currentBlocks[idx]
    const newBlock = { ...source, id: generateId() }
    const newBlocks = [...currentBlocks]
    newBlocks.splice(idx + 1, 0, newBlock)
    onChangeRef.current(newBlocks)
  }, [])

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    const currentBlocks = blocksRef.current
    const idx = currentBlocks.findIndex((b) => b.id === id)
    if (direction === 'up' && idx > 0) {
      const newBlocks = [...currentBlocks]
      ;[newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]]
      onChangeRef.current(newBlocks)
    } else if (direction === 'down' && idx < currentBlocks.length - 1) {
      const newBlocks = [...currentBlocks]
      ;[newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]]
      onChangeRef.current(newBlocks)
    }
  }, [])

  if (previewMode) {
    return (
      <div className="space-y-4">
        {blocks.map((block) => (
          <BlockPreview key={block.id} block={block} />
        ))}
        {blocks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">কোনো কন্টেন্ট ব্লক নেই</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <BlockItem
          key={block.id}
          block={block}
          blockId={block.id}
          onUpdate={updateBlock}
          onRemove={removeBlock}
          onMove={moveBlock}
          onDuplicate={duplicateBlock}
          isFirst={index === 0}
          isLast={index === blocks.length - 1}
          index={index}
          total={blocks.length}
        />
      ))}

      {blocks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 border-2 border-dashed rounded-xl border-border/40 bg-muted/10"
        >
          <Palette className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm font-medium mb-1">কোনো কন্টেন্ট ব্লক নেই</p>
          <p className="text-muted-foreground/60 text-xs">নিচের বাটন থেকে ব্লক যোগ করুন</p>
        </motion.div>
      )}

      <AddBlockMenu onAdd={(type) => addBlock(type)} />

      {/* Block count indicator */}
      {blocks.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground/60 pt-1">
          <span>{blocks.length}টি ব্লক</span>
          <span>·</span>
          <div className="flex items-center gap-1">
            {[...new Set(blocks.map(b => b.type))].map(t => {
              const cfg = blockTypeConfig[t]
              const BIcon = cfg?.icon
              return BIcon ? (
                <span key={t} className={cn('p-0.5 rounded', cfg?.bg)}>
                  <BIcon className={cn('h-2.5 w-2.5', cfg?.color)} />
                </span>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Serialize / Deserialize ────────────────────────────────────

export function serializeBlocks(blocks: ContentBlock[]): string {
  return JSON.stringify(blocks)
}

export function deserializeBlocks(content: string): ContentBlock[] {
  if (!content) return []
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed
    return [{ id: generateId(), type: 'text', content }]
  } catch {
    return [{ id: generateId(), type: 'text', content }]
  }
}
