'use client'

import { ContentBlock } from './content-block-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import LinkExt from '@tiptap/extension-link'
import UnderlineExt from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Heading,
  Heading1,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Type,
  Underline,
  Undo2,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

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
    onUpdate: ({ editor }: { editor: { getHTML: () => string } }) => {
      onChange({ ...block, content: editor.getHTML() })
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[160px] px-3 py-2 text-sm leading-relaxed',
      },
      transformPastedHTML: (html: string) => {
        return html
      },
      handlePaste: (view: { state: { tr: { insertText: (text: string) => unknown } }; dispatch: (tr: unknown) => void }, event: ClipboardEvent) => {
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

export { ToolbarButton, RichTextBlockEditor }
