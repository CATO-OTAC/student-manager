import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/students', icon: 'group', label: 'Học sinh' },
  { to: '/weekly', icon: 'calendar_view_week', label: 'Lịch tuần' },
  { to: '/sessions', icon: 'fact_check', label: 'Điểm danh' },
  { to: '/reports', icon: 'bar_chart', label: 'Báo cáo' },
  { to: '/receipts', icon: 'receipt_long', label: 'Phiếu' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">

      {/* ── Desktop sidebar (lg+) ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen flex-col z-50 overflow-y-auto bg-slate-50 w-64 border-r border-slate-200 shadow-sm">
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

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 flex items-center"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '0.75rem' }}>
          <span className="text-lg font-black tracking-tighter text-blue-800 font-manrope">Aymond</span>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom navigation bar ────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                  isActive
                    ? 'text-blue-700'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-blue-700' : ''}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  )
}
