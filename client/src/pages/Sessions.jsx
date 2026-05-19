import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { TeachNav } from '../components/SectionNav'
import { studentsApi, sessionsApi, supabase } from '../lib/api'

const DAYS_NAME = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const isExtra = (d) => d.startsWith('extra:')
const cleanStr = (d) => isExtra(d) ? d.slice(6) : d
const dateOnly = (d) => cleanStr(d).slice(0, 10)
const timeOnly = (d) => cleanStr(d).length > 10 ? cleanStr(d).slice(11) : null

function dayShort(d) {
  const jsDay = new Date(dateOnly(d) + 'T00:00:00').getDay()
  return DAYS_NAME[jsDay === 0 ? 7 : jsDay]
}

const getLocalTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function effectiveSchedule(defaultSchedule, changes, date) {
  const active = (changes || [])
    .filter(c => c.start_date <= date && (c.change_type === 'permanent' || (c.end_date && c.end_date >= date)))
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
  return active.length > 0 ? (active[0].new_schedule || []) : (defaultSchedule || [])
}

function scheduledDatesFor(defaultSchedule, changes, month, year) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const result = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const eff = effectiveSchedule(defaultSchedule, changes, dateStr)
    if (!eff.length) continue
    const jsDay = new Date(year, month - 1, d).getDay()
    const ourDay = jsDay === 0 ? 7 : jsDay
    const slots = eff.filter(s => s.day === ourDay)
    for (const slot of slots) {
      result.push(slot.start_time ? `${dateStr} ${slot.start_time}` : dateStr)
    }
  }
  return result
}

function DateChip({ date, attended, onToggle, extra = false, disabled = false }) {
  const day = parseInt(dateOnly(date).split('-')[2])
  const tp = timeOnly(date)
  return (
    <button
      disabled={disabled}
      onClick={e => { e.stopPropagation(); onToggle(date) }}
      title={disabled ? 'Chưa đến ngày' : extra ? 'Nhấn để xóa' : ''}
      className={`flex flex-col items-center w-11 rounded-xl border-2 py-1 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
        } ${extra
          ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
          : attended
            ? 'bg-primary border-primary text-white shadow-sm'
            : 'border-slate-300 bg-white text-slate-500'
        }`}
    >
      <span className="text-[8px] font-bold opacity-70 leading-tight mt-0.5">{dayShort(date)}</span>
      <span className="text-sm font-black leading-none">{day}</span>
      {tp && <span className="text-[8px] font-bold opacity-75 leading-tight mb-0.5">{tp}</span>}
    </button>
  )
}

