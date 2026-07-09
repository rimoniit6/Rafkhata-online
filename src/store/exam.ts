import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ExamState {
  currentExamId: string | null
  answers: Record<string, string>
  questionIds: string[]
  timeRemaining: number
  isExamActive: boolean
  examDuration: number | null
  answerCount: number
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
      answerCount: 0,
      startExam: (examId, duration) =>
        set({
          currentExamId: examId,
          answers: {},
          answerCount: 0,
          timeRemaining: duration * 60,
          isExamActive: true,
          examDuration: duration,
        }),
      setAnswer: (questionId, answer) =>
        set((state) => {
          const isNew = !(questionId in state.answers)
          return {
            answers: { ...state.answers, [questionId]: answer },
            answerCount: isNew ? state.answerCount + 1 : state.answerCount,
          }
        }),
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
          answerCount: 0,
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

export const useExamId = () => useExamStore((s) => s.currentExamId)
export const useIsExamActive = () => useExamStore((s) => s.isExamActive)
export const useExamTimeRemaining = () => useExamStore((s) => s.timeRemaining)
export const useExamAnswers = () => useExamStore((s) => s.answers)
export const useExamQuestionIds = () => useExamStore((s) => s.questionIds)
export const useExamAnswerCount = () => useExamStore((s) => s.answerCount)
