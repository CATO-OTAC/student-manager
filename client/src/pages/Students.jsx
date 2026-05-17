import { useState, useEffect } from 'react'
import { studentsApi, schedulesApi } from '../lib/api'
import Modal from '../components/Modal'
import ScheduleModal from '../components/ScheduleModal'

const DAYS_SHORT = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`)
const EMPTY = { name: '', class_name: '', fee_per_session: '', parent_name: '', parent_phone: '' }

const AVATAR_COLORS = [
  { bg: 'bg-primary-fixed', text: 'text-primary' },
  { bg: 'bg-secondary-fixed', text: 'text-secondary' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
]

function getInitials(name) {
  return name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase()
}

// ─── Info row cho detail modal ─────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[18px] text-slate-500">{icon}</span>
      </div>
      <div>
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Student detail modal ──────────────────────────────────────────────────────
function StudentDetailModal({ student, schedule, colorIdx, onEdit, onDelete, onSchedule, onClose }) {
  const color = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center border-b border-slate-100 relative">
          <button onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className={`w-20 h-20 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-2xl font-black mx-auto mb-4`}>
            {getInitials(student.name)}
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-manrope leading-tight">{student.name}</h2>
          <p className="text-slate-500 mt-1 font-medium">{student.class_name || '—'}</p>
        </div>

        {/* Info */}
        <div className="px-6 py-5 space-y-4 border-b border-slate-100">
          <InfoRow icon="payments" label="Học phí / buổi"
            value={`${(student.fee_per_session || 0).toLocaleString('vi-VN')}đ`} />
          <InfoRow icon="person" label="Phụ huynh" value={student.parent_name} />
          <InfoRow icon="phone" label="Số điện thoại" value={student.parent_phone} />
        </div>

        {/* Schedule */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Lịch học</span>
            <button onClick={onSchedule}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">edit_calendar</span>
              Quản lý lịch
            </button>
          </div>
          {schedule.length > 0 ? (
            <div className="space-y-1.5">
              {schedule.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-center text-xs font-black bg-blue-50 text-primary border border-blue-100 px-1 py-0.5 rounded-md">
                    {DAYS_SHORT[slot.day]}
                  </span>
                  <span className="text-slate-700 font-medium">{slot.start_time}–{slot.end_time}</span>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={onSchedule} className="text-sm text-slate-400 hover:text-primary transition-colors">
              Chưa thiết lập lịch học →
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-2">
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-error border border-error/30 hover:bg-error/5 transition-colors">
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Xóa
          </button>
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
            Đóng
          </button>
          <button onClick={onEdit}
            className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Sửa
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Students() {
  const [students, setStudents]       = useState([])
  const [scheduleMap, setScheduleMap] = useState({})
  const [detailStudent, setDetailStudent] = useState(null)   // student being viewed
  const [editModal, setEditModal]     = useState(false)
  const [scheduleModal, setScheduleModal] = useState(null)   // student for schedule modal
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const s = await studentsApi.getAll()
    setStudents(s)
    if (s.length > 0) {
      const allSchedules = await schedulesApi.getAll()
      const map = {}
      allSchedules.forEach(sch => { map[sch.student_id] = sch.schedule || [] })
      setScheduleMap(map)
    }
  }

  useEffect(() => { load() }, [])

  // Mở detail
  const openDetail = (s) => setDetailStudent(s)
  const closeDetail = () => setDetailStudent(null)

  // Mở form edit từ detail
  const openEdit = (s) => {
    setForm({
      name: s.name,
      class_name: s.class_name || '',
      fee_per_session: s.fee_per_session ?? '',
      parent_name: s.parent_name || '',
      parent_phone: s.parent_phone || '',
    })
    setEditId(s.id)
    setDetailStudent(null)
    setEditModal(true)
  }

  // Mở form thêm mới
  const openAdd = () => {
    setForm(EMPTY)
    setEditId(null)
    setEditModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa học sinh này? Dữ liệu điểm danh cũng sẽ bị xóa.')) return
    await studentsApi.delete(id)
    setDetailStudent(null)
    load()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        class_name: form.class_name || null,
        fee_per_session: parseInt(form.fee_per_session) || 0,
        parent_name: form.parent_name || null,
        parent_phone: form.parent_phone || null,
      }
      if (editId) await studentsApi.update(editId, payload)
      else await studentsApi.create(payload)
      setEditModal(false)
      await load()
      // Nếu đang sửa, refresh detail
      if (editId) {
        const updated = await studentsApi.getAll()
        const found = updated.find(s => s.id === editId)
        if (found) setDetailStudent(found)
      }
    } finally {
      setLoading(false)
    }
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const detailStudentIndex = detailStudent
    ? students.findIndex(s => s.id === detailStudent.id)
    : -1

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-manrope">Học sinh</h1>
          <p className="text-sm text-slate-500">Nhấn vào học sinh để xem chi tiết</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary text-white py-2.5 px-6 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Thêm học sinh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        {students.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">group</span>
            <p className="text-slate-400">Chưa có học sinh nào.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Học sinh</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Lớp</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Học phí / buổi</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Lịch học</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((s, idx) => {
                  const schedule = scheduleMap[s.id] || []
                  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                  return (
                    <tr
                      key={s.id}
                      onClick={() => openDetail(s)}
                      className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-black shrink-0`}>
                            {getInitials(s.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 font-manrope">{s.name}</p>
                            {s.parent_phone && <p className="text-xs text-slate-400">{s.parent_phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{s.class_name || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-sm text-secondary bg-secondary-container/20 px-3 py-1 rounded-full">
                          {(s.fee_per_session || 0).toLocaleString('vi-VN')}đ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {schedule.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {schedule.map((slot, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-bold">
                                {DAYS_SHORT[slot.day]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Chưa đặt</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="material-symbols-outlined text-[18px] text-slate-300 group-hover:text-slate-500 transition-colors">
                          chevron_right
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">{students.length} học sinh</span>
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {detailStudent && (
        <StudentDetailModal
          student={detailStudent}
          schedule={scheduleMap[detailStudent.id] || []}
          colorIdx={detailStudentIndex}
          onEdit={() => openEdit(detailStudent)}
          onDelete={() => handleDelete(detailStudent.id)}
          onSchedule={() => {
            setScheduleModal(detailStudent)
            setDetailStudent(null)
          }}
          onClose={closeDetail}
        />
      )}

      {/* Schedule modal */}
      {scheduleModal && (
        <ScheduleModal
          student={scheduleModal}
          onClose={() => { setScheduleModal(null); load() }}
        />
      )}

      {/* Add / Edit form modal */}
      {editModal && (
        <Modal title={editId ? 'Sửa thông tin học sinh' : 'Thêm học sinh'} onClose={() => setEditModal(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên học sinh *</label>
              <input required type="text" value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Lớp</label>
                <select value={form.class_name} onChange={e => set('class_name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium bg-white h-[42px]">
                  <option value="">— Chọn lớp —</option>
                  {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Học phí / buổi (đ) *</label>
                <input required type="number" min={0} value={form.fee_per_session}
                  onChange={e => set('fee_per_session', e.target.value)}
                  placeholder="VD: 100000"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium h-[42px]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên phụ huynh</label>
              <input type="text" value={form.parent_name} onChange={e => set('parent_name', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Số điện thoại phụ huynh</label>
              <input type="tel" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" />
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100 mt-2">
              <button type="button" onClick={() => setEditModal(false)}
                className="px-5 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm">
                Hủy bỏ
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
