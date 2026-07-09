// Third-party module declarations for packages missing types

declare module 'date-fns' {
  export function format(date: Date | number | string, formatStr: string, options?: Record<string, unknown>): string
  export function subDays(date: Date | number, amount: number): Date
  export function subMonths(date: Date | number, amount: number): Date
  export function startOfDay(date: Date | number): Date
  export function endOfDay(date: Date | number): Date
  export function startOfWeek(date: Date | number, options?: { weekStartsOn?: number }): Date
  export function endOfWeek(date: Date | number, options?: { weekStartsOn?: number }): Date
  export function startOfMonth(date: Date | number): Date
  export function endOfMonth(date: Date | number): Date
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean
  export function isToday(date: Date | number): boolean
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number
  export function addDays(date: Date | number, amount: number): Date
  export function addMonths(date: Date | number, amount: number): Date
  export function parseISO(argument: string): Date
  export function eachDayOfInterval(interval: { start: Date | number; end: Date | number }, options?: { step?: number }): Date[]
}

declare module '@tiptap/react' {
  import { Editor } from '@tiptap/core'
  import { ComponentType, ReactNode } from 'react'

  interface UseEditorOptions {
    extensions?: unknown[]
    content?: string
    onUpdate?: (props: { editor: Editor }) => void
    editorProps?: Record<string, unknown>
    [key: string]: unknown
  }

  export function useEditor(options: UseEditorOptions): Editor | null

  interface EditorContentProps {
    editor: Editor | null
    className?: string
    [key: string]: unknown
  }

  export const EditorContent: ComponentType<EditorContentProps>
}
