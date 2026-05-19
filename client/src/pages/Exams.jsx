import { useState, useEffect } from 'react'
import { schoolApi } from '../lib/api'
import { StudyNav } from '../components/SectionNav'

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((new Date(dateStr + 'T00:00:00') - today) / 86400000)
}

function ExamBadge({ diff }) {
  if (diff < 0) return <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Đã qua</span>
  if (diff === 0) return <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">Hôm nay!</span>
  if (diff <= 3) return <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Còn {diff} ngày</span>
  if (diff <= 7) return <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">Còn {diff} ngày</span>
  return <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Còn {diff} ngày</span>
}

const EMPTY = { subject: '', exam_date: '', start_time: '', location: '', notes: '' }

function ExamModal({ exam, onSave, onClose }) {
  const [form, setForm] = useState(exam || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[90dvh]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900">{exam ? 'Sửa lịch thi' : 'Thêm lịch thi'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Môn thi *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} autoFocus
              placeholder="Giải tích..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Phòng thi</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="H1.01..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Ghi chú</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Thi tự luận, được mang tài liệu..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 flex gap-2 shrink-0 border-t border-slate-50">
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

export default function Exams() {
  const [exams, setExams] = useState([])
  const [modal, setModal] = useState(null)
  const [showPast, setShowPast] = useState(false)

  const load = () => schoolApi.getExams().then(setExams)
  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    if (form.id) await schoolApi.updateExam(form.id, form)
    else await schoolApi.addExam(form)
    setModal(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa lịch thi này?')) return
    await schoolApi.deleteExam(id)
    setExams(e => e.filter(x => x.id !== id))
  }

  const upcoming = exams.filter(e => daysUntil(e.exam_date) >= 0)
  const past = exams.filter(e => daysUntil(e.exam_date) < 0)
  const displayed = showPast ? exams : upcoming

  return (
    <div className="max-w-2xl mx-auto">
      <StudyNav />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-manrope">Lịch thi</h1>
          {upcoming.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{upcoming.length} kỳ thi sắp tới</p>
          )}
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-200">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">quiz</span>
          <p className="text-slate-400 text-sm mb-4">Chưa có lịch thi nào.</p>
          <button onClick={() => setModal('new')} className="text-red-500 font-bold text-sm">Thêm lịch thi →</button>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {displayed.map(exam => {
              const diff = daysUntil(exam.exam_date)
              const isPast = diff < 0
              const urgent = !isPast && diff <= 3
              return (
                <div key={exam.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-3 transition-opacity ${isPast ? 'opacity-50' : urgent ? 'border-red-200' : 'border-slate-200'
                    }`}>
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isPast ? 'bg-slate-100' : diff <= 3 ? 'bg-red-100' : diff <= 7 ? 'bg-orange-100' : 'bg-violet-50'
                    }`}>
                    <p className={`text-lg font-black leading-none ${isPast ? 'text-slate-500' : diff <= 3 ? 'text-red-600' : diff <= 7 ? 'text-orange-600' : 'text-violet-700'}`}>
                      {new Date(exam.exam_date + 'T00:00:00').getDate()}
                    </p>
                    <p className={`text-[10px] font-bold ${isPast ? 'text-slate-400' : diff <= 3 ? 'text-red-400' : 'text-slate-400'}`}>
                      /T{new Date(exam.exam_date + 'T00:00:00').getMonth() + 1}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-slate-900">{exam.subject}</p>
                      <ExamBadge diff={diff} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(exam.exam_date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {exam.start_time ? ` · ${exam.start_time}` : ''}
                      {exam.location ? ` · ${exam.location}` : ''}
                    </p>
                    {exam.notes && <p className="text-xs text-slate-400 mt-0.5">{exam.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setModal(exam)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onClick={() => handleDelete(exam.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {past.length > 0 && (
            <button onClick={() => setShowPast(!showPast)}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-400 border border-slate-200 bg-white hover:bg-slate-50">
              {showPast ? '↑ Ẩn kỳ thi đã qua' : `↓ Xem ${past.length} kỳ thi đã qua`}
            </button>
          )}
        </>
      )}

      {modal && <ExamModal exam={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  )
}
