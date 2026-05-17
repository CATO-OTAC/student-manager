import { useState, useEffect } from 'react'
import { TeachNav } from '../components/SectionNav'
import { sessionsApi } from '../lib/api'

const now = new Date()
const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                     'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

function StatCard({ icon, label, value, iconBg }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border border-slate-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-black text-slate-900 font-manrope mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function Reports() {
  const [period, setPeriod] = useState('month')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [monthSessions, setMonthSessions] = useState([])
  const [yearSessions, setYearSessions] = useState([])
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  useEffect(() => {
    if (period === 'month') {
      sessionsApi.getByMonth(month, year).then(setMonthSessions)
    } else {
      sessionsApi.getByYear(year).then(setYearSessions)
    }
  }, [period, month, year])

  const monthIncome = monthSessions.reduce((s, x) => s + (x.amount || 0), 0)
  const monthStudents = monthSessions.length
  const monthSessionCount = monthSessions.reduce((s, x) => s + x.session_count, 0)

  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const ms = yearSessions.filter(s => s.month === m)
    return {
      month: m,
      studentCount: ms.length,
      sessionCount: ms.reduce((s, x) => s + x.session_count, 0),
      income: ms.reduce((s, x) => s + (x.amount || 0), 0),
    }
  })
  const yearTotal = {
    income: monthlyBreakdown.reduce((s, m) => s + m.income, 0),
    sessions: monthlyBreakdown.reduce((s, m) => s + m.sessionCount, 0),
    months: monthlyBreakdown.filter(m => m.income > 0).length,
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TeachNav />
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900 font-manrope">Báo cáo</h1>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[['month', 'Theo tháng'], ['year', 'Theo năm']].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                period === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {period === 'month' && (
          <>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
        {period === 'year' && (
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* ── MONTH VIEW ── */}
      {period === 'month' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <StatCard icon="payments" label={`Thu nhập T${month}/${year}`}
              value={`${monthIncome.toLocaleString('vi-VN')}đ`} iconBg="bg-emerald-50 text-emerald-600" />
            <StatCard icon="group" label="Học sinh" value={`${monthStudents} em`} iconBg="bg-primary-fixed text-primary" />
            <StatCard icon="event_available" label="Tổng buổi" value={`${monthSessionCount} buổi`} iconBg="bg-secondary-fixed text-secondary" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
            {monthSessions.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">bar_chart</span>
                <p className="text-slate-400 text-sm">Không có dữ liệu tháng {month}/{year}</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 font-manrope">Chi tiết tháng {month}/{year}</h2>
                  <span className="font-black text-lg text-secondary font-manrope">{monthIncome.toLocaleString('vi-VN')}đ</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Học sinh</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Lớp</th>
                      <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Học phí/buổi</th>
                      <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Buổi</th>
                      <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Thu nhập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {monthSessions.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{s.students?.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{s.students?.class_name || '—'}</td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600">
                          {(s.students?.fee_per_session || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-700">{s.session_count}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-sm text-secondary bg-secondary-container/20 px-3 py-1 rounded-full">
                            {(s.amount || 0).toLocaleString('vi-VN')}đ
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={3} className="px-6 py-4 font-bold text-slate-900">Tổng cộng</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">{monthSessionCount}</td>
                      <td className="px-6 py-4 text-right font-black text-secondary text-lg font-manrope">
                        {monthIncome.toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </div>
        </>
      )}

      {/* ── YEAR VIEW ── */}
      {period === 'year' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <StatCard icon="payments" label={`Tổng thu ${year}`}
              value={`${yearTotal.income.toLocaleString('vi-VN')}đ`} iconBg="bg-emerald-50 text-emerald-600" />
            <StatCard icon="event_available" label="Tổng buổi"
              value={`${yearTotal.sessions} buổi`} iconBg="bg-primary-fixed text-primary" />
            <StatCard icon="calendar_month" label="Tháng có dữ liệu"
              value={`${yearTotal.months}/12`} iconBg="bg-secondary-fixed text-secondary" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-slate-900 font-manrope">Thu nhập theo tháng — {year}</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Tháng</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Học sinh</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Số buổi</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Thu nhập</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthlyBreakdown.map(m => {
                  const isCurrent = m.month === now.getMonth() + 1 && year === now.getFullYear()
                  const hasData = m.income > 0
                  return (
                    <tr key={m.month} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${hasData ? 'text-slate-900' : 'text-slate-400'}`}>
                            {MONTH_NAMES[m.month - 1]}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                              Hiện tại
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-3.5 text-right text-sm ${hasData ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                        {hasData ? m.studentCount : '—'}
                      </td>
                      <td className={`px-6 py-3.5 text-right text-sm ${hasData ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                        {hasData ? m.sessionCount : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {hasData ? (
                          <span className="font-bold text-sm text-secondary bg-secondary-container/20 px-3 py-1 rounded-full">
                            {m.income.toLocaleString('vi-VN')}đ
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">0đ</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="px-6 py-4 font-black text-slate-900">Tổng cả năm</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700">
                    {yearTotal.months > 0 ? '—' : '—'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700">{yearTotal.sessions || '—'}</td>
                  <td className="px-6 py-4 text-right font-black text-secondary text-xl font-manrope">
                    {yearTotal.income.toLocaleString('vi-VN')}đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
