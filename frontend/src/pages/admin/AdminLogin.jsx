import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import AuthLayout, { AuthError, AuthField, AuthSubmit } from '../../components/admin/AuthLayout';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, verify2fa, isAuthenticated } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [is2faRequired, setIs2faRequired] = useState(false);
  const [emailFor2fa, setEmailFor2fa] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    
    const result = await login(data.email, data.password);
    
    if (result.success) {
      if (result.requires_2fa) {
        setIs2faRequired(true);
        setEmailFor2fa(result.email);
      } else {
        navigate('/admin/dashboard');
      }
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handle2faVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await verify2fa(emailFor2fa, twoFactorCode);
    
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  if (is2faRequired) {
    return (
      <AuthLayout
        title="Two-step verification"
        subtitle="Enter the 6-digit code from your authenticator app to finish signing in."
        footer={<button type="button" onClick={() => { setIs2faRequired(false); setError(null); }} className="hover:text-[#4A3F35]">← Use a different account</button>}
      >
        <AuthError>{error}</AuthError>
        <form onSubmit={handle2faVerify} className="space-y-6">
          <AuthField
            id="admin-login-2fa"
            label="Verification code"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            required
            autoFocus
            inputClassName="text-center text-xl tracking-[0.6em] font-semibold"
          />
          <AuthSubmit loading={loading}>{loading ? 'Verifying…' : 'Verify & sign in'}</AuthSubmit>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to plan the wedding — guests, invitations, seating and everything in between."
      footer={<a href="/" className="hover:text-[#4A3F35]">← Back to the wedding website</a>}
    >
      <AuthError>{error}</AuthError>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthField
          id="admin-login-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />
        <AuthField
          id="admin-login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Type your password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />
        <div className="text-xs text-[#A68B76] text-right -mt-1">Forgot it? Ask a dashboard owner to reset it.</div>
        <div className="pt-2">
          <AuthSubmit loading={loading}>{loading ? 'Signing in…' : 'Sign in'}</AuthSubmit>
        </div>
      </form>
    </AuthLayout>
  );
}
