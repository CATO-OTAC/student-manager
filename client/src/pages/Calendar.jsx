import { useState, useEffect } from 'react'
import { schoolApi, studentsApi, schedulesApi } from '../lib/api'
import { getSubjectColor } from './Timetable'

// ── Date helpers ─────────────────────────────────────────────────────────────
const toYMD = (d) => d.toISOString().split('T')[0]
const jsToOur = (jsDay) => jsDay === 0 ? 7 : jsDay // 0=Sun→7, 1=Mon→1

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0,0,0,0)
  return d
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

function getWeekDays(anchor) {
  const mon = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
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

const VI_MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
const DAY_HEADERS = ['T2','T3','T4','T5','T6','T7','CN']

// ── Event helpers ─────────────────────────────────────────────────────────────
const TUTOR_STYLE = { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500', solid: 'bg-blue-600' }

function getEventsForDate(date, timetable, tutorSchedules, studentMap, exams) {
  const ourDay = jsToOur(date.getDay())
  const dateStr = toYMD(date)

  const schoolSlots = timetable
    .filter(s => s.day === ourDay)
    .map(s => ({ type: 'school', time: s.start_time, ...s }))

  const tutorSlots = tutorSchedules.flatMap(sch => {
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
        {!compact && <p className={`text-[10px] ${c.text} opacity-70 mt-0.5`}>
          {event.start_time}–{event.end_time}{event.room ? ` · ${event.room}` : ''}
        </p>}
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
  const [view, setView] = useState('week') // 'week' | 'month'
  const [anchor, setAnchor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timetable, setTimetable] = useState([])
  const [exams, setExams] = useState([])
  const [tutorSchedules, setTutorSchedules] = useState([])
  const [students, setStudents] = useState([])

  useEffect(() => {
    Promise.all([
      schoolApi.getTimetable(),
      schoolApi.getExams(),
      schedulesApi.getAll(),
      studentsApi.getAll(),
    ]).then(([tt, ex, ss, stu]) => {
      setTimetable(tt)
      setExams(ex)
      setTutorSchedules(ss)
      setStudents(stu)
    })
  }, [])

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))
  const today = new Date(); today.setHours(0,0,0,0)
  const todayStr = toYMD(today)

  const goNext = () => setAnchor(a => view === 'week' ? addDays(a, 7) : addMonths(a, 1))
  const goPrev = () => setAnchor(a => view === 'week' ? addDays(a, -7) : addMonths(a, -1))
  const goToday = () => { setAnchor(new Date()); setSelectedDate(new Date()) }

  const getEvents = (date) => getEventsForDate(date, timetable, tutorSchedules, studentMap, exams)

  // Period label
  const weekDays = getWeekDays(anchor)
  const periodLabel = view === 'week'
    ? `${weekDays[0].getDate()}/${weekDays[0].getMonth()+1} – ${weekDays[6].getDate()}/${weekDays[6].getMonth()+1}, ${weekDays[0].getFullYear()}`
    : `${VI_MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`

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
        <button onClick={goToday}
          className="px-3 h-9 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
          Hôm nay
        </button>
        {/* View toggle */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
          {[['week','Tuần'],['month','Tháng']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2.5 h-7 rounded-lg text-xs font-bold transition-all ${view === v ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Week View ──────────────────────────────────────────────────────── */}
      {view === 'week' && (
        <>
          {/* Day strip with event dots */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAY_HEADERS.map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {weekDays.map(date => {
                const events = getEvents(date)
                const dateStr = toYMD(date)
                const isToday = dateStr === todayStr
                const isSelected = dateStr === toYMD(selectedDate)
                const isCurrentMonth = date.getMonth() === anchor.getMonth() || true
                return (
                  <button key={dateStr} onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center py-2.5 gap-1 transition-colors ${isSelected ? '' : 'hover:bg-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isSelected ? 'bg-primary text-white shadow-sm' :
                      isToday ? 'bg-blue-100 text-primary font-black' : 'text-slate-700'
                    }`}>
                      {date.getDate()}
                    </div>
                    {/* Event dots */}
                    <div className="flex gap-0.5 h-3 items-center">
                      {events.slice(0, 3).map((e, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                          e.type === 'exam' ? 'bg-red-400' :
                          e.type === 'school' ? getSubjectColor(e.color).dot : 'bg-blue-400'
                        }`} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected day events */}
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm">
              {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
              {toYMD(selectedDate) === todayStr && <span className="text-primary ml-2">· Hôm nay</span>}
            </h2>
            <span className="text-xs text-slate-400">{selectedEvents.length} sự kiện</span>
          </div>
          {selectedEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-slate-400 text-sm">Không có sự kiện nào hôm nay.</p>
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
        </>
      )}

      {/* ── Month View ─────────────────────────────────────────────────────── */}
      {view === 'month' && (
        <>
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
                const tutorEvents  = events.filter(e => e.type === 'tutor')
                const examEvents   = events.filter(e => e.type === 'exam')
                return (
                  <button key={idx} onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center py-1.5 gap-0.5 min-h-[52px] border-b border-r border-slate-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    } ${!isCurrentMonth ? 'opacity-30' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-primary text-white' :
                      isToday ? 'bg-blue-100 text-primary font-black' : 'text-slate-700'
                    }`}>
                      {date.getDate()}
                    </div>
                    {/* Event dots */}
                    <div className="flex gap-0.5 flex-wrap justify-center">
                      {schoolEvents.slice(0,1).map((e,i) => (
                        <div key={`s${i}`} className={`w-1.5 h-1.5 rounded-full ${getSubjectColor(e.color).dot}`} />
                      ))}
                      {tutorEvents.slice(0,1).map((_,i) => (
                        <div key={`t${i}`} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      ))}
                      {examEvents.slice(0,1).map((_,i) => (
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
        </>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 px-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-violet-500" /><span>Đi học</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-blue-500" /><span>Dạy thêm</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-red-400" /><span>Thi</span>
        </div>
      </div>
    </div>
  )
}
