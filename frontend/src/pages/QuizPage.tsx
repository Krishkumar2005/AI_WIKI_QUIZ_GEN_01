import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { useQuizStore } from '../store/quizStore'
import { Button, ProgressBar, Badge } from '../components/ui/index'

export default function QuizPage() {
  const navigate = useNavigate()
  const { activeQuiz, answers, submitted, setAnswer, submitQuiz, totalAnswered } =
    useQuizStore()

  useEffect(() => {
    if (!activeQuiz) navigate('/', { replace: true })
  }, [activeQuiz, navigate])

  if (!activeQuiz) return null

  const { questions, topic, summary, url } = activeQuiz
  const answered    = totalAnswered()
  const allAnswered = answered === questions.length

  const handleSubmit = () => {
    if (!allAnswered) return
    submitQuiz()
    navigate('/results')
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <span className="section-label mb-2 block">Quiz</span>
        <h1 className="display-heading text-3xl sm:text-4xl mb-2">{topic}</h1>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-400 hover:text-accent-500 transition-colors"
        >
          <ExternalLink size={11} />
          {url.replace('https://en.wikipedia.org/wiki/', 'wikipedia: ')}
        </a>
      </div>

      {/* Summary */}
      <div className="card p-5 mb-8 border-l-4 border-l-teal-500">
        <span className="section-label mb-2 block">Article Summary</span>
        <p className="text-ink-700 leading-relaxed text-sm">{summary}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-ink-400">
          {answered} / {questions.length} answered
        </span>
        <Badge>{Math.round((answered / questions.length) * 100)}%</Badge>
      </div>
      <ProgressBar value={answered} max={questions.length} />

      {/* Questions */}
      <div className="mt-8 space-y-6">
        {questions.map((q, idx) => {
          const chosen = answers[q.id]
          return (
            <div key={q.id} className="card p-6">
              <div className="flex items-start gap-3 mb-5">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-parchment-100 border border-parchment-300 flex items-center justify-center font-mono text-xs text-ink-500">
                  {idx + 1}
                </span>
                <p className="text-ink-800 font-medium leading-snug pt-0.5">{q.text}</p>
              </div>

              <div className="space-y-2 pl-10">
                {q.options.map((opt, optIdx) => {
                  const isChosen = chosen === opt
                  const letter   = ['A', 'B', 'C', 'D'][optIdx]
                  return (
                    <button
                      key={opt}
                      onClick={() => !submitted && setAnswer(q.id, opt)}
                      className={clsx(
                        'w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-150',
                        isChosen
                          ? 'border-accent-400 bg-accent-500/10 text-accent-700 shadow-sm'
                          : 'border-parchment-200 bg-white/50 text-ink-700 hover:border-ink-300 hover:bg-parchment-50'
                      )}
                    >
                      <span
                        className={clsx(
                          'shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs border',
                          isChosen
                            ? 'bg-accent-500 text-white border-accent-500'
                            : 'bg-parchment-100 text-ink-400 border-parchment-300'
                        )}
                      >
                        {letter}
                      </span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit */}
      <div className="mt-10 flex items-center justify-between">
        <span className="text-sm text-ink-400">
          {allAnswered
            ? 'All questions answered — ready to submit!'
            : `${questions.length - answered} question(s) remaining`}
        </span>
        <Button onClick={handleSubmit} disabled={!allAnswered} className="gap-2">
          Submit Quiz <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
