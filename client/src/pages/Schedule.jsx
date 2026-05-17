import { useState, useEffect } from 'react'
import { schoolApi, studentsApi, schedulesApi } from '../lib/api'

const DAYS = [
  { value: 1, label: 'Thứ Hai',  short: 'T2' },
  { value: 2, label: 'Thứ Ba',   short: 'T3' },
  { value: 3, label: 'Thứ Tư',   short: 'T4' },
  { value: 4, label: 'Thứ Năm',  short: 'T5' },
  { value: 5, label: 'Thứ Sáu',  short: 'T6' },
  { value: 6, label: 'Thứ Bảy',  short: 'T7' },
  { value: 7, label: 'Chủ Nhật', short: 'CN' },
]

const SUBJECT_COLORS = [
  { value: 'violet', bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-800', dot: 'bg-violet-400' },
  { value: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  { value: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-400' },
  { value: 'rose', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', dot: 'bg-rose-400' },
  { value: 'teal', bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', dot: 'bg-teal-500' },
  { value: 'amber', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-400' },
  { value: 'cyan', bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', dot: 'bg-cyan-500' },
  { value: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-400' },
]

const getColor = (value) => SUBJECT_COLORS.find(c => c.value === value) || SUBJECT_COLORS[0]

const TUTOR_COLOR = { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', dot: 'bg-blue-400' }

function formatDate(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getDaysOfWeek() {
  const now = new Date()
  const mon = new Date(now)
  const day = now.getDay()
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target - today) / 86400000)
}

function ExamBadge({ diff }) {
  if (diff < 0)  return <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Đã qua</span>
  if (diff === 0) return <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">Hôm nay!</span>
  if (diff <= 3)  return <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Còn {diff} ngày</span>
  if (diff <= 7)  return <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">Còn {diff} ngày</span>
  return <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Còn {diff} ngày</span>
}

// ── Slot form modal ──────────────────────────────────────────────────────────
const EMPTY_SLOT = { day: 1, start_time: '07:30', end_time: '09:30', subject: '', room: '', teacher: '', color: 'violet' }

function SlotModal({ slot, onSave, onClose }) {
  const [form, setForm] = useState(slot || EMPTY_SLOT)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{slot ? 'Sửa môn học' : 'Thêm môn học'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Tên môn *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)}
              placeholder="Giải tích, LTMM, Tiếng Anh..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Ngày học</label>
              <select value={form.day} onChange={e => set('day', Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Màu</label>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {SUBJECT_COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => set('color', c.value)}
                    className={`w-6 h-6 rounded-full ${c.dot} transition-transform ${form.color === c.value ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : ''}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Bắt đầu</label>
              <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Kết thúc</label>
              <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Phòng</label>
              <input value={form.room} onChange={e => set('room', e.target.value)}
                placeholder="A2.01"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Giảng viên</label>
              <input value={form.teacher} onChange={e => set('teacher', e.target.value)}
                placeholder="Thầy/Cô..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Hủy</button>
          <button onClick={() => form.subject.trim() && onSave(form)}
            disabled={!form.subject.trim()}
            className="flex-1 py-2.5 rounded-xl font-bold text-white bg-primary text-sm disabled:opacity-50">
            {slot ? 'Lưu' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Exam form modal ──────────────────────────────────────────────────────────
const EMPTY_EXAM = { subject: '', exam_date: '', start_time: '', location: '', notes: '' }

function ExamModal({ exam, onSave, onClose }) {
  const [form, setForm] = useState(exam || EMPTY_EXAM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{exam ? 'Sửa lịch thi' : 'Thêm lịch thi'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Môn thi *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)}
              placeholder="Giải tích, LTMM..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Ngày thi *</label>
              <input type="date" value={form.exam_date} onChange={e => set('exam_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Giờ thi</label>
              <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Phòng / Địa điểm</label>
            <input value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="Phòng thi H1.01..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Ghi chú</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Thi tự luận, được mang tài liệu..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Hủy</button>
          <button onClick={() => form.subject.trim() && form.exam_date && onSave(form)}
            disabled={!form.subject.trim() || !form.exam_date}
            className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 text-sm disabled:opacity-50">
            {exam ? 'Lưu' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Schedule() {
  const [tab, setTab] = useState('week')
  const [timetable, setTimetable] = useState([])
  const [exams, setExams] = useState([])
  const [tutorSchedules, setTutorSchedules] = useState([])
  const [students, setStudents] = useState([])
  const [slotModal, setSlotModal] = useState(null) // null | 'new' | slot-object
  const [examModal, setExamModal] = useState(null)

  const loadAll = async () => {
    const [tt, ex, ss, stu] = await Promise.all([
      schoolApi.getTimetable(),
      schoolApi.getExams(),
      schedulesApi.getAll(),
      studentsApi.getAll(),
    ])
    setTimetable(tt)
    setExams(ex)
    setTutorSchedules(ss)
    setStudents(stu)
  }

  useEffect(() => { loadAll() }, [])

  // ── Timetable CRUD ──────────────────────────────────────────────────────────
  const handleSaveSlot = async (form) => {
    if (form.id) await schoolApi.updateSlot(form.id, form)
    else await schoolApi.addSlot(form)
    setSlotModal(null)
    const tt = await schoolApi.getTimetable()
    setTimetable(tt)
  }

  const handleDeleteSlot = async (id) => {
    if (!confirm('Xóa môn học này?')) return
    await schoolApi.deleteSlot(id)
    setTimetable(t => t.filter(s => s.id !== id))
  }

  // ── Exam CRUD ───────────────────────────────────────────────────────────────
  const handleSaveExam = async (form) => {
    if (form.id) await schoolApi.updateExam(form.id, form)
    else await schoolApi.addExam(form)
    setExamModal(null)
    const ex = await schoolApi.getExams()
    setExams(ex)
  }

  const handleDeleteExam = async (id) => {
    if (!confirm('Xóa lịch thi này?')) return
    await schoolApi.deleteExam(id)
    setExams(e => e.filter(x => x.id !== id))
  }

  // ── Combined weekly data ────────────────────────────────────────────────────
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))
  const weekDays = getDaysOfWeek() // [Mon, Tue, ..., Sun]

  const combinedByDay = DAYS.map((dayDef, i) => {
    const date = weekDays[i]
    const jsDay = date.getDay()
    const ourDay = jsDay === 0 ? 7 : jsDay // 1=Mon...7=Sun

    const schoolSlots = timetable
      .filter(s => s.day === ourDay)
      .map(s => ({ type: 'school', ...s }))

    const tutorSlots = tutorSchedules.flatMap(sch => {
      const student = studentMap[sch.student_id]
      if (!student) return []
      return (sch.schedule || [])
        .filter(slot => slot.day === ourDay)
        .map(slot => ({ type: 'tutor', student, slot }))
    })

    const all = [...schoolSlots, ...tutorSlots]
      .sort((a, b) => {
        const ta = a.type === 'school' ? a.start_time : a.slot.start_time
        const tb = b.type === 'school' ? b.start_time : b.slot.start_time
        return ta.localeCompare(tb)
      })

    return { dayDef, date, items: all }
  })

  const tabs = [
    { key: 'week', label: 'Tuần này', icon: 'calendar_view_week' },
    { key: 'timetable', label: 'Thời khóa biểu', icon: 'table_chart' },
    { key: 'exams', label: 'Lịch thi', icon: 'quiz' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tab bar */}
      <div className="flex bg-white rounded-2xl border border-slate-200 shadow-sm p-1 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Tuần này ─────────────────────────────────────────────────── */}
      {tab === 'week' && (
        <div className="space-y-3">
          {combinedByDay.map(({ dayDef, date, items }) => {
            const isToday = formatDate(date) === formatDate(new Date())
            if (items.length === 0) return null
            return (
              <div key={dayDef.value}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isToday ? 'border-primary shadow-primary/10' : 'border-slate-200'}`}>
                <div className={`flex items-center justify-between px-4 py-3 ${isToday ? 'bg-primary' : 'bg-slate-50 border-b border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${isToday ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {dayDef.short}
                    </span>
                    <div>
                      <p className={`font-bold text-sm ${isToday ? 'text-white' : 'text-slate-800'}`}>{dayDef.label}</p>
                      <p className={`text-xs ${isToday ? 'text-blue-200' : 'text-slate-400'}`}>{formatDate(date)}</p>
                    </div>
                    {isToday && <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full ml-1">Hôm nay</span>}
                  </div>
                  <span className={`text-xs font-bold ${isToday ? 'text-blue-200' : 'text-slate-400'}`}>{items.length} buổi</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    if (item.type === 'school') {
                      const c = getColor(item.color)
                      return (
                        <div key={`s-${item.id}`} className="flex items-center gap-3 px-4 py-3">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm">{item.subject}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${c.bg} ${c.border} ${c.text}`}>Trường</span>
                            </div>
                            <p className="text-xs text-slate-400">{item.room || ''}{item.room && item.teacher ? ' · ' : ''}{item.teacher || ''}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-black ${c.text}`}>{item.start_time}</p>
                            <p className="text-xs text-slate-400">→ {item.end_time}</p>
                          </div>
                        </div>
                      )
                    } else {
                      return (
                        <div key={`t-${item.student.id}-${idx}`} className="flex items-center gap-3 px-4 py-3">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TUTOR_COLOR.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm truncate">{item.student.name}</p>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-blue-700">Dạy</span>
                            </div>
                            <p className="text-xs text-slate-400">{item.student.class_name || ''}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-blue-700">{item.slot.start_time}</p>
                            <p className="text-xs text-slate-400">→ {item.slot.end_time}</p>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            )
          })}

          {combinedByDay.every(d => d.items.length === 0) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">calendar_today</span>
              <p className="text-slate-400 text-sm">Tuần này chưa có buổi học nào.</p>
              <p className="text-xs text-slate-400 mt-1">Thêm thời khóa biểu hoặc lịch dạy thêm.</p>
            </div>
          )}

          {/* Upcoming exams this week or soon */}
          {exams.filter(e => daysUntil(e.exam_date) >= 0 && daysUntil(e.exam_date) <= 7).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Thi trong 7 ngày tới
              </p>
              <div className="space-y-2">
                {exams.filter(e => daysUntil(e.exam_date) >= 0 && daysUntil(e.exam_date) <= 7).map(e => (
                  <div key={e.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-800 text-sm">{e.subject}</p>
                      <p className="text-xs text-red-500">{new Date(e.exam_date + 'T00:00:00').toLocaleDateString('vi-VN')}{e.start_time ? ` · ${e.start_time}` : ''}{e.location ? ` · ${e.location}` : ''}</p>
                    </div>
                    <ExamBadge diff={daysUntil(e.exam_date)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Thời khóa biểu ───────────────────────────────────────────── */}
      {tab === 'timetable' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{timetable.length} môn học</p>
            <button onClick={() => setSlotModal('new')}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Thêm môn
            </button>
          </div>

          {timetable.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">table_chart</span>
              <p className="text-slate-400 text-sm mb-4">Chưa có môn học nào.</p>
              <button onClick={() => setSlotModal('new')}
                className="text-primary font-bold text-sm">Thêm môn học đầu tiên →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {DAYS.map(day => {
                const slots = timetable.filter(s => s.day === day.value)
                if (slots.length === 0) return null
                return (
                  <div key={day.value} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                      <span className="text-xs font-black text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">{day.short}</span>
                      <span className="text-sm font-bold text-slate-700">{day.label}</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {slots.map(slot => {
                        const c = getColor(slot.color)
                        return (
                          <div key={slot.id} className="flex items-center gap-3 px-4 py-3">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm">{slot.subject}</p>
                              <p className="text-xs text-slate-400">
                                {slot.start_time}–{slot.end_time}
                                {slot.room && ` · ${slot.room}`}
                                {slot.teacher && ` · ${slot.teacher}`}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setSlotModal(slot)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button onClick={() => handleDeleteSlot(slot.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Lịch thi ─────────────────────────────────────────────────── */}
      {tab === 'exams' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{exams.filter(e => daysUntil(e.exam_date) >= 0).length} kỳ thi sắp tới</p>
            <button onClick={() => setExamModal('new')}
              className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-200">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Thêm lịch thi
            </button>
          </div>

          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">quiz</span>
              <p className="text-slate-400 text-sm mb-4">Chưa có lịch thi nào.</p>
              <button onClick={() => setExamModal('new')} className="text-red-500 font-bold text-sm">Thêm lịch thi →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {exams.map(exam => {
                const diff = daysUntil(exam.exam_date)
                const isPast = diff < 0
                return (
                  <div key={exam.id}
                    className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-3 ${isPast ? 'opacity-60' : diff <= 3 ? 'border-red-200' : 'border-slate-200'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isPast ? 'bg-slate-100' : diff <= 3 ? 'bg-red-100' : diff <= 7 ? 'bg-orange-100' : 'bg-slate-100'}`}>
                      <p className={`text-lg font-black leading-none ${isPast ? 'text-slate-500' : diff <= 3 ? 'text-red-600' : diff <= 7 ? 'text-orange-600' : 'text-slate-600'}`}>
                        {new Date(exam.exam_date + 'T00:00:00').getDate()}
                      </p>
                      <p className={`text-[10px] font-bold ${isPast ? 'text-slate-400' : diff <= 3 ? 'text-red-400' : 'text-slate-400'}`}>
                        T{new Date(exam.exam_date + 'T00:00:00').getMonth() + 1}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-slate-900">{exam.subject}</p>
                        <ExamBadge diff={diff} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(exam.exam_date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {exam.start_time && ` · ${exam.start_time}`}
                        {exam.location && ` · ${exam.location}`}
                      </p>
                      {exam.notes && <p className="text-xs text-slate-400 mt-0.5">{exam.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setExamModal(exam)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={() => handleDeleteExam(exam.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {slotModal && (
        <SlotModal
          slot={slotModal === 'new' ? null : slotModal}
          onSave={handleSaveSlot}
          onClose={() => setSlotModal(null)}
        />
      )}
      {examModal && (
        <ExamModal
          exam={examModal === 'new' ? null : examModal}
          onSave={handleSaveExam}
          onClose={() => setExamModal(null)}
        />
      )}
    </div>
  )
}
