import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, RotateCcw, Clock, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { useQuizStore } from '../store/quizStore'
import { Button, Badge } from '../components/ui/index'

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct  = total === 0 ? 0 : score / total
  const r    = 52
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const colour =
    pct >= 0.8 ? '#2a9d93' : pct >= 0.5 ? '#d4522a' : '#b83e1a'

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f3e7cc" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r}
          fill="none" stroke={colour} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-ink-900">{score}</span>
        <span className="font-mono text-xs text-ink-400">/ {total}</span>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const { activeQuiz, answers, submitted, score, resetSession } = useQuizStore()

  useEffect(() => {
    if (!activeQuiz || !submitted) navigate('/', { replace: true })
  }, [activeQuiz, submitted, navigate])

  if (!activeQuiz || !submitted) return null

  const { questions, topic } = activeQuiz
  const finalScore = score()
  const total      = questions.length
  const pct        = Math.round((finalScore / total) * 100)
  const label      = pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practising'

  return (
    <div className="animate-fade-in">
      {/* Score hero */}
      <div className="card p-8 text-center mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-500 via-teal-500 to-parchment-400" />
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy size={14} className="text-parchment-500" />
          <span className="section-label">Your Score</span>
        </div>
        <h1 className="display-heading text-3xl mb-6">{topic}</h1>
        <ScoreRing score={finalScore} total={total} />
        <p className="font-display text-2xl text-ink-800 mt-5 mb-1">{label}</p>
        <p className="text-sm text-ink-500">
          You answered <strong>{finalScore}</strong> out of <strong>{total}</strong> correctly ({pct}%)
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Button variant="ghost" onClick={() => { resetSession(); navigate('/') }}>
            <RotateCcw size={15} /> New Quiz
          </Button>
          <Link to="/history">
            <Button variant="ghost">
              <Clock size={15} /> View History
            </Button>
          </Link>
        </div>
      </div>

      {/* Answer review */}
      <div>
        <span className="section-label mb-4 block">Answer Review</span>
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const chosen  = answers[q.id]
            const correct = q.correct_answer
            const isRight = chosen === correct

            return (
              <div
                key={q.id}
                className={clsx(
                  'card p-5 border-l-4',
                  isRight ? 'border-l-teal-500' : 'border-l-accent-500'
                )}
              >
                <div className="flex items-start gap-3 mb-4">
                  {isRight
                    ? <CheckCircle2 size={18} className="shrink-0 text-teal-500 mt-0.5" />
                    : <XCircle     size={18} className="shrink-0 text-accent-500 mt-0.5" />}
                  <p className="text-ink-800 font-medium text-sm leading-snug">
                    <span className="font-mono text-ink-400 mr-1">{idx + 1}.</span>
                    {q.text}
                  </p>
                </div>

                <div className="pl-7 space-y-1.5">
                  {q.options.map((opt) => {
                    const isCorrect = opt === correct
                    const isChosen  = opt === chosen
                    return (
                      <div
                        key={opt}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border',
                          isCorrect
                            ? 'border-teal-300 bg-teal-50 text-teal-800'
                            : isChosen && !isCorrect
                            ? 'border-accent-300 bg-accent-50 text-accent-800'
                            : 'border-transparent text-ink-500'
                        )}
                      >
                        {isCorrect && <CheckCircle2 size={13} className="text-teal-500 shrink-0" />}
                        {isChosen && !isCorrect && <XCircle size={13} className="text-accent-500 shrink-0" />}
                        {!isCorrect && !isChosen && <span className="w-[13px]" />}
                        {opt}
                        {isCorrect && (
                          <Badge className="ml-auto !bg-teal-100 !text-teal-700 !border-teal-200">
                            Correct
                          </Badge>
                        )}
                        {isChosen && !isCorrect && (
                          <Badge className="ml-auto !bg-accent-100 !text-accent-700 !border-accent-200">
                            Your answer
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
