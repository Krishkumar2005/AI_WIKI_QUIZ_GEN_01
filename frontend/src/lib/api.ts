import axios from 'axios'
import type { Quiz, HistoryResponse } from '../types/index'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const http = axios.create({
  baseURL: BASE,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message: string =
      err.response?.data?.error ??
      err.message ??
      'Unknown error'
    return Promise.reject(new Error(message))
  }
)

export const api = {
  generateQuiz: async (url: string): Promise<Quiz> => {
    const res = await http.post<{ ok: boolean; data: Quiz }>('/api/quiz/generate', { url })
    return res.data.data
  },

  getHistory: async (page = 1, perPage = 20): Promise<HistoryResponse> => {
    const res = await http.get<HistoryResponse>('/api/quiz/history', {
      params: { page, per_page: perPage },
    })
    return res.data
  },

  getQuiz: async (id: string): Promise<Quiz> => {
    const res = await http.get<{ ok: boolean; data: Quiz }>(`/api/quiz/${id}`)
    return res.data.data
  },

  deleteQuiz: async (id: string): Promise<void> => {
    await http.delete(`/api/quiz/${id}`)
  },
}
