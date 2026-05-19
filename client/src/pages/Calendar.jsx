import { useState, useEffect } from 'react'
import { schoolApi, studentsApi, supabase } from '../lib/api'
import { getSubjectColor } from '../lib/theme'

// ── Date helpers ─────────────────────────────────────────────────────────────
const toYMD = (d) => d.toISOString().split('T')[0]
const jsToOur = (jsDay) => jsDay === 0 ? 7 : jsDay // 0=Sun→7, 1=Mon→1

function formatYMD(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

function getMonthGrid(anchor) {
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const days = []
  for (let i = 0; i < startPad; i++) days.push(addDays(firstDay, -startPad + i))
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  const endPad = 7 - (days.length % 7 || 7)
  for (let i = 1; i <= endPad && endPad < 7; i++) days.push(addDays(lastDay, i))
  return days
}

const VI_MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
const DAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// ── Event helpers ─────────────────────────────────────────────────────────────
const TUTOR_STYLE = { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500', solid: 'bg-blue-600' }

function getEventsForDate(date, timetable, tutorSchedules, studentMap, exams, semesters) {
  const ourDay = jsToOur(date.getDay())
  const dateStr = toYMD(date)

  const currentSem = semesters.find(s => dateStr >= s.start_date && dateStr <= s.end_date)
  const semId = currentSem ? currentSem.id : null

  const schoolSlots = timetable
    .filter(s => s.day === ourDay && s.semester_id === semId && (!s.start_date || s.start_date <= dateStr) && (!s.end_date || s.end_date >= dateStr))
    .map(s => ({ type: 'school', time: s.start_time, ...s }))

  const tutorSlots = tutorSchedules.flatMap(sch => {
    if (sch.semester_id !== semId) return []
    const student = studentMap[sch.student_id]
    if (!student) return []
    return (sch.schedule || [])
      .filter(s => s.day === ourDay)
      .map(s => ({ type: 'tutor', time: s.start_time, student, slot: s }))
  })

  const examSlots = exams
    .filter(e => e.exam_date === dateStr)
    .map(e => ({ type: 'exam', time: e.start_time || '00:00', ...e }))

  return [...schoolSlots, ...tutorSlots, ...examSlots]
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
}

// ── Event pill ────────────────────────────────────────────────────────────────
function EventPill({ event, compact = false }) {
  if (event.type === 'school') {
    const c = getSubjectColor(event.color)
    return (
      <div className={`rounded-lg border px-2 py-1 ${c.bg} ${c.border}`}>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
          <p className={`font-bold text-xs truncate ${c.text}`}>{event.subject}</p>
          {!compact && <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${c.bg} ${c.text} border ${c.border} ml-auto shrink-0`}>Đi học</span>}
        </div>
        {!compact && (
          <div className="mt-1">
            <p className={`text-[10px] ${c.text} opacity-80`}>
              {event.start_time}–{event.end_time}{event.room ? ` · ${event.room}` : ''}
            </p>
            {(event.start_date || event.end_date) && (
              <p className={`text-[10px] ${c.text} opacity-80 mt-0.5`}>
                Áp dụng: {event.start_date ? formatYMD(event.start_date) : '...'} → {event.end_date ? formatYMD(event.end_date) : '...'}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
  if (event.type === 'tutor') {
    return (
      <div className="rounded-lg border px-2 py-1 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-500" />
          <p className="font-bold text-xs truncate text-blue-800">{event.student.name}</p>
          {!compact && <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 ml-auto shrink-0">Dạy thêm</span>}
        </div>
        {!compact && <p className="text-[10px] text-blue-600 opacity-70 mt-0.5">
          {event.slot.start_time}–{event.slot.end_time}
        </p>}
      </div>
    )
  }
  if (event.type === 'exam') {
    return (
      <div className="rounded-lg border px-2 py-1 bg-red-50 border-red-200">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-500" />
          <p className="font-bold text-xs truncate text-red-800">{event.subject}</p>
          {!compact && <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 ml-auto shrink-0">Thi</span>}
        </div>
        {!compact && event.start_time && <p className="text-[10px] text-red-600 opacity-70 mt-0.5">{event.start_time}{event.location ? ` · ${event.location}` : ''}</p>}
      </div>
    )
  }
  return null
}

// ── Main Calendar ─────────────────────────────────────────────────────────────
export default function Calendar() {
  const [anchor, setAnchor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timetable, setTimetable] = useState([])
  const [exams, setExams] = useState([])
  const [tutorSchedules, setTutorSchedules] = useState([])
  const [students, setStudents] = useState([])
  const [semesters, setSemesters] = useState([])

  useEffect(() => {
    Promise.all([
      supabase.from('school_timetable').select('*'),
      schoolApi.getExams(),
      supabase.from('student_schedules').select('*'),
      studentsApi.getAll(),
      supabase.from('semesters').select('*')
    ]).then(([ttRes, ex, ssRes, stu, semRes]) => {
      setTimetable(ttRes.data || [])
      setExams(ex)
      setTutorSchedules(ssRes.data || [])
      setStudents(stu)
      setSemesters(semRes.data || [])
    })
  }, [])

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayStr = toYMD(today)

  const goNext = () => setAnchor(a => addMonths(a, 1))
  const goPrev = () => setAnchor(a => addMonths(a, -1))

  const getEvents = (date) => getEventsForDate(date, timetable, tutorSchedules, studentMap, exams, semesters)

  // Period label
  const periodLabel = `${VI_MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`

  const selectedEvents = getEvents(selectedDate)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={goPrev}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600 active:scale-95">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold text-slate-900 text-sm">{periodLabel}</p>
        </div>
        <button onClick={goNext}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600 active:scale-95">
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>

      {/* ── Month View ─────────────────────────────────────────────────────── */}
      {/* Month grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAY_HEADERS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {getMonthGrid(anchor).map((date, idx) => {
            const events = getEvents(date)
            const dateStr = toYMD(date)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === toYMD(selectedDate)
            const isCurrentMonth = date.getMonth() === anchor.getMonth()
            const schoolEvents = events.filter(e => e.type === 'school')
            const tutorEvents = events.filter(e => e.type === 'tutor')
            const examEvents = events.filter(e => e.type === 'exam')
            return (
              <button key={idx} onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center py-1.5 gap-0.5 min-h-[52px] border-b border-r border-slate-50 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                  } ${!isCurrentMonth ? 'opacity-30' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-primary text-white' :
                  isToday ? 'bg-blue-100 text-primary font-black' : 'text-slate-700'
                  }`}>
                  {date.getDate()}
                </div>
                {/* Event dots */}
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {schoolEvents.slice(0, 1).map((e, i) => (
                    <div key={`s${i}`} className={`w-1.5 h-1.5 rounded-full ${getSubjectColor(e.color).dot}`} />
                  ))}
                  {tutorEvents.slice(0, 1).map((_, i) => (
                    <div key={`t${i}`} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  ))}
                  {examEvents.slice(0, 1).map((_, i) => (
                    <div key={`e${i}`} className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-bold text-slate-900 text-sm">
          {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
          {toYMD(selectedDate) === todayStr && <span className="text-primary ml-2">· Hôm nay</span>}
        </h2>
        <span className="text-xs text-slate-400">{selectedEvents.length} sự kiện</span>
      </div>
      {selectedEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm">Không có sự kiện nào ngày này.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedEvents.map((event, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
              <EventPill event={event} compact={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
