import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import AuthLayout from '../../components/auth/AuthLayout';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await login(form);
      navigate('/dashboard');
    } catch {}
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your NovaCollect account">
      {error && (
        <div className={styles.errorAlert}>
          <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className={styles.errorTitle}>Login failed</p>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
          <div className={styles.fieldHeader}>
            <label className={styles.fieldLabel}>Password</label>
            <Link to="/forgot-password" className={styles.fieldForgotLink}>
              Forgot password?
            </Link>
          </div>
          <div className={styles.inputWrapper}>
            <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            />
          </div>
          {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
        </div>

        <Button type="submit" loading={loading} className={styles.submitBtn}>
          Sign in
        </Button>
      </form>

      <p className={styles.footer}>
        Don't have an account?{' '}
        <Link to="/register" className={styles.footerLink}>
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
