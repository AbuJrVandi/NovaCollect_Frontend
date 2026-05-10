import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/forms', label: 'Forms', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/submissions', label: 'Submissions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { path: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/projects', label: 'Projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { path: '/reports', label: 'Reports', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function Sidebar({ open }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden transition-opacity" onClick={() => {}} />
      )}
      <aside className={`fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-[#e2e8f0] transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto flex flex-col ${
        open ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      }`}>
        <div className="flex items-center h-16 px-5 border-b border-[#e2e8f0] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">N</span>
            </div>
            <span className="text-lg font-semibold text-[#0f172a] tracking-tight">NovaCollect</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                    isActive ? 'text-primary-600' : 'text-[#94a3b8] group-hover:text-[#64748b]'
                  }`}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={item.icon} />
                    </svg>
                  </div>
                  <span>{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[#e2e8f0] flex-shrink-0">
          <div className="px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary-50 to-indigo-50/50">
            <p className="text-xs font-medium text-primary-700">NovaCollect v1.0</p>
            <p className="text-[10px] text-primary-400 mt-0.5">Data Collection Platform</p>
          </div>
        </div>
      </aside>
    </>
  );
}
