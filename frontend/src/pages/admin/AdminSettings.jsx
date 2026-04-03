import { useState, useEffect } from 'react';
import { twoFactorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings, useUpdateSettings } from '../../hooks/useApiHooks';
import { Loader2, Save, Shield, ShieldCheck, X, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminPageHero from '../../components/admin/AdminPageHero';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    wedding_date: '',
    rsvp_enabled: false,
    venue_name: '',
    admin_email_notifications: false,
    admin_email: '',
    public_url: '',
    song_request_limit_enabled: true,
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
          wedding_date: settingsData.wedding_date || '',
          rsvp_enabled: String(settingsData.rsvp_enabled) === 'true',
          venue_name: settingsData.venue_name || '',
          admin_email_notifications: String(settingsData.admin_email_notifications) === 'true',
          admin_email: settingsData.admin_email || '',
          public_url: settingsData.public_url || '',
          song_request_limit_enabled: String(settingsData.song_request_limit_enabled) !== 'false',
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
        
        console.log('Saving settings payload:', payload);
        
        await updateSettingsMutation.mutateAsync({ settings: payload });
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
        // Start setup
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
        const res = await twoFactorService.confirm(verificationCode);
        // We can manually checkAuth or use the returned user if we had a setUser in this scope
        // For now, checkAuth is enough but we'll ensure it works by passing the returned user if we had a way.
        // Actually, checkAuth fetches from /user which we just updated.
        await checkAuth();
        setShow2faModal(false);
        setVerificationCode('');
        alert('Two-factor authentication enabled successfully!');
    } catch (e) {
        alert(e.response?.data?.message || 'Invalid verification code');
    }
    setVerifying2fa(false);
  };

  if (isLoading) return <div className="text-center py-8"><Loader2 className="animate-spin w-8 h-8 mx-auto text-[#A67B5B]" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <AdminPageHero
        title="System Settings"
        breadcrumb={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Settings' },
        ]}
        icon={<Settings className="w-5 h-5 text-[#A67B5B]" />}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="p-6 rounded-2xl bg-white shadow-sm border border-stone-100 space-y-6">
          <h2 className="text-lg font-medium text-stone-800 border-b pb-2">General</h2>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Wedding Date</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none"
                value={settings.wedding_date}
                onChange={(e) => setSettings({...settings, wedding_date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Venue Name</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none"
                value={settings.venue_name}
                onChange={(e) => setSettings({...settings, venue_name: e.target.value})}
              />
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="rsvpToggle"
                className="w-5 h-5 text-[#A67B5B] rounded focus:ring-[#A67B5B]"
                checked={settings.rsvp_enabled}
                onChange={(e) => setSettings({...settings, rsvp_enabled: e.target.checked})}
              />
              <label htmlFor="rsvpToggle" className="text-sm font-medium text-stone-700">Enable Public RSVP Form</label>
            </div>

            <div className="pt-4 border-t border-stone-50">
              <label className="block text-sm font-medium text-stone-700 mb-1">Public App URL</label>
              <input 
                type="url" 
                placeholder="https://dntwed.okjtech.co.ke"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none"
                value={settings.public_url}
                onChange={(e) => setSettings({...settings, public_url: e.target.value})}
              />
              <p className="mt-1 text-[10px] text-stone-400 italic">Used for creating absolute links in generated PDFs (e.g. Save the Date links).</p>
            </div>
          </div>
        </div>

        {/* Security / 2FA */}
        <div className="p-6 rounded-2xl bg-white shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-medium text-stone-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-stone-400" />
                Security
            </h2>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-100">
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${is2faEnabled ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[#A67B5B] text-white hover:bg-[#8C6A4D]'}`}
              >
                  {verifying2fa ? <Loader2 className="w-4 h-4 animate-spin" /> : (is2faEnabled ? 'Disable 2FA' : 'Enable 2FA')}
              </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 rounded-2xl bg-white shadow-sm border border-stone-100 space-y-6">
          <h2 className="text-lg font-medium text-stone-800 border-b pb-2">Notifications</h2>
          
          <div className="flex items-center gap-3">
             <input 
                type="checkbox" 
                id="emailNotif"
                className="w-5 h-5 text-[#A67B5B] rounded focus:ring-[#A67B5B]"
                checked={settings.admin_email_notifications}
                onChange={(e) => setSettings({...settings, admin_email_notifications: e.target.checked})}
              />
              <label htmlFor="emailNotif" className="text-sm font-medium text-stone-700">Email me when a guest RSVPs</label>
          </div>

          {settings.admin_email_notifications && (
              <div className="ml-8 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">Notification Email Recipient</label>
                  <input 
                    type="email" 
                    placeholder="your-email@example.com"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none text-sm"
                    value={settings.admin_email}
                    onChange={(e) => setSettings({...settings, admin_email: e.target.value})}
                  />
                  <p className="text-[10px] text-stone-400 italic">This is the email address that will receive RSVP alerts.</p>
              </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-stone-50">
             <input 
                type="checkbox" 
                id="songLimitToggle"
                className="w-5 h-5 text-[#A67B5B] rounded focus:ring-[#A67B5B]"
                checked={settings.song_request_limit_enabled}
                onChange={(e) => setSettings({...settings, song_request_limit_enabled: e.target.checked})}
              />
              <label htmlFor="songLimitToggle" className="text-sm font-medium text-stone-700">
                Limit Public Song Requests (5 per hour)
              </label>
          </div>
        </div>


        <div className="flex justify-end gap-4">
            <button 
                type="button"
                className="btn-secondary"
                disabled={updateSettingsMutation.isPending}
            >
                Cancel
            </button>
            <button 
                type="submit"
                className="btn-primary min-w-[120px] flex items-center justify-center gap-2"
                disabled={updateSettingsMutation.isPending}
            >
                {updateSettingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </form>

      {/* Setup Modal */}
      {show2faModal && twoFactorData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                      <h3 className="text-lg font-semibold text-[#A67B5B]">Setup Two-Factor Authentication</h3>
                      <button onClick={() => setShow2faModal(false)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleConfirm2fa} className="p-6 space-y-6">
                      <div className="text-center space-y-4">
                          <p className="text-sm text-stone-600">
                              Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).
                          </p>
                          <div className="inline-block p-4 bg-white border border-stone-200 rounded-2xl shadow-inner" 
                               dangerouslySetInnerHTML={{ __html: twoFactorData.qr_code_svg }} 
                          />
                          <div className="text-xs font-mono bg-stone-100 p-2 rounded select-all">
                              {twoFactorData.secret}
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">Verification Code</label>
                          <input 
                              type="text"
                              className="w-full p-3 border rounded-xl text-center text-2xl tracking-[0.5em] font-medium focus:ring-2 focus:ring-[#A67B5B]/20 outline-none"
                              placeholder="000000"
                              maxLength={6}
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              required
                          />
                      </div>

                      <button 
                          type="submit"
                          disabled={verifying2fa}
                          className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                          {verifying2fa ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                          {verifying2fa ? 'Verifying...' : 'Complete Setup'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
