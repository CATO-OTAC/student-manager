import { useState, useEffect } from 'react'
import { classesApi } from '../lib/api'
import Modal from '../components/Modal'

const EMPTY = { name: '' }

export default function Classes() {
  const [classes, setClasses] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => classesApi.getAll().then(setClasses)
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = (c) => { setForm({ name: c.name }); setEditId(c.id); setModal(true) }

  const handleDelete = async (id) => {
    if (!confirm('Xóa lớp này? Học sinh trong lớp sẽ không bị xóa.')) return
    await classesApi.delete(id)
    load()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editId) await classesApi.update(editId, { name: form.name })
      else await classesApi.create({ name: form.name })
      setModal(false)
      load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-manrope">Lớp học</h1>
          <p className="text-sm text-slate-500">Quản lý các lớp học (học phí đặt riêng cho từng học sinh)</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary text-white py-2.5 px-6 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Thêm lớp
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {classes.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">school</span>
            <p className="text-slate-400">Chưa có lớp nào. Hãy thêm lớp mới.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Tên lớp</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 font-bold text-slate-900 font-manrope">{c.name}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => openEdit(c)} className="text-primary hover:underline text-sm font-medium">Sửa</button>
                      <button onClick={() => handleDelete(c.id)} className="text-error hover:underline text-sm font-medium">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">{classes.length} lớp</span>
            </div>
          </>
        )}
      </div>

      {modal && (
        <Modal title={editId ? 'Sửa lớp' : 'Thêm lớp mới'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên lớp *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                placeholder="VD: Toán 10, Anh Văn 8..."
              />
            </div>
            <div className="flex gap-3 pt-2 border-t border-slate-100 mt-2">
              <button type="button" onClick={() => setModal(false)}
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
