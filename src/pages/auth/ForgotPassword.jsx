import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#f0fdf4] p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xl shadow-[#e2e8f0]/50 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-5 shadow-lg shadow-primary-500/20">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Reset password</h1>
            <p className="text-sm text-[#64748b] mt-1.5">We'll send you a reset link</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {sent ? (
            <div className="text-center animate-fade-in">
              <div className="mb-6 px-4 py-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Reset link sent! Check your email.
                </div>
              </div>
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" loading={loading} className="w-full">
                Send reset link
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-[#64748b] mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
