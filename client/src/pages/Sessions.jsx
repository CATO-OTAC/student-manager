import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { studentsApi, sessionsApi, schedulesApi } from '../lib/api'

const DAYS_NAME = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isExtra    = (d) => d.startsWith('extra:')
const cleanStr   = (d) => isExtra(d) ? d.slice(6) : d          // "extra:2026-05-05 14:00" → "2026-05-05 14:00"
const dateOnly   = (d) => cleanStr(d).slice(0, 10)             // → "2026-05-05"
const timeOnly   = (d) => cleanStr(d).length > 10 ? cleanStr(d).slice(11) : null // → "14:00" or null

function dayShort(d) {
  const jsDay = new Date(dateOnly(d) + 'T00:00:00').getDay()
  return DAYS_NAME[jsDay === 0 ? 7 : jsDay]
}

// Tìm lịch hiệu lực cho một ngày (xét thay đổi)
function effectiveSchedule(defaultSchedule, changes, date) {
  const active = (changes || [])
    .filter(c => c.start_date <= date && (c.change_type === 'permanent' || (c.end_date && c.end_date >= date)))
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
  return active.length > 0 ? (active[0].new_schedule || []) : (defaultSchedule || [])
}

// Sinh danh sách buổi học theo lịch trong tháng.
// 1 slot = 1 entry (có giờ nếu lịch có giờ) → dùng để match với attendedDates
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

// ─── Chips ────────────────────────────────────────────────────────────────────

// Chip xanh cho ngày theo lịch
function ScheduledChip({ date, attended, onToggle }) {
  const dp = dateOnly(date)
  const tp = timeOnly(date)   // hiển thị giờ nếu ngày đó có 2 buổi trong lịch
  const day = parseInt(dp.split('-')[2])
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(date) }}
      className={`flex flex-col items-center w-12 rounded-xl border-2 py-1 transition-all ${
        attended
          ? 'bg-primary border-primary text-white shadow-sm'
          : 'border-slate-300 bg-white text-slate-500 hover:border-primary/50 hover:bg-blue-50'
      }`}
    >
      <span className="text-[8px] font-bold opacity-70 leading-tight mt-0.5">{dayShort(date)}</span>
      <span className="text-sm font-black leading-none">{day}</span>
      {tp && <span className="text-[8px] font-bold opacity-75 leading-tight mb-0.5">{tp}</span>}
    </button>
  )
}

