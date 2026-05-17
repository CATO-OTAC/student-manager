import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Students from './pages/Students'
import Sessions from './pages/Sessions'
import Reports from './pages/Reports'
import Receipts from './pages/Receipts'
import WeeklySchedule from './pages/WeeklySchedule'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/sessions" replace />} />
          <Route path="students" element={<Students />} />
          <Route path="weekly" element={<WeeklySchedule />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="receipts" element={<Receipts />} />
        </Route>
        <Route path="*" element={<Navigate to="/sessions" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
