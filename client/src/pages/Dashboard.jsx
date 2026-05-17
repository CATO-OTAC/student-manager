import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { sessionsApi, studentsApi } from '../lib/api'

function StatCard({ icon, label, value, sub, iconBg }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4 border border-slate-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-on-surface mt-0.5 font-manrope">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const now = new Date()
  const [month] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())
  const [sessions, setSessions] = useState([])
  const [studentCount, setStudentCount] = useState(0)
  useEffect(() => {
    Promise.all([
      sessionsApi.getByMonth(month, year),
      studentsApi.getAll(),
    ]).then(([s, st]) => {
      setSessions(s)
      setStudentCount(st.length)
    })
  }, [])

  const totalIncome = sessions.reduce((sum, s) => sum + (s.amount || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-manrope">Tổng quan</h1>
        <p className="text-sm text-slate-500 mt-0.5">Tháng {month}/{year} · Xem chi tiết trong <Link to="/reports" className="text-primary hover:underline">Báo cáo</Link></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="payments"
          label={`Thu nhập tháng ${month}/${year}`}
          value={`${totalIncome.toLocaleString('vi-VN')}đ`}
          iconBg="bg-green-100 text-green-700"
        />
        <StatCard
          icon="group"
          label="Tổng học sinh"
          value={studentCount}
          sub="học sinh đang dạy"
          iconBg="bg-primary-fixed text-primary"
        />
        <StatCard
          icon="event_available"
          label="Buổi học tháng này"
          value={`${sessions.reduce((s, x) => s + x.session_count, 0)} buổi`}
          iconBg="bg-secondary-fixed text-secondary"
        />
      </div>

      {sessions.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h2 className="font-bold text-slate-900 font-manrope">Chi tiết tháng {month}/{year}</h2>
            <Link to="/reports" className="text-sm text-primary hover:underline font-medium">
              Xem báo cáo đầy đủ →
            </Link>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Học sinh</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Lớp</th>
                <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Số buổi</th>
                <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Học phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4 font-medium text-slate-900">{s.students?.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{s.students?.class_name}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{s.session_count}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-sm tracking-tight text-secondary bg-secondary-container/20 px-3 py-1 rounded-full">
                      {(s.amount || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td colSpan={3} className="px-6 py-4 font-bold text-slate-900">Tổng cộng</td>
                <td className="px-6 py-4 text-right">
                  <span className="font-black text-lg text-secondary font-manrope">
                    {totalIncome.toLocaleString('vi-VN')}đ
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">fact_check</span>
          <p className="text-slate-400 mb-4">Chưa có dữ liệu điểm danh tháng {month}/{year}</p>
          <Link
            to="/sessions"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nhập điểm danh
          </Link>
        </div>
      )}
    </div>
  )
}
