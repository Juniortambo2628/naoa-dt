import { useState, useEffect } from 'react';
import { twoFactorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings, useUpdateSettings } from '../../hooks/useApiHooks';
import { Save, Shield, ShieldCheck, Settings, Info, Mail, Music, Globe, Lock, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminModal from '../../components/admin/AdminModal';
import { AdminInput } from '../../components/admin/AdminInput';
import Spinner from '../../components/admin/Spinner';
import LocationPicker from '../../components/LocationPicker';

const settingSections = [
  {
    id: 'general',
    label: 'General',
    icon: Globe,
    description: 'Control public-facing features and primary URL.',
  },
  {
    id: 'security',
    label: 'Security',
    icon: Lock,
    description: 'Protect your account with two-factor authentication.',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Mail,
    description: 'Choose when and where you receive alerts.',
  },
  {
    id: 'features',
    label: 'Features',
    icon: Music,
    description: 'Toggle optional functionality like song request limits.',
  },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    rsvp_enabled: false,
    admin_email_notifications: false,
    admin_email: '',
    public_url: '',
    song_request_limit_enabled: true,
    venue_lat: '',
    venue_lng: '',
  });

  const { data: settingsData, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const { user, checkAuth } = useAuth();
  const [show2faModal, setShow2faModal] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying2fa, setVerifying2fa] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(false);

  useEffect(() => {
    if (user) {
        setIs2faEnabled(!!user.two_factor_confirmed_at);
    }
  }, [user]);

  useEffect(() => {
    if (settingsData) {
        setSettings({
          rsvp_enabled: String(settingsData.rsvp_enabled) === 'true',
          admin_email_notifications: String(settingsData.admin_email_notifications) === 'true',
          admin_email: settingsData.admin_email || '',
          public_url: settingsData.public_url || '',
          song_request_limit_enabled: String(settingsData.song_request_limit_enabled) !== 'false',
          venue_lat: settingsData.venue_lat || '',
          venue_lng: settingsData.venue_lng || '',
        });
    }
  }, [settingsData]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
        const payload = {
            ...settings,
            rsvp_enabled: String(settings.rsvp_enabled),
            admin_email_notifications: String(settings.admin_email_notifications),
            song_request_limit_enabled: String(settings.song_request_limit_enabled),
        };

        await updateSettingsMutation.mutateAsync(payload);
        toast.success('System settings saved successfully');
    } catch (err) {
        console.error('Settings save error:', err);
        toast.error('Failed to save settings: ' + (err.response?.data?.message || err.message));
    }
  };

  const handle2faToggle = async () => {
    if (is2faEnabled) {
        if (window.confirm('Are you sure you want to disable Two-Factor Authentication?')) {
            try {
                await twoFactorService.disable();
                await checkAuth();
                alert('2FA disabled');
            } catch (e) {
                alert('Failed to disable 2FA');
            }
        }
    } else {
        setVerifying2fa(true);
        try {
            const res = await twoFactorService.setup();
            setTwoFactorData(res.data);
            setShow2faModal(true);
        } catch (e) {
            alert('Failed to initiate 2FA setup');
        }
        setVerifying2fa(false);
    }
  };

  const handleConfirm2fa = async (e) => {
    e.preventDefault();
    setVerifying2fa(true);
    try {
        await twoFactorService.confirm(verificationCode);
        await checkAuth();
        setShow2faModal(false);
        setVerificationCode('');
        alert('Two-factor authentication enabled successfully!');
    } catch (e) {
        alert(e.response?.data?.message || 'Invalid verification code');
    }
    setVerifying2fa(false);
  };

  if (isLoading) return <div className="text-center py-8"><Spinner size="lg" /></div>;

  return (
    <AdminPageLayout
      hero={
        <AdminPageHero
          title="System Settings"
          description="Manage system preferences, security, and RSVP visibility."
          breadcrumb="Settings"
          icon={<Settings className="w-5 h-5 text-[#A67B5B]" />}
        />
      }
    >
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* General */}
            <SettingsCard icon={Globe} title="General" description="Public URL and core site behavior.">
              <div className="space-y-5">
                <Toggle
                  id="rsvpToggle"
                  checked={settings.rsvp_enabled}
                  onChange={(checked) => setSettings({ ...settings, rsvp_enabled: checked })}
                  label="Enable Public RSVP Form"
                  hint="Let guests submit or update their RSVP from the public site."
                />

                <div className="pt-4 border-t border-stone-100">
                  <AdminInput
                    label="Public App URL"
                    type="url"
                    placeholder="https://dntwed.okjtech.co.ke"
                    value={settings.public_url}
                    onChange={(e) => setSettings({ ...settings, public_url: e.target.value })}
                  />
                  <p className="mt-1.5 text-xs text-stone-400">Used for absolute links in generated PDFs and emails.</p>
                </div>
              </div>
            </SettingsCard>

            {/* Venue Location */}
            <SettingsCard icon={MapPin} title="Venue Location" description="GPS coordinates for the map on guest invitations.">
              <LocationPicker
                lat={settings.venue_lat}
                lng={settings.venue_lng}
                onChange={(lat, lng) => setSettings({ ...settings, venue_lat: lat, venue_lng: lng })}
              />
            </SettingsCard>

            {/* Security */}
            <SettingsCard icon={Lock} title="Security" description="Account protection settings.">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${is2faEnabled ? 'bg-green-100 text-green-600' : 'bg-stone-200 text-stone-500'}`}>
                    {is2faEnabled ? <ShieldCheck className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-800">Two-Factor Authentication</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {is2faEnabled ? 'Your account is protected with 2FA.' : 'Add an extra layer of security to your account.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handle2faToggle}
                  disabled={verifying2fa}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${is2faEnabled ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[#A67B5B] text-white hover:bg-[#8C6A4D]'}`}
                >
                  {verifying2fa ? <Spinner size="sm" /> : (is2faEnabled ? 'Disable 2FA' : 'Enable 2FA')}
                </button>
              </div>
            </SettingsCard>

            {/* Notifications */}
            <SettingsCard icon={Mail} title="Notifications" description="Email alerts and recipients.">
              <div className="space-y-5">
                <Toggle
                  id="emailNotif"
                  checked={settings.admin_email_notifications}
                  onChange={(checked) => setSettings({ ...settings, admin_email_notifications: checked })}
                  label="Email me when a guest RSVPs"
                />

                {settings.admin_email_notifications && (
                  <div className="ml-8 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">Notification Email Recipient</label>
                    <AdminInput
                      type="email"
                      placeholder="your-email@example.com"
                      value={settings.admin_email}
                      onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </SettingsCard>

            {/* Features */}
            <SettingsCard icon={Music} title="Features" description="Optional guest-facing modules.">
              <Toggle
                id="songLimitToggle"
                checked={settings.song_request_limit_enabled}
                onChange={(checked) => setSettings({ ...settings, song_request_limit_enabled: checked })}
                label="Limit Public Song Requests"
                hint="Guests can submit up to 5 song requests per hour."
              />
            </SettingsCard>

            <div className="flex justify-end gap-4 pt-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={updateSettingsMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary min-w-[140px] flex items-center justify-center gap-2"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Help / Summary */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="p-6 rounded-2xl bg-white shadow-sm border border-stone-100">
            <h3 className="text-lg font-medium text-stone-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-[#A67B5B]" />
              Setting Overview
            </h3>
            <div className="space-y-4">
              {settingSections.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-800">{section.label}</p>
                      <p className="text-xs text-stone-500 leading-relaxed">{section.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#A67B5B]/5 border border-[#A67B5B]/10">
            <p className="text-sm text-[#4A3F35] font-medium mb-1">Need help?</p>
            <p className="text-xs text-[#8B7B6B]">
              Changes are applied immediately after saving. Two-factor authentication cannot be recovered without backup codes.
            </p>
          </div>
        </div>
      </div>

      <AdminModal isOpen={show2faModal && !!twoFactorData} onClose={() => setShow2faModal(false)} title="Setup Two-Factor Authentication" size="md">
        <form onSubmit={handleConfirm2fa} className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-stone-600">
              Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).
            </p>
            <div className="inline-block p-4 bg-white border border-stone-200 rounded-2xl shadow-inner"
              dangerouslySetInnerHTML={{ __html: twoFactorData?.qr_code_svg }}
            />
            <div className="text-xs font-mono bg-stone-100 p-2 rounded select-all">
              {twoFactorData?.secret}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">Verification Code</label>
            <AdminInput
              type="text"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              className="text-center text-2xl tracking-[0.5em] font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={verifying2fa}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {verifying2fa ? <Spinner size="sm" /> : <ShieldCheck className="w-4 h-4" />}
            {verifying2fa ? 'Verifying...' : 'Complete Setup'}
          </button>
        </form>
      </AdminModal>
    </AdminPageLayout>
  );
}

function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <div className="p-6 rounded-2xl bg-white shadow-sm border border-stone-100">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#A67B5B]" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-stone-800">{title}</h2>
          {description && <p className="text-sm text-stone-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ id, checked, onChange, label, hint }) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        className="w-5 h-5 mt-0.5 text-[#A67B5B] rounded focus:ring-[#A67B5B] border-stone-300"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-stone-700 cursor-pointer">{label}</label>
        {hint && <p className="text-xs text-stone-500 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}
