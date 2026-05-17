import { useState, useEffect } from 'react'
import { studentsApi, schedulesApi } from '../lib/api'

import { Link } from 'react-router-dom'

const DAYS = [
  { value: 1, label: 'Thứ Hai', short: 'T2' },
  { value: 2, label: 'Thứ Ba', short: 'T3' },
  { value: 3, label: 'Thứ Tư', short: 'T4' },
  { value: 4, label: 'Thứ Năm', short: 'T5' },
  { value: 5, label: 'Thứ Sáu', short: 'T6' },
  { value: 6, label: 'Thứ Bảy', short: 'T7' },
  { value: 7, label: 'Chủ Nhật', short: 'CN' },
]

const CARD_COLORS = [
  'bg-primary-fixed border-blue-200 text-primary',
  'bg-secondary-fixed border-amber-200 text-secondary',
  'bg-green-100 border-green-200 text-green-800',
  'bg-purple-100 border-purple-200 text-purple-800',
  'bg-rose-100 border-rose-200 text-rose-800',
  'bg-teal-100 border-teal-200 text-teal-800',
  'bg-indigo-100 border-indigo-200 text-indigo-800',
  'bg-orange-100 border-orange-200 text-orange-800',
]

export default function WeeklySchedule() {
  const [students, setStudents] = useState([])
  const [scheduleMap, setScheduleMap] = useState({})
  const [colorMap, setColorMap] = useState({})

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
  const totalSessions = Object.values(timetable).reduce((sum, e) => sum + e.length, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-manrope">Lịch dạy tuần</h1>
          <p className="text-sm text-slate-500">
            {totalSessions} buổi/tuần · {students.filter(s => scheduleMap[s.id]?.length > 0).length} học sinh có lịch
          </p>
        </div>
        <Link
          to="/students"
          className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
          Sửa lịch học sinh
        </Link>
      </div>

      {!hasAnySchedule ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">calendar_view_week</span>
          <p className="text-slate-400 mb-4">Chưa có học sinh nào có lịch học.</p>
          <Link to="/students" className="text-primary hover:underline font-medium">Thiết lập lịch học →</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-3 mb-6">
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
                      entries.map(({ student, slot }) => (
                        <div key={`${student.id}-${slot.day}`}
                          className={`rounded-lg border px-2 py-2 text-xs ${colorMap[student.id] || CARD_COLORS[0]}`}>
                          <p className="font-black truncate">{student.name}</p>
                          <p className="opacity-70 font-medium mt-0.5 truncate text-[10px]">{student.class_name}</p>
                          <p className="font-bold mt-1 flex items-center gap-0.5 text-[10px]">
                            <span className="material-symbols-outlined text-[11px]">schedule</span>
                            {slot.start_time}–{slot.end_time}
                          </p>
                        </div>
                      ))
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-slate-900 font-manrope">Danh sách lịch học sinh</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Học sinh</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Lớp</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Lịch học</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Buổi/tuần</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students
                  .filter(s => scheduleMap[s.id]?.length > 0)
                  .map(s => {
                    const schedule = scheduleMap[s.id] || []
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-6 py-4 font-bold text-slate-900 font-inter">{s.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{s.class_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {schedule.map(slot => (
                              <span key={slot.day}
                                className="inline-flex items-center gap-1 text-xs bg-primary-fixed text-primary border border-blue-100 px-2 py-1 rounded-lg font-bold">
                                {DAYS.find(d => d.value === slot.day)?.short}
                                <span className="font-normal opacity-60 text-[10px]">{slot.start_time}–{slot.end_time}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">{schedule.length}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">
                {students.filter(s => scheduleMap[s.id]?.length > 0).length} học sinh có lịch
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
