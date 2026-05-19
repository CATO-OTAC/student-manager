import { useState, useEffect } from 'react'
import Modal from './Modal'
import { schedulesApi, supabase } from '../lib/api'

const DAYS = [
  { value: 1, label: 'T2', full: 'Thứ Hai' },
  { value: 2, label: 'T3', full: 'Thứ Ba' },
  { value: 3, label: 'T4', full: 'Thứ Tư' },
  { value: 4, label: 'T5', full: 'Thứ Năm' },
  { value: 5, label: 'T6', full: 'Thứ Sáu' },
  { value: 6, label: 'T7', full: 'Thứ Bảy' },
  { value: 7, label: 'CN', full: 'Chủ Nhật' },
]

const formatDate = (str) => {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}
const todayStr = () => new Date().toISOString().split('T')[0]

// schedule = [{day, start_time, end_time}, ...]
// Một ngày có thể có nhiều slot (học 2 buổi/ngày)
function DayScheduleEditor({ schedule, onChange }) {
  // Danh sách ngày đã có ít nhất 1 slot
  const activeDays = [...new Set(schedule.map(s => s.day))].sort((a, b) => a - b)

  const toggleDay = (day) => {
    if (activeDays.includes(day)) {
      // Xóa tất cả slot của ngày này
      onChange(schedule.filter(s => s.day !== day))
    } else {
      // Thêm 1 slot mặc định
      const sorted = [...schedule, { day, start_time: '19:00', end_time: '21:00' }]
        .sort((a, b) => a.day - b.day || a.start_time.localeCompare(b.start_time))
      onChange(sorted)
    }
  }

  const addSlot = (day) => {
    const sorted = [...schedule, { day, start_time: '19:00', end_time: '21:00' }]
      .sort((a, b) => a.day - b.day || a.start_time.localeCompare(b.start_time))
    onChange(sorted)
  }

  const removeSlot = (idx) => onChange(schedule.filter((_, i) => i !== idx))

  const updateTime = (idx, field, value) =>
    onChange(schedule.map((s, i) => i === idx ? { ...s, [field]: value } : s))

  // Group slots by day
  const dayGroups = DAYS
    .map(d => ({
      ...d,
      slots: schedule.map((s, idx) => ({ ...s, idx })).filter(s => s.day === d.value),
    }))
    .filter(d => d.slots.length > 0)

  return (
    <div className="space-y-3">
      {/* Day toggles */}
      <div className="flex gap-2 flex-wrap">
        {DAYS.map(d => (
          <button
            key={d.value}
            type="button"
            title={d.full}
            onClick={() => toggleDay(d.value)}
            className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-colors ${activeDays.includes(d.value)
              ? 'bg-primary border-primary text-white'
              : 'border-slate-200 text-slate-600 hover:border-primary/50 hover:text-primary'
              }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Slots per day */}
      {dayGroups.map(day => (
        <div key={day.value} className="bg-slate-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary">{day.full}</span>
            <button
              type="button"
              onClick={() => addSlot(day.value)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Thêm buổi
            </button>
          </div>
          {day.slots.map(slot => (
            <div key={slot.idx} className="flex items-center gap-2">
              <input
                type="time"
                value={slot.start_time}
                onChange={e => updateTime(slot.idx, 'start_time', e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="text-slate-400 text-sm">—</span>
              <input
                type="time"
                value={slot.end_time}
                onChange={e => updateTime(slot.idx, 'end_time', e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {day.slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(slot.idx)}
                  className="text-slate-400 hover:text-error transition-colors"
                  title="Xóa buổi này"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const formatSchedule = (schedule = []) =>
  schedule.map(s => {
    const day = DAYS.find(d => d.value === s.day)?.label ?? s.day
    return `${day} ${s.start_time}–${s.end_time}`
  }).join(', ')

function ChangeStatus({ change }) {
  const today = todayStr()
  let label, color
  if (change.change_type === 'permanent') {
    label = change.start_date <= today ? 'Đang áp dụng' : 'Sắp áp dụng'
    color = change.start_date <= today ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
  } else {
    if (change.end_date < today) { label = 'Đã hết hạn'; color = 'bg-slate-100 text-slate-500' }
    else if (change.start_date > today) { label = 'Sắp tới'; color = 'bg-blue-100 text-blue-700' }
    else { label = 'Đang áp dụng'; color = 'bg-green-100 text-green-700' }
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
}

const EMPTY_FORM = {
  change_type: 'temporary',
  start_date: todayStr(),
  duration_type: 'weeks',
  weeks: 2,
  end_date: '',
  new_schedule: [],
  notes: '',
}

export default function ScheduleModal({ student, onClose }) {
  const [schedule, setSchedule] = useState([])
  const [changes, setChanges] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [savingDefault, setSavingDefault] = useState(false)
  const [savingChange, setSavingChange] = useState(false)
  const [defaultSaved, setDefaultSaved] = useState(false)
  const [semesters, setSemesters] = useState([])
  const [activeSemId, setActiveSemId] = useState('')

  useEffect(() => {
    supabase.from('semesters').select('*').order('start_date', { ascending: false }).then(({ data }) => {
      setSemesters(data || [])
      if (data?.length > 0) setActiveSemId(data[0].id)
    })
  }, [])

  const reload = async () => {
    if (!activeSemId) return
    const { data: schedData } = await supabase.from('student_schedules')
      .select('*').eq('student_id', student.id).eq('semester_id', activeSemId).maybeSingle()
    const { data: changesData } = await supabase.from('schedule_changes')
      .select('*').eq('student_id', student.id)

    setSchedule(schedData?.schedule || [])
    setChanges(changesData || [])
  }
  useEffect(() => { reload() }, [student.id, activeSemId])

  const handleSaveDefault = async () => {
    setSavingDefault(true)
    setDefaultSaved(false)
    try {
      await supabase.from('student_schedules').upsert({
        student_id: student.id,
        semester_id: activeSemId,
        schedule
      }, { onConflict: 'student_id,semester_id' })
      setDefaultSaved(true)
    } finally {
      setSavingDefault(false)
    }
  }

  const handleSaveChange = async (e) => {
    e.preventDefault()
    setSavingChange(true)
    try {
      await schedulesApi.addChange(student.id, form)
      await reload()
      setShowForm(false)
      setForm({ ...EMPTY_FORM, start_date: todayStr() })
    } finally {
      setSavingChange(false)
    }
  }

  const handleDeleteChange = async (id) => {
    if (!confirm('Xóa thay đổi lịch này?')) return
    await schedulesApi.deleteChange(id)
    reload()
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  return (
    <Modal title={`Lịch học — ${student.name}`} onClose={onClose} size="lg">
      <div className="mb-4 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
        <span className="text-sm font-bold text-slate-700">Chọn học kỳ áp dụng:</span>
        <select value={activeSemId} onChange={e => setActiveSemId(e.target.value)} disabled={semesters.length === 0}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/20">
          {semesters.length === 0 ? <option value="">Chưa có học kỳ</option> : semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!activeSemId ? (
        <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-slate-100">Vui lòng tạo học kỳ trong phần Học tập trước khi xếp lịch dạy.</p>
      ) : (
        <>
          <section className="mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Lịch mặc định</h3>
            <DayScheduleEditor schedule={schedule} onChange={v => { setSchedule(v); setDefaultSaved(false) }} />
            <div className="flex items-center gap-3 mt-4">
              <button type="button" onClick={handleSaveDefault} disabled={savingDefault}
                className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
                {savingDefault ? 'Đang lưu...' : 'Lưu lịch mặc định'}
              </button>
              {defaultSaved && <span className="text-green-600 text-sm font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span> Đã lưu</span>}
            </div>
          </section>

          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Thay đổi lịch</h3>
              {!showForm && (
                <button type="button" onClick={() => setShowForm(true)} className="text-primary hover:underline text-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">add</span>Thêm thay đổi
                </button>
              )}
            </div>

            {showForm && (
              <form onSubmit={handleSaveChange} className="bg-slate-50 rounded-xl p-4 mb-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Ngày bắt đầu</label>
                    <input type="date" required value={form.start_date}
                      onChange={e => set('start_date', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Kiểu thay đổi</label>
                    <div className="flex flex-wrap gap-4 mt-1">
                      {[['temporary', 'Tạm thời'], ['permanent', 'Vĩnh viễn']].map(([val, lab]) => (
                        <label key={val} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="radio" value={val} checked={form.change_type === val}
                            onChange={e => set('change_type', e.target.value)} className="accent-primary" />
                          {lab}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {form.change_type === 'temporary' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Thời hạn</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" value="weeks" checked={form.duration_type === 'weeks'}
                          onChange={e => set('duration_type', e.target.value)} className="accent-primary" />
                        Trong
                      </label>
                      <input type="number" min={1} max={52} value={form.weeks}
                        disabled={form.duration_type !== 'weeks'}
                        onChange={e => set('weeks', e.target.value)}
                        className="w-16 border border-slate-200 rounded-lg px-2 py-2 text-sm text-center disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      <span className="text-sm text-slate-600">tuần — hoặc đến ngày</span>
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" value="date" checked={form.duration_type === 'date'}
                          onChange={e => set('duration_type', e.target.value)} className="accent-primary" />
                      </label>
                      <input type="date" value={form.end_date}
                        disabled={form.duration_type !== 'date'}
                        onChange={e => set('end_date', e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    Lịch mới <span className="text-red-500">*</span>
                  </label>
                  <DayScheduleEditor schedule={form.new_schedule} onChange={v => set('new_schedule', v)} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Ghi chú</label>
                  <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="Lý do thay đổi lịch..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={savingChange || form.new_schedule.length === 0}
                    className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-sm">
                    {savingChange ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button type="button"
                    onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM, start_date: todayStr() }) }}
                    className="px-5 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm">
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {changes.length > 0 ? (
              <div className="space-y-2">
                {changes.map(change => (
                  <div key={change.id} className="flex items-start justify-between p-3 border border-slate-200 rounded-xl bg-white">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${change.change_type === 'permanent' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {change.change_type === 'permanent' ? 'Vĩnh viễn' : 'Tạm thời'}
                        </span>
                        <ChangeStatus change={change} />
                      </div>
                      <p className="text-sm text-slate-800 font-medium">{formatSchedule(change.new_schedule)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {change.change_type === 'permanent'
                          ? `Từ ${formatDate(change.start_date)}`
                          : `${formatDate(change.start_date)} → ${formatDate(change.end_date)}`}
                        {change.notes && ` · ${change.notes}`}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteChange(change.id)}
                      className="text-slate-400 hover:text-error ml-3 shrink-0">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              !showForm && <p className="text-sm text-slate-400">Chưa có thay đổi lịch nào.</p>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}
