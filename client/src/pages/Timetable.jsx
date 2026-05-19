import { useState, useEffect } from 'react'
import { supabase } from '../lib/api'
import { StudyNav } from '../components/SectionNav'
import { SUBJECT_COLORS, getSubjectColor } from '../lib/theme'

const DAYS = [
  { value: 1, label: 'Thứ Hai', short: 'T2' },
  { value: 2, label: 'Thứ Ba', short: 'T3' },
  { value: 3, label: 'Thứ Tư', short: 'T4' },
  { value: 4, label: 'Thứ Năm', short: 'T5' },
  { value: 5, label: 'Thứ Sáu', short: 'T6' },
  { value: 6, label: 'Thứ Bảy', short: 'T7' },
  { value: 7, label: 'Chủ Nhật', short: 'CN' },
]

function formatYMD(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function SemesterModal({ sem, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(sem === 'new' ? { name: '', start_date: '', end_date: '' } : sem)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[90dvh]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900">{sem === 'new' ? 'Thêm học kỳ' : 'Sửa học kỳ'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Tên học kỳ *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Học kỳ 1 (2023-2024)" autoFocus
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Bắt đầu *</label>
              <input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Kết thúc *</label>
              <input type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 flex gap-2 shrink-0 border-t border-slate-50">
          {sem !== 'new' && <button onClick={() => onDelete(form.id)} className="px-4 py-2.5 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 text-sm">Xóa</button>}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Hủy</button>
          <button onClick={() => form.name && form.start_date && form.end_date && onSave(form)} disabled={!form.name || !form.start_date || !form.end_date}
            className="flex-1 py-2.5 rounded-xl font-bold text-white bg-violet-600 text-sm disabled:opacity-50">Lưu</button>
        </div>
      </div>
    </div>
  )
}

const EMPTY = { day: 1, start_time: '07:30', end_time: '09:30', subject: '', room: '', teacher: '', color: 'violet', start_date: '', end_date: '' }

function SlotModal({ slot, onSave, onClose }) {
  const [form, setForm] = useState(slot || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[90dvh]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900">{slot ? 'Sửa môn học' : 'Thêm môn học'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Tên môn *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} autoFocus
              placeholder="Giải tích, LTMM..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Ngày học</label>
              <select value={form.day} onChange={e => set('day', Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Màu môn học</label>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {SUBJECT_COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => set('color', c.value)}
                    className={`w-6 h-6 rounded-full ${c.solid} transition-transform ${form.color === c.value ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'opacity-70'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Bắt đầu</label>
              <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Kết thúc</label>
              <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Phòng</label>
              <input value={form.room} onChange={e => set('room', e.target.value)} placeholder="A2.01"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Giảng viên</label>
              <input value={form.teacher} onChange={e => set('teacher', e.target.value)} placeholder="Thầy/Cô..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Áp dụng từ (Tùy chọn)</label>
              <input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Đến ngày (Tùy chọn)</label>
              <input type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 flex gap-2 shrink-0 border-t border-slate-50">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Hủy</button>
          <button onClick={() => form.subject.trim() && onSave(form)} disabled={!form.subject.trim()}
            className="flex-1 py-2.5 rounded-xl font-bold text-white bg-violet-600 text-sm disabled:opacity-50">
            {slot ? 'Lưu' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Timetable() {
  const [timetable, setTimetable] = useState([])
  const [semesters, setSemesters] = useState([])
  const [activeSemId, setActiveSemId] = useState('')
  const [modal, setModal] = useState(null)
  const [semModal, setSemModal] = useState(null)

  const load = async () => {
    const { data: sems, error } = await supabase.from('semesters').select('*').order('start_date', { ascending: false })
    if (error) console.error("Lỗi tải học kỳ:", error)
    setSemesters(sems || [])

    let currentSem = activeSemId
    if (!currentSem && sems && sems.length > 0) {
      currentSem = sems[0].id
      setActiveSemId(currentSem)
    }

    if (currentSem) {
      const { data: tt, error: ttErr } = await supabase.from('school_timetable').select('*').eq('semester_id', currentSem)
      if (ttErr) console.error("Lỗi tải thời khóa biểu:", ttErr)
      setTimetable(tt || [])
    } else {
      setTimetable([])
    }
  }
  useEffect(() => { load() }, [activeSemId])

  const handleSave = async (form) => {
    form.semester_id = activeSemId
    if (form.id) {
      const { error } = await supabase.from('school_timetable').update(form).eq('id', form.id)
      if (error) alert('Lỗi lưu môn học: ' + error.message)
    } else {
      const { error } = await supabase.from('school_timetable').insert(form)
      if (error) alert('Lỗi thêm môn học: ' + error.message)
    }
    setModal(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa môn học này?')) return
    const { error } = await supabase.from('school_timetable').delete().eq('id', id)
    if (error) alert('Lỗi xóa môn học: ' + error.message)
    load()
  }

  const handleSaveSem = async (form) => {
    if (form.id) {
      const { error } = await supabase.from('semesters').update(form).eq('id', form.id)
      if (error) alert('Lỗi sửa học kỳ: ' + error.message)
    } else {
      const { data, error } = await supabase.from('semesters').insert(form).select().single()
      if (error) alert('Lỗi thêm học kỳ: ' + error.message)
      if (data) setActiveSemId(data.id)
    }
    setSemModal(null)
    load()
  }

  const handleDeleteSem = async (id) => {
    if (!confirm('Xóa học kỳ này và TOÀN BỘ lịch học bên trong?')) return
    const { error } = await supabase.from('semesters').delete().eq('id', id)
    if (error) alert('Lỗi xóa học kỳ: ' + error.message)
    setActiveSemId('')
    load()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StudyNav />

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-900 font-manrope">Thời khóa biểu</h1>
          <button onClick={() => setModal('new')} disabled={!activeSemId}
            className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-violet-200 disabled:opacity-50 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden sm:inline">Thêm môn</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>

        {/* Thanh quản lý Học kỳ */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          {semesters.length > 0 ? (
            <>
              <select value={activeSemId} onChange={e => setActiveSemId(e.target.value)}
                className="flex-1 bg-transparent border-none py-1.5 px-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-0 min-w-0">
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />
              <button onClick={() => setSemModal(semesters.find(s => s.id === activeSemId))} title="Sửa học kỳ"
                className="text-slate-400 hover:text-violet-600 hover:bg-violet-50 w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </>
          ) : (
            <div className="flex-1 py-1.5 px-3 text-sm text-slate-400 font-medium">Chưa có học kỳ</div>
          )}
          <button onClick={() => setSemModal('new')} title="Thêm học kỳ mới"
            className="text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 h-8 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors shrink-0">
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span className="hidden sm:inline">Học kỳ</span>
          </button>
        </div>
      </div>

      {!activeSemId ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">date_range</span>
          <p className="text-slate-400 text-sm mb-4">Chưa có học kỳ nào được tạo.</p>
          <button onClick={() => setSemModal('new')} className="text-violet-600 font-bold text-sm">Tạo học kỳ đầu tiên →</button>
        </div>
      ) : timetable.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">table_chart</span>
          <p className="text-slate-400 text-sm mb-4">Chưa có môn học nào.</p>
          <button onClick={() => setModal('new')} className="text-violet-600 font-bold text-sm">Thêm môn học đầu tiên →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {DAYS.map(day => {
            const slots = timetable.filter(s => s.day === day.value)
            if (!slots.length) return null
            return (
              <div key={day.value} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <span className="text-xs font-black text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">{day.short}</span>
                  <span className="text-sm font-bold text-slate-700">{day.label}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {slots.map(slot => {
                    const c = getSubjectColor(slot.color)
                    return (
                      <div key={slot.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm">{slot.subject}</p>
                          <p className="text-xs text-slate-400">
                            {slot.start_time}–{slot.end_time}
                            {slot.room ? ` · ${slot.room}` : ''}
                            {slot.teacher ? ` · ${slot.teacher}` : ''}
                          </p>
                          {(slot.start_date || slot.end_date) && (
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium bg-slate-100 w-fit px-2 py-0.5 rounded-md">
                              <span className="material-symbols-outlined text-[13px]">calendar_clock</span>
                              Áp dụng: {slot.start_date ? formatYMD(slot.start_date) : '...'} → {slot.end_date ? formatYMD(slot.end_date) : '...'}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setModal(slot)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button onClick={() => handleDelete(slot.id)}
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

      {modal && <SlotModal slot={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      {semModal && <SemesterModal sem={semModal} onSave={handleSaveSem} onDelete={handleDeleteSem} onClose={() => setSemModal(null)} />}
    </div>
  )
}
