const variants = {
  primary: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-sm hover:shadow-md active:shadow-sm',
  secondary: 'bg-white text-[#475569] hover:bg-[#f1f5f9] border border-[#e2e8f0] hover:border-[#cbd5e1] active:bg-[#e2e8f0]',
  danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-sm hover:shadow-md active:shadow-sm',
  ghost: 'bg-transparent text-[#475569] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
