import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collaborationService } from '../../services/api';
import AuthLayout, { AuthError, AuthField, AuthSubmit } from '../../components/admin/AuthLayout';

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
    <AuthLayout
      title="You're invited to help plan"
      subtitle="Choose a password to finish setting up your access to the wedding planner."
      footer={<>Already set up? <Link to="/admin" className="font-medium text-[#A06A47] hover:underline">Sign in</Link></>}
    >
      {!email || !token ? (
        <AuthError>
          This invitation link is incomplete. Open the link from your email again, or ask for a new invitation.
        </AuthError>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <AuthError>{error}</AuthError>
          <AuthField id="invite-email" label="Email" value={email} readOnly />
          <AuthField id="invite-password" label="Password" type="password" autoComplete="new-password" minLength={8} required
            placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          <AuthField id="invite-password-confirm" label="Confirm password" type="password" autoComplete="new-password" minLength={8} required
            placeholder="Type it again" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          <div className="pt-2">
            <AuthSubmit loading={saving}>Set password &amp; continue</AuthSubmit>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
