import { NavLink } from 'react-router-dom';

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    description: 'Overview and workspace health',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    path: '/forms',
    label: 'Forms',
    description: 'Build and publish workflows',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    path: '/submissions',
    label: 'Submissions',
    description: 'Track incoming responses',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    path: '/analytics',
    label: 'Analytics',
    description: 'Monitor growth and trends',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    path: '/projects',
    label: 'Projects',
    description: 'Coordinate teams and tasks',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  },
  {
    path: '/reports',
    label: 'Reports',
    description: 'Export and share outputs',
    icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <button type="button" className="sidebar-overlay lg:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`app-sidebar ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
        <div className="app-sidebar-panel">
          <div className="sidebar-brand">
            <div className="sidebar-brand-top">
              <div className="sidebar-logo">N</div>
              <div className="sidebar-brand-copy">
                <h1>NovaCollect</h1>
                <p>Operational hub for field data collection</p>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Workspace</div>
            <div className="sidebar-nav-group">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      <div className="sidebar-link-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d={item.icon} />
                        </svg>
                      </div>
                      <div className="sidebar-link-copy">
                        <span className="sidebar-link-title">{item.label}</span>
                        <span className="sidebar-link-desc">{item.description}</span>
                      </div>
                      {isActive && <span className="sidebar-link-pill" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-card">
              <p>Production Workspace</p>
              <p>Organize forms, monitor submissions, and keep delivery teams aligned.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
