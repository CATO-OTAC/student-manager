import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/students', icon: 'group', label: 'Học sinh' },
  { to: '/weekly', icon: 'calendar_view_week', label: 'Lịch tuần' },
  { to: '/sessions', icon: 'fact_check', label: 'Điểm danh' },
  { to: '/reports', icon: 'bar_chart', label: 'Báo cáo' },
  { to: '/receipts', icon: 'receipt_long', label: 'In phiếu học phí' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased flex">
      <aside className="fixed left-0 top-0 h-screen flex flex-col z-50 overflow-y-auto bg-slate-50 w-64 border-r border-slate-200 shadow-sm">
        <div className="p-6 flex flex-col gap-1">
          <span className="text-xl font-black tracking-tighter text-blue-800 font-manrope">Aymond</span>
          <span className="font-manrope font-bold tracking-tight text-xs uppercase opacity-60">Tutoring Management</span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-4 py-3 text-blue-700 font-bold border-r-4 border-blue-700 bg-blue-50 transition-all'
                  : 'flex items-center gap-3 px-4 py-3 text-slate-600 font-medium hover:bg-slate-100 hover:text-blue-600 transition-colors duration-200'
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-sm font-inter">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <p className="text-[11px] text-slate-400 text-center font-inter">Quản lý dạy thêm tư nhân</p>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen p-6 md:p-8 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
