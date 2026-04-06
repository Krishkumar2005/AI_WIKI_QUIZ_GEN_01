import { create } from 'zustand'
import type { Quiz, AnswerMap } from '../types/index'

interface QuizStore {
  activeQuiz: Quiz | null
  answers: AnswerMap
  submitted: boolean
  setQuiz: (quiz: Quiz) => void
  setAnswer: (questionId: string, option: string) => void
  submitQuiz: () => void
  resetSession: () => void
  score: () => number
  totalAnswered: () => number
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  activeQuiz: null,
  answers: {},
  submitted: false,

  setQuiz: (quiz) => set({ activeQuiz: quiz, answers: {}, submitted: false }),

  setAnswer: (questionId, option) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: option } })),

  submitQuiz: () => set({ submitted: true }),

  resetSession: () => set({ activeQuiz: null, answers: {}, submitted: false }),

  score: () => {
    const { activeQuiz, answers } = get()
    if (!activeQuiz) return 0
    return activeQuiz.questions.reduce(
      (acc, q) => (answers[q.id] === q.correct_answer ? acc + 1 : acc),
      0
    )
  },

  totalAnswered: () => Object.keys(get().answers).length,
}))
