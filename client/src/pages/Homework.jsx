import { useState, useEffect } from 'react'
import { schoolApi } from '../lib/api'
import { StudyNav } from '../components/SectionNav'

const PRIORITY = {
  high: { label: 'Gấp', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  normal: { label: 'Bình thường', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  low: { label: 'Thoải mái', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target - today) / 86400000)
}

function DeadlineBadge({ due_date }) {
  if (!due_date) return null
  const diff = daysUntil(due_date)
  const date = new Date(due_date + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  if (diff < 0) return <span className="text-[10px] font-bold text-slate-400">{date} · Đã qua</span>
  if (diff === 0) return <span className="text-[10px] font-bold text-red-600">Hôm nay!</span>
  if (diff <= 2) return <span className="text-[10px] font-bold text-red-500">{date} · Còn {diff} ngày</span>
  if (diff <= 5) return <span className="text-[10px] font-bold text-orange-500">{date} · Còn {diff} ngày</span>
  return <span className="text-[10px] font-bold text-slate-400">{date}</span>
}

const EMPTY_FORM = { subject: '', title: '', due_date: '', priority: 'normal', notes: '' }

function HomeworkForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || EMPTY_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[90dvh]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900">{item ? 'Sửa bài tập' : 'Thêm bài tập'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Môn học *</label>
              <input value={form.subject} onChange={e => set('subject', e.target.value)}
                placeholder="Giải tích..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Độ ưu tiên</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="high">🔴 Gấp</option>
                <option value="normal">🔵 Bình thường</option>
                <option value="low">⚪ Thoải mái</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Nội dung / Tên bài *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Làm bài tập chương 3, đọc tài liệu..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Deadline</label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Ghi chú</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Trang 45-60, submit trên Moodle..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 flex gap-2 shrink-0 border-t border-slate-50">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Hủy</button>
          <button onClick={() => form.subject.trim() && form.title.trim() && onSave(form)}
            disabled={!form.subject.trim() || !form.title.trim()}
            className="flex-1 py-2.5 rounded-xl font-bold text-white bg-primary text-sm disabled:opacity-50">
            {item ? 'Lưu' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Homework() {
  const [items, setItems] = useState([])
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('pending') // pending | done | all

  const load = () => schoolApi.getHomework().then(setItems)
  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    if (form.id) await schoolApi.updateHomework(form.id, form)
    else await schoolApi.addHomework(form)
    setModal(null)
    load()
  }

  const toggleDone = async (item) => {
    await schoolApi.toggleDone(item.id, !item.done)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i))
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa bài tập này?')) return
    await schoolApi.deleteHomework(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(i =>
    filter === 'all' ? true : filter === 'done' ? i.done : !i.done
  )

  const pendingCount = items.filter(i => !i.done).length
  const overdueCount = items.filter(i => !i.done && i.due_date && daysUntil(i.due_date) < 0).length

  return (
    <div className="max-w-2xl mx-auto">
      <StudyNav />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-manrope">Bài tập</h1>
          {overdueCount > 0 && (
            <p className="text-xs text-red-500 font-bold mt-0.5">{overdueCount} bài đã quá hạn</p>
          )}
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">Thêm bài</span>
          <span className="sm:hidden">Thêm</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm p-1 mb-4">
        {[
          { key: 'pending', label: `Chưa xong (${pendingCount})` },
          { key: 'done', label: 'Đã xong' },
          { key: 'all', label: 'Tất cả' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filter === f.key ? 'bg-primary text-white shadow-sm' : 'text-slate-500'
              }`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">check_circle</span>
          <p className="text-slate-400 text-sm">
            {filter === 'pending' ? 'Không có bài tập nào chưa xong! 🎉' : 'Không có bài tập nào.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const p = PRIORITY[item.priority] || PRIORITY.normal
            const diff = daysUntil(item.due_date)
            const isOverdue = !item.done && item.due_date && diff < 0
            return (
              <div key={item.id}
                className={`bg-white rounded-2xl border shadow-sm flex items-start gap-3 p-4 transition-opacity ${item.done ? 'opacity-60' : isOverdue ? 'border-red-200' : 'border-slate-200'
                  }`}>
                {/* Checkbox */}
                <button onClick={() => toggleDone(item)}
                  className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                    }`}>
                  {item.done && <span className="material-symbols-outlined text-[14px]">check</span>}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.bg} ${p.text} ${p.border}`}>
                      {item.subject}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>
                      {p.label}
                    </span>
                  </div>
                  <p className={`font-bold text-sm ${item.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <DeadlineBadge due_date={item.due_date} />
                    {item.notes && <span className="text-[10px] text-slate-400 truncate">{item.notes}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setModal(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <HomeworkForm
          item={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
