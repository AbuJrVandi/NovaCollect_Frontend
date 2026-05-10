import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const routeMeta = [
  { match: (path) => path.startsWith('/dashboard'), label: 'Dashboard', subtitle: 'Workspace overview and activity' },
  { match: (path) => path.startsWith('/forms/new'), label: 'Create Form', subtitle: 'Design a new data collection workflow' },
  { match: (path) => path.includes('/forms/') && path.endsWith('/edit'), label: 'Edit Form', subtitle: 'Update structure, fields, and publishing state' },
  { match: (path) => path.startsWith('/forms'), label: 'Forms', subtitle: 'Manage form templates and publishing' },
  { match: (path) => path.startsWith('/submissions/'), label: 'Submission Detail', subtitle: 'Inspect payloads, files, and metadata' },
  { match: (path) => path.startsWith('/submissions'), label: 'Submissions', subtitle: 'Review all collected responses' },
  { match: (path) => path.startsWith('/analytics'), label: 'Analytics', subtitle: 'Monitor trends and performance signals' },
  { match: (path) => path.startsWith('/projects/'), label: 'Project Board', subtitle: 'Coordinate field work across task stages' },
  { match: (path) => path.startsWith('/projects'), label: 'Projects', subtitle: 'Track projects, delivery, and execution' },
  { match: (path) => path.startsWith('/reports'), label: 'Reports', subtitle: 'Generate and manage exports' },
  { match: (path) => path.startsWith('/notifications'), label: 'Notifications', subtitle: 'Stay on top of workspace updates' },
];

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const meta = routeMeta.find((item) => item.match(location.pathname)) ?? routeMeta[0];

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="app-topbar">
      <div className="app-topbar-inner">
        <div className="topbar-left">
          <button
            onClick={onMenuClick}
            className="topbar-menu-btn"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="topbar-copy">
            <div className="topbar-label">Workspace</div>
            <div className="topbar-title">{meta.label}</div>
            <div className="topbar-subtitle">{meta.subtitle}</div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-chip">
            <span className="topbar-chip-dot" />
            Ready for production operations
          </div>

          <div className="topbar-user" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="topbar-user-btn"
            >
              <div className="topbar-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="topbar-user-copy">
                <strong>{user?.name || 'User'}</strong>
                <span>{user?.email || 'Signed in'}</span>
              </div>
              <svg className={`w-4 h-4 text-[#8a98b6] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="topbar-dropdown animate-scale-in">
                <div className="topbar-dropdown-header">
                  <p>{user?.name || 'User'}</p>
                  <p>{user?.email || 'No email available'}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="topbar-dropdown-action"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
