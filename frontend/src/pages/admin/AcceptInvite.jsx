import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collaborationService } from '../../services/api';
import { AdminInput } from '../../components/admin/AdminInput';
import Button from '../../components/Button';

/**
 * Landing page of a collaborator invitation link: the invitee chooses a
 * password and goes straight into the dashboard.
 */
export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmation) {
      setError('The passwords don’t match.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await collaborationService.acceptInvite({ email, token, password, password_confirmation: confirmation });
      loginWithToken(res.data.token, res.data.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.errors?.password?.[0] || err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #4A3F35 0%, #6B5D52 50%, #4A3F35 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#FFF9F5] rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <Heart className="w-8 h-8 mx-auto text-[#A67B5B]" />
          <h1 className="text-2xl font-serif text-[#4A3F35]">You&apos;re invited to help plan</h1>
          <p className="text-sm text-stone-600">Choose a password to finish setting up your access.</p>
        </div>

        {!email || !token ? (
          <p className="text-sm text-red-600 text-center">
            This invitation link is incomplete. Open the link from your email again, or ask for a new invitation.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <AdminInput label="Email" value={email} readOnly className="bg-stone-50 text-stone-500" />
            <AdminInput label="Password" type="password" autoComplete="new-password" minLength={8} required
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <AdminInput label="Confirm password" type="password" autoComplete="new-password" minLength={8} required
              value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
            {error && (
              <p role="alert" className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </p>
            )}
            <Button type="submit" variant="secondary" icon={Lock} fullWidth loading={saving}>
              Set password &amp; continue
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-stone-500">
          Already set up? <Link to="/admin" className="text-[#A67B5B] hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
