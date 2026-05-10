const variants = {
  primary: 'border border-transparent bg-gradient-to-r from-primary-500 via-primary-500 to-[#6f5dff] text-white shadow-[0_16px_30px_rgba(43,99,246,0.22)] hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(43,99,246,0.28)]',
  secondary: 'border border-[rgba(165,181,218,0.24)] bg-white/90 text-[#445579] shadow-[0_10px_24px_rgba(36,63,118,0.06)] hover:-translate-y-0.5 hover:bg-white hover:text-[#10203f]',
  danger: 'border border-transparent bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-[0_16px_30px_rgba(220,38,38,0.2)] hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(220,38,38,0.28)]',
  ghost: 'border border-transparent bg-transparent text-[#5d6d8f] hover:bg-white/70 hover:text-[#10203f]',
};

const sizes = {
  sm: 'px-3.5 py-2 text-xs gap-1.5 rounded-[14px]',
  md: 'px-4.5 py-2.5 text-sm gap-2 rounded-[16px]',
  lg: 'px-5.5 py-3 text-sm gap-2 rounded-[18px]',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-primary-500/15 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px ${variants[variant]} ${sizes[size]} ${className}`}
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