function StudentCard({ s, schedData, attended, savedAttended, notes, savedNotes, isExp, month, year, addingFor,
  customDate, customTime, onToggle, onExpand, onAddExtra, onSetNotes,
  onStartAdd, onCancelAdd, onSetDate, onSetTime, onSave, savingId }) {

  const scheduled = scheduledDatesFor(schedData.schedule, schedData.changes, month, year)
  const count = attended.length
  const amount = count * (s.fee_per_session || 0)
  const extraDates = attended.filter(d => isExtra(d))
  const hasSchedule = schedData.schedule.length > 0
  const hasChanges = schedData.changes.length > 0

  // Có thay đổi chưa lưu không?
  const isDirty = JSON.stringify([...attended].sort()) !== JSON.stringify([...savedAttended].sort()) || notes !== savedNotes

  const todayStr = getLocalTodayStr()
  const isFutureDate = (dateStr) => dateOnly(dateStr) > todayStr

  return (
    <div className={`bg-white rounded-2xl border transition-all ${isExp ? 'border-blue-200 shadow-md' : isDirty ? 'border-amber-300 shadow-sm' : 'border-slate-200 shadow-sm'}`}>
      {/* Card header — tap to expand */}
      <button
        onClick={onExpand}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-sm font-black shrink-0">
          {s.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-[15px] leading-tight truncate">{s.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{s.class_name || 'Chưa có lớp'}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Có thay đổi chưa lưu" />
          )}
          {count > 0 ? (
            <div className="text-right">
              <p className="text-xs font-black text-primary">{count} buổi</p>
              <p className="text-xs font-bold text-secondary">{amount.toLocaleString('vi-VN')}đ</p>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Chưa học</span>
          )}
          <span className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform ${isExp ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {isExp && (
        <div className="border-t border-blue-100 px-4 py-4 bg-slate-50/60 rounded-b-2xl space-y-4"
          onClick={e => e.stopPropagation()}>

          {hasChanges && (
            <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">info</span>
              <span>Đã áp dụng lịch thay đổi cho tháng này</span>
            </div>
          )}

          {/* Scheduled dates */}
          {scheduled.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Lịch tháng {month}
              </p>
              <div className="flex flex-wrap gap-2">
                {scheduled.map(date => (
                  <DateChip key={date} date={date}
                    attended={attended.includes(date)}
                    disabled={isFutureDate(date)}
                    onToggle={d => onToggle(s.id, d)} />
                ))}
              </div>
            </div>
          )}

          {scheduled.length === 0 && !hasSchedule && (
            <p className="text-sm text-slate-400">
              Chưa có lịch học.{' '}
              <Link to="/students" className="text-primary font-medium">Thiết lập →</Link>
            </p>
          )}
          {scheduled.length === 0 && hasSchedule && (
            <p className="text-sm text-slate-400">Không có buổi học trong tháng này.</p>
          )}

          {/* Extra dates */}
          {extraDates.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">
                Ngày học thêm
              </p>
              <div className="flex flex-wrap gap-2">
                {extraDates.map(date => (
                  <DateChip key={date} date={date}
                    attended extra
                    disabled={isFutureDate(date)}
                    onToggle={d => onToggle(s.id, d)} />
                ))}
              </div>
            </div>
          )}

          {/* Add extra date form */}
          {addingFor === s.id ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="date" value={customDate} onChange={e => onSetDate(e.target.value)}
                  max={todayStr}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
                <input type="time" value={customTime} onChange={e => onSetTime(e.target.value)}
                  className="w-28 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => onAddExtra(s.id)} disabled={!customDate}
                  className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 active:opacity-80">
                  Thêm ngày
                </button>
                <button onClick={onCancelAdd}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200">
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => onStartAdd(s.id)}
              className="flex items-center gap-2 text-sm font-bold text-amber-600 border border-amber-300 bg-amber-50 px-4 py-2.5 rounded-xl w-full justify-center active:opacity-80">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Thêm ngày học thêm
            </button>
          )}

          {/* Notes */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Ghi chú</p>
            <input type="text" value={notes || ''} onChange={e => onSetNotes(s.id, e.target.value)}
              placeholder="Ghi chú tháng này..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>

          {/* Save button if dirty */}
          {isDirty && (
            <div className="flex justify-end mt-4 pt-4 border-t border-blue-100">
              <button
                onClick={() => onSave(s.id)}
                disabled={savingId === s.id}
                className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {savingId === s.id ? 'Đang lưu...' : 'Lưu điểm danh'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Sessions() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [students, setStudents] = useState([])
  const [scheduleMap, setScheduleMap] = useState({})
  const [sessionData, setSessionData] = useState({})
  const [savedIds, setSavedIds] = useState(new Set()) // student IDs có record trong DB
  const [expanded, setExpanded] = useState({})
  const [addingFor, setAddingFor] = useState(null)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('19:00')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => { loadData() }, [month, year])

  const loadData = async () => {
    const [allStudents, sessions, { data: allSchedules }, { data: allChanges }, { data: allSems }] = await Promise.all([
      studentsApi.getAll(),
      sessionsApi.getByMonth(month, year),
      supabase.from('student_schedules').select('*'),
      supabase.from('schedule_changes').select('*'),
      supabase.from('semesters').select('*')
    ])
    setStudents(allStudents)

    const vDate = `${year}-${String(month).padStart(2, '0')}`
    const activeSem = (allSems || []).find(s => {
      if (!s.start_date || !s.end_date) return false
      return vDate >= s.start_date.substring(0, 7) && vDate <= s.end_date.substring(0, 7)
    })

    const sMap = {}
    if (activeSem && allSchedules) {
      allSchedules.filter(s => s.semester_id === activeSem.id).forEach(s => {
        sMap[s.student_id] = { schedule: s.schedule || [], changes: (allChanges || []).filter(c => c.student_id === s.student_id) }
      })
    }
    setScheduleMap(sMap)
    const data = {}
    allStudents.forEach(s => {
      data[s.id] = { dates: [], notes: '', savedDates: [], savedNotes: '' }
    })
    sessions.forEach(s => {
      data[s.student_id] = {
        dates: s.dates || [],
        notes: s.notes || '',
        savedDates: s.dates || [],
        savedNotes: s.notes || ''
      }
    })
    setSessionData(data)
    setSavedIds(new Set(sessions.map(s => s.student_id)))
  }

  const toggleDate = (studentId, dateStr) => {
    setSessionData(prev => {
      const curr = prev[studentId]?.dates || []
      const dates = curr.includes(dateStr)
        ? curr.filter(d => d !== dateStr)
        : [...curr, dateStr].sort((a, b) => cleanStr(a).localeCompare(cleanStr(b)))
      return { ...prev, [studentId]: { ...prev[studentId], dates } }
    })
  }

  const addExtra = (studentId) => {
    if (!customDate) return
    toggleDate(studentId, `extra:${customDate} ${customTime}`)
    setAddingFor(null)
    setCustomDate('')
    setCustomTime('19:00')
  }

  const setNotes = (studentId, notes) =>
    setSessionData(prev => ({ ...prev, [studentId]: { ...prev[studentId], notes } }))

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleSaveStudent = async (studentId) => {
    setSavingId(studentId)
    try {
      const s = students.find(st => st.id === studentId)
      const dates = sessionData[studentId]?.dates || []
      const session = {
        student_id: studentId, month, year,
        session_count: dates.length,
        amount: dates.length * (s.fee_per_session || 0),
        dates,
        notes: sessionData[studentId]?.notes || null,
      }

      await sessionsApi.bulkSave([session])

      setSessionData(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          savedDates: dates,
          savedNotes: sessionData[studentId]?.notes || ''
        }
      }))
      setSavedIds(prev => new Set(prev).add(studentId))
    } finally {
      setSavingId(null)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [year - 1, year, year + 1]
  const totalIncome = students.reduce((sum, s) =>
    sum + (sessionData[s.id]?.dates?.length || 0) * (s.fee_per_session || 0), 0)

  return (
    <div className="max-w-2xl mx-auto">

      <TeachNav />
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 font-manrope">Điểm danh</h1>
        {/* Month/year selector */}
        <div className="flex items-center gap-2 mt-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm bg-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="w-24 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm bg-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">group</span>
          <p className="text-slate-400 mb-4">Chưa có học sinh nào.</p>
          <Link to="/students" className="text-primary font-bold">Thêm học sinh →</Link>
        </div>
      ) : (
        <>
          {/* Student cards */}
          <div className="space-y-3 mb-5">
            {students.map(s => (
              <StudentCard
                key={s.id}
                s={s}
                schedData={scheduleMap[s.id] || { schedule: [], changes: [] }}
                attended={sessionData[s.id]?.dates || []}
                savedAttended={sessionData[s.id]?.savedDates || []}
                notes={sessionData[s.id]?.notes || ''}
                savedNotes={sessionData[s.id]?.savedNotes || ''}
                isExp={!!expanded[s.id]}
                month={month}
                year={year}
                addingFor={addingFor}
                customDate={customDate}
                customTime={customTime}
                onToggle={toggleDate}
                onExpand={() => toggleExpand(s.id)}
                onAddExtra={addExtra}
                onSetNotes={setNotes}
                onStartAdd={(id) => { setAddingFor(id); setCustomDate(''); setCustomTime('19:00') }}
                onCancelAdd={() => { setAddingFor(null); setCustomDate('') }}
                onSetDate={setCustomDate}
                onSetTime={setCustomTime}
                onSave={handleSaveStudent}
                savingId={savingId}
              />
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-4 flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng tháng {month}/{year}</p>
              <p className="text-lg font-black text-secondary font-manrope">{totalIncome.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
