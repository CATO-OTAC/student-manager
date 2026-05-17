import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Students from './pages/Students'
import Sessions from './pages/Sessions'
import Reports from './pages/Reports'
import Receipts from './pages/Receipts'
import Schedule from './pages/Schedule'
import Homework from './pages/Homework'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/schedule" replace />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="students" element={<Students />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="homework" element={<Homework />} />
          <Route path="reports" element={<Reports />} />
          <Route path="receipts" element={<Receipts />} />
          {/* Backward compat */}
          <Route path="weekly" element={<Navigate to="/schedule" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/schedule" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
