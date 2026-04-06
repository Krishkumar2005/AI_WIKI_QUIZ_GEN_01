import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, ExternalLink, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { api } from '../lib/api'
import { useQuizStore } from '../store/quizStore'
import { Button, Badge, Spinner, ErrorBox, EmptyState } from '../components/ui/index'
import type { QuizSummary } from '../types/index'

export default function HistoryPage() {
  const navigate = useNavigate()
  const setQuiz  = useQuizStore((s) => s.setQuiz)

  const [quizzes, setQuizzes]   = useState<QuizSummary[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const PER_PAGE   = 10
  const totalPages = Math.ceil(total / PER_PAGE)

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getHistory(p, PER_PAGE)
      setQuizzes(res.data)
      setTotal(res.total)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory(page) }, [page, fetchHistory])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await api.deleteQuiz(id)
      setQuizzes((prev) => prev.filter((q) => q.id !== id))
      setTotal((t) => t - 1)
    } finally {
      setDeleting(null)
    }
  }

  const handleRetake = async (id: string) => {
    try {
      const quiz = await api.getQuiz(id)
      setQuiz(quiz)
      navigate('/quiz')
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="section-label mb-2 block">All Sessions</span>
          <h1 className="display-heading text-3xl sm:text-4xl">Quiz History</h1>
        </div>
        {total > 0 && <Badge>{total} quiz{total !== 1 ? 'zes' : ''}</Badge>}
      </div>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={28} />}
          title="No quizzes yet"
          body="Generate your first quiz from the home page."
        />
      ) : (
        <>
          <div className="space-y-3">
            {quizzes.map((q) => (
              <div key={q.id} className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-parchment-100 flex items-center justify-center mt-0.5">
                  <BookOpen size={16} className="text-ink-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-display font-semibold text-ink-900 truncate">{q.topic}</span>
                    <Badge>{q.question_count} Qs</Badge>
                  </div>
                  <p className="font-mono text-xs text-ink-400 truncate mb-2">
                    {q.url.replace('https://en.wikipedia.org/wiki/', 'wiki/')}
                  </p>
                  <p className="text-sm text-ink-600 line-clamp-2 leading-relaxed">{q.summary}</p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2 ml-2">
                  <span className="font-mono text-[10px] text-ink-300 whitespace-nowrap">
                    {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-ink-400 hover:text-accent-500 hover:bg-parchment-100 transition-colors"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      onClick={() => handleRetake(q.id)}
                      className="px-3 py-1 rounded-lg border border-parchment-300 text-xs text-ink-700 hover:border-accent-400 hover:text-accent-500 transition-all"
                    >
                      Retake
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={deleting === q.id}
                      className="p-1.5 rounded-lg text-ink-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deleting === q.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="px-3 py-2"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="font-mono text-sm text-ink-500">{page} / {totalPages}</span>
              <Button
                variant="ghost"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="px-3 py-2"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
