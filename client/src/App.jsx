import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Calendar from './pages/Calendar'
import Students from './pages/Students'
import Sessions from './pages/Sessions'
import Reports from './pages/Reports'
import Receipts from './pages/Receipts'
import Timetable from './pages/Timetable'
import Homework from './pages/Homework'
import Exams from './pages/Exams'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/calendar" replace />} />

          {/* Lịch */}
          <Route path="calendar" element={<Calendar />} />

          {/* Gia sư */}
          <Route path="students" element={<Students />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="reports"  element={<Reports />} />
          <Route path="receipts" element={<Receipts />} />

          {/* Học tập */}
          <Route path="timetable" element={<Timetable />} />
          <Route path="homework"  element={<Homework />} />
          <Route path="exams"     element={<Exams />} />

          {/* Backward compat */}
          <Route path="weekly"   element={<Navigate to="/calendar" replace />} />
          <Route path="schedule" element={<Navigate to="/calendar" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
