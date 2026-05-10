import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const PASSWORD_RULES = {
  minLength: 12,
  patterns: [
    { test: (v) => /[a-z]/.test(v), msg: 'a lowercase letter' },
    { test: (v) => /[A-Z]/.test(v), msg: 'an uppercase letter' },
    { test: (v) => /[0-9]/.test(v), msg: 'a number' },
    { test: (v) => /[^a-zA-Z0-9]/.test(v), msg: 'a symbol' },
  ],
};

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', organization_name: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) {
      errs.password = 'Password is required';
    } else {
      if (form.password.length < PASSWORD_RULES.minLength) {
        errs.password = `Password must be at least ${PASSWORD_RULES.minLength} characters`;
      } else {
        const missing = PASSWORD_RULES.patterns.filter((p) => !p.test(form.password)).map((p) => p.msg);
        if (missing.length > 0) {
          errs.password = `Password must include ${missing.join(', ')}`;
        }
      }
    }
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await register(form);
      navigate('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#f0fdf4] p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xl shadow-[#e2e8f0]/50 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-5 shadow-lg shadow-primary-500/20">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Create account</h1>
            <p className="text-sm text-[#64748b] mt-1.5">Get started with NovaCollect</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Full name"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 12 characters, mixed case, number & symbol"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
            />
            <p className="text-xs text-[#94a3b8] -mt-3">Must be at least 12 characters with uppercase, lowercase, number, and symbol</p>
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              error={errors.password_confirmation}
            />

            <Input
              label="Organization name (optional)"
              placeholder="Your Company Inc."
              value={form.organization_name}
              onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
            />

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-[#64748b] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
