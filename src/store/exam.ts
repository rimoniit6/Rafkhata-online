import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ExamState {
  currentExamId: string | null
  answers: Record<string, string>
  questionIds: string[]
  timeRemaining: number
  isExamActive: boolean
  examDuration: number | null // in minutes
  startExam: (examId: string, duration: number) => void
  setAnswer: (questionId: string, answer: string) => void
  setQuestionIds: (ids: string[]) => void
  setTimeRemaining: (timeOrUpdater: number | ((prev: number) => number)) => void
  endExam: () => void
  resetExam: () => void
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      currentExamId: null,
      answers: {},
      questionIds: [],
      timeRemaining: 0,
      isExamActive: false,
      examDuration: null,
      startExam: (examId, duration) =>
        set({
          currentExamId: examId,
          answers: {},
          timeRemaining: duration * 60,
          isExamActive: true,
          examDuration: duration,
        }),
      setAnswer: (questionId, answer) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
        })),
      setQuestionIds: (ids) => set({ questionIds: ids }),
      setTimeRemaining: (timeOrUpdater) => set((state) => ({
        timeRemaining: typeof timeOrUpdater === 'function'
          ? (timeOrUpdater as (prev: number) => number)(state.timeRemaining)
          : timeOrUpdater
      })),
      endExam: () => set({ isExamActive: false }),
      resetExam: () =>
        set({
          currentExamId: null,
          answers: {},
          questionIds: [],
          timeRemaining: 0,
          isExamActive: false,
          examDuration: null,
        }),
    }),
    {
      name: 'edu-exam',
    }
  )
)
