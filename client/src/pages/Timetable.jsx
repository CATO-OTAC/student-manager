import { useState, useEffect } from 'react'
import { schoolApi } from '../lib/api'
import { StudyNav } from '../components/SectionNav'

const DAYS = [
  { value: 1, label: 'Thứ Hai',  short: 'T2' },
  { value: 2, label: 'Thứ Ba',   short: 'T3' },
  { value: 3, label: 'Thứ Tư',   short: 'T4' },
  { value: 4, label: 'Thứ Năm',  short: 'T5' },
  { value: 5, label: 'Thứ Sáu',  short: 'T6' },
  { value: 6, label: 'Thứ Bảy',  short: 'T7' },
  { value: 7, label: 'Chủ Nhật', short: 'CN' },
]

export const SUBJECT_COLORS = [
  { value: 'violet', bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-800', dot: 'bg-violet-500', solid: 'bg-violet-600' },
  { value: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500', solid: 'bg-emerald-600' },
  { value: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-400', solid: 'bg-orange-500' },
  { value: 'rose', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', dot: 'bg-rose-400', solid: 'bg-rose-500' },
  { value: 'teal', bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', dot: 'bg-teal-500', solid: 'bg-teal-600' },
  { value: 'amber', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-400', solid: 'bg-amber-500' },
  { value: 'cyan', bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', dot: 'bg-cyan-500', solid: 'bg-cyan-600' },
  { value: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-400', solid: 'bg-pink-500' },
]

export const getSubjectColor = (value) => SUBJECT_COLORS.find(c => c.value === value) || SUBJECT_COLORS[0]

const EMPTY = { day: 1, start_time: '07:30', end_time: '09:30', subject: '', room: '', teacher: '', color: 'violet' }

function SlotModal({ slot, onSave, onClose }) {
  const [form, setForm] = useState(slot || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{slot ? 'Sửa môn học' : 'Thêm môn học'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Tên môn *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} autoFocus
              placeholder="Giải tích, LTMM..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
        </div>
        <div className="px-5 pb-5 flex gap-2">
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
  const [modal, setModal] = useState(null)

  const load = () => schoolApi.getTimetable().then(setTimetable)
  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    if (form.id) await schoolApi.updateSlot(form.id, form)
    else await schoolApi.addSlot(form)
    setModal(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa môn học này?')) return
    await schoolApi.deleteSlot(id)
    setTimetable(t => t.filter(s => s.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StudyNav />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900 font-manrope">Thời khóa biểu</h1>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-violet-200">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm môn
        </button>
      </div>

      {timetable.length === 0 ? (
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
    </div>
  )
}
