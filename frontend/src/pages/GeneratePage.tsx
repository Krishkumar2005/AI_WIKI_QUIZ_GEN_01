import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Lightbulb, Link2, Zap, BookOpen } from 'lucide-react'
import { api } from '../lib/api'
import { useQuizStore } from '../store/quizStore'
import { Button, ErrorBox, Spinner } from '../components/ui/index'

const EXAMPLE_URLS = [
  { label: 'Photosynthesis',   url: 'https://en.wikipedia.org/wiki/Photosynthesis' },
  { label: 'Black Holes',      url: 'https://en.wikipedia.org/wiki/Black_hole' },
  { label: 'Ancient Rome',     url: 'https://en.wikipedia.org/wiki/Ancient_Rome' },
  { label: 'Machine Learning', url: 'https://en.wikipedia.org/wiki/Machine_learning' },
]

const FEATURES = [
  { icon: Link2,    title: 'Paste any Wiki URL',  body: 'Any English Wikipedia article works.' },
  { icon: Zap,      title: 'AI generation',       body: 'Gemini reads and creates 5–8 MCQs.' },
  { icon: BookOpen, title: 'Test your knowledge', body: 'Answer, submit, and see your score.' },
]

export default function GeneratePage() {
  const [url, setUrl]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const inputRef              = useRef<HTMLInputElement>(null)
  const navigate              = useNavigate()
  const setQuiz               = useQuizStore((s) => s.setQuiz)

  const handleGenerate = async (targetUrl = url) => {
    const trimmed = targetUrl.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const quiz = await api.generateQuiz(trimmed)
      setQuiz(quiz)
      navigate('/quiz')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-14 mt-4">
        <span className="section-label mb-4 block">Wikipedia × AI</span>
        <h1 className="display-heading text-5xl sm:text-6xl mb-5 leading-[1.1]">
          Turn any article<br />
          <em className="text-accent-500 not-italic">into a quiz</em>
        </h1>
        <p className="text-ink-500 text-lg max-w-lg mx-auto leading-relaxed">
          Paste a Wikipedia URL. Our AI reads the article and generates
          a personalised multiple-choice quiz in seconds.
        </p>
      </div>

      {/* Input card */}
      <div className="card p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full border border-parchment-300 opacity-40 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-parchment-300 opacity-30 pointer-events-none" />

        <label className="section-label mb-3 block">Wikipedia Article URL</label>
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="https://en.wikipedia.org/wiki/..."
            className="input-field flex-1"
            disabled={loading}
          />
          <Button onClick={() => handleGenerate()} loading={loading} className="shrink-0">
            {loading ? 'Generating…' : 'Generate Quiz'}
            {!loading && <ArrowRight size={16} />}
          </Button>
        </div>

        {error && <div className="mt-4"><ErrorBox message={error} /></div>}

        {loading && (
          <div className="mt-5 flex items-center gap-3 text-ink-500 text-sm">
            <Spinner size={18} />
            <span>Reading article and generating questions — this takes 10–20 seconds…</span>
          </div>
        )}
      </div>

      {/* Examples */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={13} className="text-ink-400" />
          <span className="section-label">Try these examples</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_URLS.map(({ label, url: exUrl }) => (
            <button
              key={label}
              onClick={() => { setUrl(exUrl); handleGenerate(exUrl) }}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-parchment-300 bg-white/60
                         text-sm text-ink-700 hover:border-accent-400 hover:text-accent-500
                         transition-all duration-200 disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            className="card p-5 flex flex-col gap-3"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="w-9 h-9 rounded-lg bg-parchment-100 flex items-center justify-center">
              <Icon size={17} className="text-accent-500" />
            </div>
            <div>
              <p className="font-display font-semibold text-ink-800 mb-0.5">{title}</p>
              <p className="text-sm text-ink-500">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
