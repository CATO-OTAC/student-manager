import { useState, useEffect } from 'react'
import { studentsApi, schedulesApi } from '../lib/api'
import { Link } from 'react-router-dom'

const DAYS = [
  { value: 1, label: 'Thứ Hai',  short: 'T2' },
  { value: 2, label: 'Thứ Ba',   short: 'T3' },
  { value: 3, label: 'Thứ Tư',   short: 'T4' },
  { value: 4, label: 'Thứ Năm',  short: 'T5' },
  { value: 5, label: 'Thứ Sáu',  short: 'T6' },
  { value: 6, label: 'Thứ Bảy',  short: 'T7' },
  { value: 7, label: 'Chủ Nhật', short: 'CN' },
]

const CARD_COLORS = [
  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   dot: 'bg-blue-400'   },
  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  dot: 'bg-amber-400'  },
  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  dot: 'bg-green-500'  },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', dot: 'bg-purple-400' },
  { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-800',   dot: 'bg-rose-400'   },
  { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-800',   dot: 'bg-teal-500'   },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-400' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', dot: 'bg-orange-400' },
]

export default function WeeklySchedule() {
  const [students, setStudents]     = useState([])
  const [scheduleMap, setScheduleMap] = useState({})
  const [colorMap, setColorMap]     = useState({})

  useEffect(() => {
    Promise.all([studentsApi.getAll(), schedulesApi.getAll()]).then(([s, schedules]) => {
      setStudents(s)
      const sMap = {}
      schedules.forEach(sch => { sMap[sch.student_id] = sch.schedule || [] })
      setScheduleMap(sMap)
      const cMap = {}
      s.forEach((st, i) => { cMap[st.id] = CARD_COLORS[i % CARD_COLORS.length] })
      setColorMap(cMap)
    })
  }, [])

  const timetable = {}
  DAYS.forEach(d => { timetable[d.value] = [] })
  students.forEach(student => {
    const schedule = scheduleMap[student.id] || []
    schedule.forEach(slot => timetable[slot.day]?.push({ student, slot }))
  })
  DAYS.forEach(d => {
    timetable[d.value].sort((a, b) => a.slot.start_time.localeCompare(b.slot.start_time))
  })

  const hasAnySchedule = Object.values(timetable).some(e => e.length > 0)
  const totalSessions  = Object.values(timetable).reduce((sum, e) => sum + e.length, 0)
  const activeDays     = DAYS.filter(d => timetable[d.value].length > 0)

  if (!hasAnySchedule) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-slate-900 font-manrope">Lịch tuần</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">calendar_view_week</span>
          <p className="text-slate-400 mb-4">Chưa có học sinh nào có lịch học.</p>
          <Link to="/students" className="text-primary font-bold">Thiết lập lịch →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-manrope">Lịch tuần</h1>
          <p className="text-xs text-slate-500 mt-0.5">{totalSessions} buổi · {activeDays.length} ngày</p>
        </div>
        <Link to="/students"
          className="flex items-center gap-1.5 text-sm font-bold text-primary">
          <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
          <span className="hidden sm:inline">Sửa lịch</span>
        </Link>
      </div>

      {/* ── Mobile: danh sách dọc theo ngày ────────────────────────────────── */}
      <div className="lg:hidden space-y-3 mb-6">
        {DAYS.map(day => {
          const entries = timetable[day.value]
          if (entries.length === 0) return null
          return (
            <div key={day.value} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Day header */}
              <div className="flex items-center justify-between px-4 py-3 bg-primary">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-black">
                    {day.short}
                  </span>
                  <span className="text-white font-bold text-sm">{day.label}</span>
                </div>
                <span className="text-blue-200 text-xs font-bold">{entries.length} buổi</span>
              </div>
              {/* Entries */}
              <div className="divide-y divide-slate-100">
                {entries.map(({ student, slot }) => {
                  const color = colorMap[student.id] || CARD_COLORS[0]
                  return (
                    <div key={`${student.id}-${slot.start_time}`}
                      className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.class_name || '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-primary">{slot.start_time}</p>
                        <p className="text-xs text-slate-400">→ {slot.end_time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Days with no entries — compact */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ngày trống</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.filter(d => timetable[d.value].length === 0).map(d => (
              <span key={d.value} className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                {d.short}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop: grid 7 cột ─────────────────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-7 gap-3 mb-6">
        {DAYS.map(day => {
          const entries = timetable[day.value]
          const hasEntries = entries.length > 0
          return (
            <div key={day.value} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className={`px-3 py-3 text-center border-b border-slate-200 ${hasEntries ? 'bg-primary' : 'bg-slate-50'}`}>
                <p className={`font-black text-sm font-manrope ${hasEntries ? 'text-white' : 'text-slate-500'}`}>{day.short}</p>
                <p className={`text-[10px] font-medium ${hasEntries ? 'text-blue-100' : 'text-slate-400'}`}>{day.label}</p>
              </div>
              <div className="p-2 space-y-2 min-h-[100px]">
                {entries.length === 0 ? (
                  <div className="flex items-center justify-center h-16">
                    <span className="text-slate-300 text-xs font-medium">Trống</span>
                  </div>
                ) : (
                  entries.map(({ student, slot }) => {
                    const color = colorMap[student.id] || CARD_COLORS[0]
                    return (
                      <div key={`${student.id}-${slot.start_time}`}
                        className={`rounded-lg border px-2 py-2 text-xs ${color.bg} ${color.border} ${color.text}`}>
                        <p className="font-black truncate">{student.name}</p>
                        <p className="opacity-70 font-medium mt-0.5 truncate text-[10px]">{student.class_name}</p>
                        <p className="font-bold mt-1 text-[10px]">{slot.start_time}–{slot.end_time}</p>
                      </div>
                    )
                  })
                )}
              </div>
              {hasEntries && (
                <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-wide">{entries.length} buổi</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Student list — both mobile + desktop */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-slate-900 text-sm">Lịch của từng học sinh</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {students
            .filter(s => scheduleMap[s.id]?.length > 0)
            .map(s => {
              const schedule = scheduleMap[s.id] || []
              const color = colorMap[s.id] || CARD_COLORS[0]
              return (
                <div key={s.id} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${color.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                      <span className="text-xs text-slate-400">{s.class_name || '—'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {schedule.map((slot, i) => (
                        <span key={i}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-bold border ${color.bg} ${color.border} ${color.text}`}>
                          {DAYS.find(d => d.value === slot.day)?.short}
                          <span className="font-normal opacity-70 text-[10px]">{slot.start_time}–{slot.end_time}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0 mt-0.5">{schedule.length} buổi</span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
