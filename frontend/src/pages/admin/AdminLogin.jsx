import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Heart, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FloralCorner } from '../../components/FloralDecorations';

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

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4A3F35 0%, #6B5D52 50%, #4A3F35 100%)' }}
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'rgba(166, 123, 91, 0.15)' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'rgba(200, 166, 142, 0.15)' }}
        />
      </div>

      <FloralCorner position="top-left" size={150} />
      <FloralCorner position="bottom-right" size={150} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div 
          className="rounded-2xl p-8 shadow-2xl"
          style={{ 
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)' }}
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Heart className="w-8 h-8 text-white fill-white/50" />
            </motion.div>
            <h1 
              className="text-3xl mb-2"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#E8D4C8' }}
            >
              Admin Portal
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Sign in to manage your wedding
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl flex items-center gap-3"
              style={{ 
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Login or 2FA Form */}
          {!is2faRequired ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  />
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      }
                    })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-white outline-none transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                    placeholder="admin@wedding.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm mt-1" style={{ color: '#FCA5A5' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  />
                  <input
                    type="password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      }
                    })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-white outline-none transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm mt-1" style={{ color: '#FCA5A5' }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(166, 123, 91, 0.4)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2faVerify} className="space-y-6">
              <div className="text-center mb-4">
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="text-sm italic">
                  Two-factor authentication is enabled. Please enter the code from your authenticator app.
                </p>
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                >
                  Verification Code
                </label>
                <div className="relative">
                  <Lock 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  />
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-white outline-none transition-all text-center text-2xl tracking-[0.5em] font-serif"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(166, 123, 91, 0.4)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <button
                type="button"
                onClick={() => setIs2faRequired(false)}
                className="w-full text-xs transition-colors"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                Back to Login
              </button>
            </form>
          )}

          {/* Footer */}
          <div 
            className="mt-8 pt-6 text-center"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <a 
              href="/" 
              className="text-sm transition-colors"
              style={{ color: '#C8A68E' }}
            >
              ← Back to Wedding Website
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
