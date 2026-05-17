import { NavLink } from 'react-router-dom'

export function TeachNav() {
  const items = [
    { to: '/students', label: 'Học sinh' },
    { to: '/sessions', label: 'Điểm danh' },
    { to: '/reports',  label: 'Báo cáo'  },
    { to: '/receipts', label: 'Phiếu'    },
  ]
  return (
    <div className="flex bg-white rounded-2xl border border-slate-200 shadow-sm p-1 mb-5 overflow-x-auto">
      {items.map(item => (
        <NavLink key={item.to} to={item.to}
          className={({ isActive }) =>
            `flex-1 py-2 px-1 rounded-xl text-xs font-bold text-center transition-all whitespace-nowrap ${
              isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`
          }>
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

export function StudyNav() {
  const items = [
    { to: '/timetable', label: 'Thời khóa biểu' },
    { to: '/homework',  label: 'Bài tập'         },
    { to: '/exams',     label: 'Lịch thi'         },
  ]
  return (
    <div className="flex bg-white rounded-2xl border border-slate-200 shadow-sm p-1 mb-5">
      {items.map(item => (
        <NavLink key={item.to} to={item.to}
          className={({ isActive }) =>
            `flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all ${
              isActive ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`
          }>
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}
