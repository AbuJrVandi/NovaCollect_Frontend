import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../store/authStore';

export default function Navbar({ onMenuClick }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-all duration-150 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span className="text-[#94a3b8]">Welcome back,</span>
          <span className="font-medium text-[#0f172a]">{user?.name || 'User'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-[#f1f5f9] transition-all duration-150 active:scale-95"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <svg className={`w-4 h-4 text-[#94a3b8] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e2e8f0] py-1.5 z-20 animate-scale-in origin-top-right">
              <div className="px-4 py-3 border-b border-[#e2e8f0]">
                <p className="text-sm font-semibold text-[#0f172a]">{user?.name || 'User'}</p>
                <p className="text-xs text-[#64748b] mt-0.5">{user?.email || ''}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#475569] hover:bg-[#f1f5f9] transition-colors duration-150"
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
    </header>
  );
}
