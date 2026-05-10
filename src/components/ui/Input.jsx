import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', type = 'text', ...props }, ref) => {
  return (
    <div className="input-group w-full">
      {label && <label className="input-label">{label}</label>}
      <input
        ref={ref}
        type={type}
        className={`input-field ${error ? 'error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="input-error">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
