import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import GeneratePage from './pages/GeneratePage'
import QuizPage from './pages/QuizPage'
import HistoryPage from './pages/HistoryPage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"        element={<GeneratePage />} />
        <Route path="/quiz"    element={<QuizPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Layout>
  )
}
