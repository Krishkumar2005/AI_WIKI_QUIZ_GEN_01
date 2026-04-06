export interface Question {
  id: string
  text: string
  options: string[]
  correct_answer: string
  position: number
}

export interface Quiz {
  id: string
  url: string
  topic: string
  summary: string
  questions: Question[]
  created_at: string
}

export interface QuizSummary {
  id: string
  url: string
  topic: string
  summary: string
  question_count: number
  created_at: string
}

export interface HistoryResponse {
  ok: boolean
  data: QuizSummary[]
  total: number
  page: number
  per_page: number
}

export type AnswerMap = Record<string, string>
