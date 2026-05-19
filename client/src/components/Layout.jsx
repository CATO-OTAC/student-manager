import { NavLink, Outlet, useLocation } from 'react-router-dom'

// Định nghĩa 3 section chính
const sections = [
  {
    to: '/calendar',
    icon: 'calendar_month',
    label: 'Lịch',
    paths: ['/calendar'],
    activeColor: 'text-primary',
  },
  {
    to: '/students',
    icon: 'school',
    label: 'Gia sư',
    paths: ['/students', '/sessions', '/reports', '/receipts'],
    activeColor: 'text-blue-700',
  },
  {
    to: '/timetable',
    icon: 'menu_book',
    label: 'Học tập',
    paths: ['/timetable', '/homework', '/exams'],
    activeColor: 'text-violet-600',
  },
]

// Desktop sidebar cũng có full sub-nav
const sidebarItems = [
  { section: 'Lịch', to: '/calendar', icon: 'calendar_month', label: 'Lịch' },
  { section: 'Gia sư', to: '/students', icon: 'group', label: 'Học sinh' },
  { section: 'Gia sư', to: '/sessions', icon: 'fact_check', label: 'Điểm danh' },
  { section: 'Gia sư', to: '/reports', icon: 'bar_chart', label: 'Báo cáo' },
  { section: 'Gia sư', to: '/receipts', icon: 'receipt_long', label: 'Phiếu học phí' },
  { section: 'Học tập', to: '/timetable', icon: 'table_chart', label: 'Thời khóa biểu' },
  { section: 'Học tập', to: '/homework', icon: 'assignment', label: 'Bài tập' },
  { section: 'Học tập', to: '/exams', icon: 'quiz', label: 'Lịch thi' },
]

const SECTION_COLORS = {
  'Lịch': { active: 'text-primary border-primary bg-blue-50', dot: 'bg-primary' },
  'Gia sư': { active: 'text-blue-700 border-blue-700 bg-blue-50', dot: 'bg-blue-600' },
  'Học tập': { active: 'text-violet-700 border-violet-600 bg-violet-50', dot: 'bg-violet-600' },
}

export default function Layout() {
  const { pathname } = useLocation()

  const activeSection = sections.find(s => s.paths.some(p => pathname.startsWith(p)))

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen flex-col z-50 overflow-y-auto bg-slate-50 w-64 border-r border-slate-200 shadow-sm">
        <div className="p-6 flex flex-col gap-1">
          <span className="text-xl font-black tracking-tighter text-blue-800 font-manrope">Aymond</span>
          <span className="font-manrope font-bold tracking-tight text-xs uppercase opacity-60">Planner & Gia sư</span>
        </div>

        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
          {['Lịch', 'Gia sư', 'Học tập'].map(sectionName => {
            const items = sidebarItems.filter(i => i.section === sectionName)
            const colors = SECTION_COLORS[sectionName]
            return (
              <div key={sectionName} className="mb-3">
                <p className="px-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sectionName}</p>
                {items.map(item => (
                  <NavLink key={item.to} to={item.to}
                    className={({ isActive }) => isActive
                      ? `flex items-center gap-3 px-4 py-2.5 font-bold border-r-4 transition-all ${colors.active}`
                      : 'flex items-center gap-3 px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors rounded-r-sm'
                    }>
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <p className="text-[11px] text-slate-400 text-center">Planner & Tutoring Management</p>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center min-h-[60px]"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '0.75rem' }}>
          <span className="text-lg font-black tracking-tighter text-blue-800 font-manrope">Aymond</span>
          {activeSection && (
            <span className="ml-2 text-xs font-bold text-slate-400">/ {activeSection.label}</span>
          )}
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8 pb-28 lg:pb-8">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav — 3 section chính ───────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {sections.map(section => {
            const isActive = section.paths.some(p => pathname.startsWith(p))
            return (
              <NavLink key={section.to} to={section.to}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all active:scale-95 ${isActive ? section.activeColor : 'text-slate-400'
                  }`}>
                <span className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {section.icon}
                </span>
                <span className={`text-[11px] font-bold ${isActive ? '' : 'text-slate-400'}`}>
                  {section.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
