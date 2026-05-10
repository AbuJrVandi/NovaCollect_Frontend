import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import AuthLayout from '../../components/auth/AuthLayout';
import styles from './Register.module.css';

const PASSWORD_RULES = {
  minLength: 12,
  patterns: [
    { test: (v) => /[a-z]/.test(v), label: 'lowercase' },
    { test: (v) => /[A-Z]/.test(v), label: 'uppercase' },
    { test: (v) => /[0-9]/.test(v), label: 'number' },
    { test: (v) => /[^a-zA-Z0-9]/.test(v), label: 'symbol' },
  ],
};

function PasswordStrength({ password }) {
  const checks = PASSWORD_RULES.patterns.map((p) => ({ label: p.label, met: p.test(password) }));
  const metCount = checks.filter((c) => c.met).length;
  const strength = password.length >= PASSWORD_RULES.minLength ? metCount + 1 : metCount;
  const bars = Math.min(strength, 4);
  const barClass = bars <= 2 ? styles.strengthBar1 : bars === 3 ? styles.strengthBar2 : styles.strengthBar3;

  return (
    <div className={styles.strengthMeter}>
      <div className={styles.strengthBars}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${styles.strengthBar} ${i < bars ? barClass : ''}`} />
        ))}
      </div>
      <div className={styles.strengthChecks}>
        {checks.map((c) => (
          <div key={c.label} className={`${styles.strengthCheck} ${c.met ? styles.strengthCheckMet : styles.strengthCheckUnmet}`}>
            <svg className={styles.checkIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {c.met ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              ) : (
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
              )}
            </svg>
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

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
        const missing = PASSWORD_RULES.patterns.filter((p) => !p.test(form.password)).map((p) => p.label);
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
    <AuthLayout title="Create your account" subtitle="Get started with NovaCollect">
      {error && (
        <div className={styles.errorAlert}>
          <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className={styles.errorTitle}>Registration failed</p>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Full name</label>
          <div className={styles.inputWrapper}>
            <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            />
          </div>
          {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Email</label>
          <div className={styles.inputWrapper}>
            <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            />
          </div>
          {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Password</label>
          <div className={styles.inputWrapper}>
            <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password"
              placeholder="Min. 12 characters, mixed case, number & symbol"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            />
          </div>
          {form.password && <PasswordStrength password={form.password} />}
          {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Confirm password</label>
          <div className={styles.inputWrapper}>
            <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <input
              type="password"
              placeholder="Repeat your password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              className={`${styles.input} ${errors.password_confirmation ? styles.inputError : ''}`}
            />
          </div>
          {errors.password_confirmation && <p className={styles.fieldError}>{errors.password_confirmation}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Organization name</label>
          <div className={styles.inputWrapper}>
            <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <input
              placeholder="Your Company Inc. (optional)"
              value={form.organization_name}
              onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
              className={styles.input}
            />
          </div>
        </div>

        <div className="pt-1">
          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </div>

        <p className={styles.terms}>
          By creating an account, you agree to our{' '}
          <span className={styles.termsLink}>Terms of Service</span> and{' '}
          <span className={styles.termsLink}>Privacy Policy</span>.
        </p>
      </form>

      <p className={styles.footer}>
        Already have an account?{' '}
        <Link to="/login" className={styles.footerLink}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