// Chip vàng cho ngày thêm thủ công — luôn có prefix "extra:"
function ExtraChip({ date, onToggle }) {
  const dp = dateOnly(date)    // "2026-05-10"
  const tp = timeOnly(date)    // "14:00"
  const day = parseInt(dp.split('-')[2])
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(date) }}
      title="Nhấn để xóa"
      className="flex flex-col items-center w-12 rounded-xl border-2 bg-amber-400 border-amber-400 text-white shadow-sm hover:bg-amber-500 transition-all py-1"
    >
      <span className="text-[8px] font-bold opacity-80 leading-tight mt-0.5">{dayShort(date)}</span>
      <span className="text-sm font-black leading-none">{day}</span>
      {tp && <span className="text-[8px] font-bold opacity-90 leading-tight mb-0.5">{tp}</span>}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Sessions() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())
  const [students, setStudents]     = useState([])
  const [scheduleMap, setScheduleMap] = useState({})
  const [sessionData, setSessionData] = useState({})
  const [expanded, setExpanded]   = useState({})
  const [addingFor, setAddingFor] = useState(null)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('19:00')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => { loadData() }, [month, year])

  const loadData = async () => {
    const [allStudents, sessions, allSchedules] = await Promise.all([
      studentsApi.getAll(),
      sessionsApi.getByMonth(month, year),
      schedulesApi.getAll(),
    ])
    setStudents(allStudents)
    const sMap = {}
    allSchedules.forEach(s => { sMap[s.student_id] = { schedule: s.schedule || [], changes: s.changes || [] } })
    setScheduleMap(sMap)
    const data = {}
    sessions.forEach(s => { data[s.student_id] = { dates: s.dates || [], notes: s.notes || '' } })
    setSessionData(data)
    setSaved(false)
  }

  const toggleDate = (studentId, dateStr) => {
    setSessionData(prev => {
      const curr = prev[studentId]?.dates || []
      const dates = curr.includes(dateStr)
        ? curr.filter(d => d !== dateStr)
        : [...curr, dateStr].sort((a, b) => cleanStr(a).localeCompare(cleanStr(b)))
      return { ...prev, [studentId]: { ...prev[studentId], dates } }
    })
    setSaved(false)
  }

  // Ngày thêm thủ công luôn có prefix "extra:" để phân biệt với ngày lịch
  const addExtra = (studentId) => {
    if (!customDate) return
    const entry = `extra:${customDate} ${customTime}`
    toggleDate(studentId, entry)
    setAddingFor(null)
    setCustomDate('')
    setCustomTime('19:00')
  }

  const setNotes = (studentId, notes) =>
    setSessionData(prev => ({ ...prev, [studentId]: { ...prev[studentId], notes } }))

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const sessions = students
        .map(s => {
          const dates = sessionData[s.id]?.dates || []
          return {
            student_id: s.id, month, year,
            session_count: dates.length,
            amount: dates.length * (s.fee_per_session || 0),
            dates,
            notes: sessionData[s.id]?.notes || null,
          }
        })
        .filter(s => s.session_count > 0)
      await sessionsApi.bulkSave(sessions)
      setSaved(true)
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years  = [year - 1, year, year + 1]
  const totalIncome = students.reduce((sum, s) =>
    sum + (sessionData[s.id]?.dates?.length || 0) * (s.fee_per_session || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-manrope">Điểm danh</h1>
          <p className="text-sm text-slate-500">Nhấn vào học sinh để chọn ngày · Lịch thay đổi áp dụng tự động</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">group</span>
          <p className="text-slate-400 mb-4">Chưa có học sinh nào.</p>
          <Link to="/students" className="text-primary hover:underline font-medium">Thêm học sinh →</Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Học sinh</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Lớp</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Học phí/buổi</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Buổi</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Thành tiền</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const schedData  = scheduleMap[s.id] || { schedule: [], changes: [] }
                  const scheduled  = scheduledDatesFor(schedData.schedule, schedData.changes, month, year)
                  const attended   = sessionData[s.id]?.dates || []
                  const count  = attended.length
                  const amount = count * (s.fee_per_session || 0)
                  const isExp  = expanded[s.id]
                  const hasSchedule = schedData.schedule.length > 0
                  const hasChanges  = schedData.changes.length > 0
                  const extraDates  = attended.filter(d => isExtra(d))

                  return (
                    <Fragment key={s.id}>
                      <tr
                        onClick={() => toggleExpand(s.id)}
                        className={`border-t border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer select-none ${isExp ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{s.class_name || '—'}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-secondary">
                          {(s.fee_per_session || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold text-sm ${count > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                            {count} buổi
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {amount > 0 ? (
                            <span className="font-bold text-sm text-secondary bg-secondary-container/20 px-3 py-1 rounded-full">
                              {amount.toLocaleString('vi-VN')}đ
                            </span>
                          ) : <span className="text-slate-400 text-sm">—</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="material-symbols-outlined text-slate-400 text-[20px]">
                            {isExp ? 'expand_less' : 'expand_more'}
                          </span>
                        </td>
                      </tr>

                      {isExp && (
                        <tr className="border-t border-blue-100">
                          <td colSpan={6} className="px-6 py-5 bg-slate-50/80">

                            {hasChanges && (
                              <div className="mb-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                Có thay đổi lịch — ngày dưới đây đã điều chỉnh theo lịch hiện hành
                              </div>
                            )}

                            {/* Ngày theo lịch */}
                            {scheduled.length > 0 && (
                              <div className="mb-4">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                                  Ngày theo lịch — Tháng {month}/{year}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {scheduled.map(date => (
                                    <ScheduledChip
                                      key={date}
                                      date={date}
                                      attended={attended.includes(date)}
                                      onToggle={d => toggleDate(s.id, d)}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {scheduled.length === 0 && !hasSchedule && (
                              <p className="text-sm text-slate-400 mb-3">
                                Học sinh chưa có lịch học.{' '}
                                <Link to="/students" onClick={e => e.stopPropagation()} className="text-primary hover:underline font-medium">
                                  Thiết lập lịch →
                                </Link>
                              </p>
                            )}
                            {scheduled.length === 0 && hasSchedule && (
                              <p className="text-sm text-slate-400 mb-3">Không có ngày học theo lịch trong tháng này.</p>
                            )}

                            {/* Ngày thêm thủ công */}
                            {extraDates.length > 0 && (
                              <div className="mb-4">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2.5">
                                  Ngày thêm thủ công
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {extraDates.map(date => (
                                    <ExtraChip key={date} date={date} onToggle={d => toggleDate(s.id, d)} />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Form thêm ngày + ghi chú */}
                            <div className="flex items-center gap-3 flex-wrap" onClick={e => e.stopPropagation()}>
                              {addingFor === s.id ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                                    autoFocus
                                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                  <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)}
                                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28" />
                                  <button onClick={() => addExtra(s.id)} disabled={!customDate}
                                    className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors">
                                    Thêm
                                  </button>
                                  <button onClick={() => { setAddingFor(null); setCustomDate(''); setCustomTime('19:00') }}
                                    className="text-slate-500 hover:text-slate-700 text-sm font-medium">Hủy</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setAddingFor(s.id); setCustomDate(''); setCustomTime('19:00') }}
                                  className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 border border-amber-300 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">add</span>
                                  Thêm ngày
                                </button>
                              )}
                              <div className="flex-1" />
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ghi chú:</span>
                              <input type="text" value={sessionData[s.id]?.notes || ''}
                                onChange={e => setNotes(s.id, e.target.value)}
                                placeholder="Ghi chú tháng này..."
                                className="w-52 border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={4} className="px-6 py-4 font-bold text-slate-900">
                    Tổng thu nhập tháng {month}/{year}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-secondary text-lg font-manrope">
                    {totalIncome.toLocaleString('vi-VN')}đ
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleSave} disabled={saving}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">save</span>
              {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
            </button>
            {saved && (
              <span className="text-emerald-700 text-sm font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Đã lưu thành công!
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
