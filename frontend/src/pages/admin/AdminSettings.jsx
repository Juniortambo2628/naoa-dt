import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { twoFactorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings, useUpdateSettings } from '../../hooks/useApiHooks';
import { Save, RotateCcw, Shield, ShieldCheck, Settings, Info, Mail, Music, Globe, Lock, MapPin, Heart, MessageCircle, LayoutTemplate, Users, Megaphone, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUnsavedChanges } from '../../hooks/useUnsavedChangesGuard';
import UnsavedChangesStatus from '../../components/admin/UnsavedChangesStatus';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminModal from '../../components/admin/AdminModal';
import EditableFieldset from '../../components/admin/EditableFieldset';
import useAdminAction from '../../hooks/useAdminAction';

import { AdminInput } from '../../components/admin/AdminInput';
import Spinner from '../../components/admin/Spinner';
import Button from '../../components/Button';
import LocationPicker from '../../components/LocationPicker';
import { INVITATION_SECTIONS, resolveInvitationSections } from '../../utils/invitationSections';
import { DEFAULT_GUEST_NOTICES, resolveGuestNotices } from '../../utils/guestNotices';
import { DEFAULT_WHATSAPP_TEMPLATE, WHATSAPP_PLACEHOLDERS, renderWhatsAppMessage } from '../../utils/whatsappMessage';
import { confirmAction, notifyError, notifySuccess } from '../../utils/feedback';

// Each section owns these settings keys (for the "unsaved changes" dots).
const settingSections = [
  {
    id: 'wedding',
    label: 'Wedding Details',
    icon: Heart,
    description: 'Couple names and date — the single source of truth.',
    keys: ['bride_name', 'groom_name', 'wedding_date'],
  },
  {
    id: 'general',
    label: 'General',
    icon: Globe,
    description: 'Control public-facing features and primary URL.',
    keys: ['rsvp_enabled', 'public_url'],
  },
  {
    id: 'guests',
    label: 'Guests',
    icon: Users,
    description: 'Cap how many guests can be added to the guest list.',
    keys: ['guest_limit'],
  },
  {
    id: 'venue',
    label: 'Venue Location',
    icon: MapPin,
    description: 'Venue name, address and map pin for invitations.',
    keys: ['venue_name', 'venue_address', 'venue_lat', 'venue_lng'],
  },
  {
    id: 'security',
    label: 'Security',
    icon: Lock,
    description: 'Protect your account with two-factor authentication.',
    keys: [],
  },
  {
    id: 'invitation-page',
    label: 'Guest Invitation Page',
    icon: LayoutTemplate,
    description: 'Choose which parts of the guest invitation page are shown.',
    keys: ['invitation_sections'],
  },
  {
    id: 'guest-notices',
    label: 'Guest Notices',
    icon: Megaphone,
    description: 'Informational notes shown on the homepage hero and guest invitation.',
    keys: ['guest_notices'],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Message',
    icon: MessageCircle,
    description: 'The message pre-filled when sending invitations on WhatsApp.',
    keys: ['whatsapp_message_template'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Mail,
    description: 'Choose when and where you receive alerts.',
    keys: ['admin_email_notifications', 'admin_email'],
  },
  {
    id: 'features',
    label: 'Features',
    icon: Music,
    description: 'Toggle optional functionality like song request limits.',
    keys: ['song_request_limit_enabled'],
  },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    rsvp_enabled: false,
    admin_email_notifications: false,
    admin_email: '',
    public_url: '',
    song_request_limit_enabled: true,
    guest_limit: '',
    wedding_date: '',
    bride_name: '',
    groom_name: '',
    venue_name: '',
    venue_address: '',
    venue_lat: '',
    venue_lng: '',
    whatsapp_message_template: DEFAULT_WHATSAPP_TEMPLATE,
    invitation_sections: resolveInvitationSections(),
    guest_notices: DEFAULT_GUEST_NOTICES.map(n => ({ ...n })),
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


  // Last saved values, to know when there are unsaved edits.
  const { dirty, markSaved, baseline } = useUnsavedChanges(settings);

  // One section at a time; the side panel switches between them (?section= deep-links).
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = settingSections.find(s => s.id === searchParams.get('section')) || settingSections[0];
  const showSection = (id) => setSearchParams((params) => {
    const next = new URLSearchParams(params);
    next.set('section', id);
    return next;
  }, { replace: true });
  const sectionDirty = (section) => !!baseline
    && section.keys.some(key => JSON.stringify(settings[key]) !== JSON.stringify(baseline[key]));

  const loadSettings = () => {
    if (settingsData) {
        const loaded = {
          rsvp_enabled: String(settingsData.rsvp_enabled) === 'true',
          admin_email_notifications: String(settingsData.admin_email_notifications) === 'true',
          admin_email: settingsData.admin_email || '',
          public_url: settingsData.public_url || '',
          song_request_limit_enabled: String(settingsData.song_request_limit_enabled) !== 'false',
          guest_limit: settingsData.guest_limit ? String(settingsData.guest_limit) : '',
          wedding_date: (settingsData.wedding_date || '').split('T')[0],
          bride_name: settingsData.bride_name || '',
          groom_name: settingsData.groom_name || '',
          venue_name: settingsData.venue_name || '',
          venue_address: settingsData.venue_address || '',
          venue_lat: settingsData.venue_lat || '',
          venue_lng: settingsData.venue_lng || '',
          whatsapp_message_template: settingsData.whatsapp_message_template || DEFAULT_WHATSAPP_TEMPLATE,
          invitation_sections: resolveInvitationSections(settingsData.invitation_sections),
          guest_notices: resolveGuestNotices(settingsData.guest_notices),
        };
        setSettings(loaded);
        markSaved(loaded);
    }
  };

  useEffect(loadSettings, [settingsData, markSaved]);

  const handleDiscard = () => {
    loadSettings();
    toast('Unsaved changes discarded');
  };

  const updateNotice = (index, patch) =>
    setSettings(s => ({ ...s, guest_notices: s.guest_notices.map((n, i) => (i === index ? { ...n, ...patch } : n)) }));
  const addNotice = () =>
    setSettings(s => ({
      ...s,
      guest_notices: [...s.guest_notices, { id: `custom_${Date.now().toString(36)}`, icon: 'info', enabled: true, text: '' }],
    }));
  const removeNotice = (index) =>
    setSettings(s => ({ ...s, guest_notices: s.guest_notices.filter((_, i) => i !== index) }));
  const resetNotices = () =>
    setSettings(s => ({ ...s, guest_notices: DEFAULT_GUEST_NOTICES.map(n => ({ ...n })) }));

  const saveSettings = useAdminAction(() => updateSettingsMutation.mutateAsync({
    ...settings,
    rsvp_enabled: String(settings.rsvp_enabled),
    admin_email_notifications: String(settings.admin_email_notifications),
    song_request_limit_enabled: String(settings.song_request_limit_enabled),
  }), {
    key: () => 'save',
    success: 'System settings saved successfully',
    error: 'Failed to save settings',
    onSuccess: () => markSaved(settings),
  });
  const handleSave = (e) => {
    e.preventDefault();
    saveSettings.run();
  };

  const handle2faToggle = async () => {
    if (is2faEnabled) {
        if (await confirmAction('Are you sure you want to disable Two-Factor Authentication?')) {
            try {
                await twoFactorService.disable();
                await checkAuth();
                notifySuccess('2FA disabled');
            } catch {
                notifyError('Failed to disable 2FA');
            }
        }
    } else {
        setVerifying2fa(true);
        try {
            const res = await twoFactorService.setup();
            setTwoFactorData(res.data);
            setShow2faModal(true);
        } catch {
            notifyError('Failed to initiate 2FA setup');
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
        notifySuccess('Two-factor authentication enabled successfully!');
    } catch (e) {
        notifyError(e.response?.data?.message || 'Invalid verification code');
    }
    setVerifying2fa(false);
  };

  if (isLoading) return <div className="text-center py-8"><Spinner size="lg" /></div>;

  return (
    <>
    <UnsavedChangesStatus dirty={dirty} />
    <AdminPageLayout
      actions={[
        {
          // The toolbar is the one place to save.
          id: 'save-settings',
          label: saveSettings.pending ? 'Saving...' : 'Save Changes',
          icon: Save,
          variant: 'secondary',
          action: saveSettings,
          disabled: !dirty,
        },
        {
          id: 'discard-settings',
          label: 'Discard Changes',
          icon: RotateCcw,
          onClick: handleDiscard,
          disabled: saveSettings.pending || !dirty,
        },
      ]}
      panel={{
        title: 'Setting Overview',
        icon: Info,
        subtitle: dirty ? 'Sections with unsaved edits are marked — saving saves them all.' : undefined,
        items: settingSections.map(section => ({ ...section, dot: sectionDirty(section) })),
        activeId: activeSection.id,
        onChange: showSection,
        footer: (
          <>
            <p className="text-sm text-[#4A3F35] font-medium mb-1">Need help?</p>
            <p className="text-xs text-[#8B7B6B]">
              Changes are applied immediately after saving. Two-factor authentication cannot be recovered without backup codes.
            </p>
          </>
        ),
      }}
      hero={
        <AdminPageHero
          title="System Settings"
          description="Manage system preferences, security, and RSVP visibility."
          breadcrumb="Settings"
          icon={<Settings className="w-5 h-5 text-[#A67B5B]" />}
        />
      }
    >
          <form onSubmit={handleSave} className="space-y-4">
          {/* Viewers: read-only, except their own account security */}
          <EditableFieldset allow={activeSection.id === 'security'} className="block space-y-4">
            {/* Wedding Details — single source of truth for date, names & venue */}
            {activeSection.id === 'wedding' && (
            <SettingsCard icon={Heart} title="Wedding Details" description="The couple, date and venue — used across the site, invitations and emails.">
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <AdminInput
                    label="Bride's Name"
                    type="text"
                    placeholder="e.g. Dinah"
                    value={settings.bride_name}
                    onChange={(e) => setSettings({ ...settings, bride_name: e.target.value })}
                  />
                  <AdminInput
                    label="Groom's Name"
                    type="text"
                    placeholder="e.g. Tze Ren"
                    value={settings.groom_name}
                    onChange={(e) => setSettings({ ...settings, groom_name: e.target.value })}
                  />
                </div>
                <div>
                  <AdminInput
                    label="Wedding Date"
                    type="date"
                    value={settings.wedding_date}
                    onChange={(e) => setSettings({ ...settings, wedding_date: e.target.value })}
                  />
                  <p className="mt-1.5 text-xs text-stone-400">Shown everywhere, formatted automatically for each language.</p>
                </div>
              </div>
            </SettingsCard>
            )}

            {/* General */}
            {activeSection.id === 'general' && (
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
            )}

            {/* Guests */}
            {activeSection.id === 'guests' && (
            <SettingsCard icon={Users} title="Guests" description="Limit the size of the guest list.">
              <AdminInput
                label="Guest Limit"
                type="number"
                min="0"
                step="1"
                placeholder="No limit"
                value={settings.guest_limit}
                onChange={(e) => setSettings({ ...settings, guest_limit: e.target.value })}
              />
              <p className="mt-1.5 text-xs text-stone-400">
                The most guests the list can hold — plus-ones count as guests. Once it's reached, no more guests can be added, imported or restored. Leave empty (or 0) for no limit.
              </p>
            </SettingsCard>
            )}

            {/* Venue Location */}
            {activeSection.id === 'venue' && (
            <SettingsCard icon={MapPin} title="Venue Location" description="Venue name, address and map coordinates for invitations.">
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <AdminInput
                    label="Venue Name"
                    type="text"
                    placeholder="e.g. Rosewood Manor"
                    value={settings.venue_name}
                    onChange={(e) => setSettings({ ...settings, venue_name: e.target.value })}
                  />
                  <AdminInput
                    label="Venue Address"
                    type="text"
                    placeholder="e.g. Karen, Nairobi"
                    value={settings.venue_address}
                    onChange={(e) => setSettings({ ...settings, venue_address: e.target.value })}
                  />
                </div>
                <div className="pt-4 border-t border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-2">Map Coordinates</label>
                  <LocationPicker
                    lat={settings.venue_lat}
                    lng={settings.venue_lng}
                    onChange={(lat, lng) => setSettings({ ...settings, venue_lat: lat, venue_lng: lng })}
                  />
                </div>
              </div>
            </SettingsCard>
            )}

            {/* Security */}
            {activeSection.id === 'security' && (
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

                <Button
                  variant={is2faEnabled ? 'danger' : 'secondary'}
                  onClick={handle2faToggle}
                  loading={verifying2fa}
                >
                  {is2faEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
              </div>
            </SettingsCard>
            )}

            {/* Notifications */}
            {activeSection.id === 'notifications' && (
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
            )}

            {/* Guest invitation page sections */}
            {activeSection.id === 'invitation-page' && (
            <SettingsCard icon={LayoutTemplate} title="Guest Invitation Page" description="Turn parts of the guest invitation on or off. The page layout adjusts to what's shown.">
              <div className="flex gap-3 mb-4 text-xs">
                <button type="button" className="text-[#A67B5B] hover:underline" onClick={() => setSettings(s => ({ ...s, invitation_sections: Object.fromEntries(INVITATION_SECTIONS.map(x => [x.id, true])) }))}>Show all</button>
                <button type="button" className="text-stone-500 hover:underline" onClick={() => setSettings(s => ({ ...s, invitation_sections: Object.fromEntries(INVITATION_SECTIONS.map(x => [x.id, false])) }))}>Hide all</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INVITATION_SECTIONS.map(section => (
                  <Toggle
                    key={section.id}
                    id={`inv-section-${section.id}`}
                    checked={settings.invitation_sections[section.id]}
                    onChange={(checked) => setSettings(s => ({ ...s, invitation_sections: { ...s.invitation_sections, [section.id]: checked } }))}
                    label={section.label}
                    hint={section.hint}
                  />
                ))}
              </div>
            </SettingsCard>
            )}

            {/* Guest notices */}
            {activeSection.id === 'guest-notices' && (
            <SettingsCard icon={Megaphone} title="Guest Notices" description="Short notes guests see on the homepage hero and their invitation page — switch them on or off and edit the wording.">
              <div className="space-y-3">
                {settings.guest_notices.map((notice, index) => {
                  const isDefault = DEFAULT_GUEST_NOTICES.some(d => d.id === notice.id);
                  return (
                    <div key={notice.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <input
                        type="checkbox"
                        id={`guest-notice-${notice.id}`}
                        checked={notice.enabled !== false}
                        onChange={(e) => updateNotice(index, { enabled: e.target.checked })}
                        className="w-5 h-5 flex-shrink-0 text-[#A67B5B] rounded focus:ring-[#A67B5B] border-stone-300"
                        aria-label={`Show "${notice.text || 'notice'}"`}
                      />
                      <div className="flex-1 min-w-0">
                        <AdminInput
                          type="text"
                          placeholder="e.g. Black tie optional"
                          value={notice.text || ''}
                          onChange={(e) => updateNotice(index, { text: e.target.value })}
                          aria-label={isDefault ? 'Notice text' : 'Custom notice text'}
                        />
                      </div>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => removeNotice(index)}
                          className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                          aria-label="Remove notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={addNotice}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#A67B5B] hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    Add notice
                  </button>
                  <button
                    type="button"
                    onClick={resetNotices}
                    className="text-xs text-stone-500 hover:underline"
                  >
                    Reset to defaults
                  </button>
                </div>
                <p className="text-xs text-stone-400">
                  Shown as small pills above a “Good to know” toggle. Disabling every notice hides the widget entirely.
                </p>
              </div>
            </SettingsCard>
            )}

            {/* WhatsApp message */}
            {activeSection.id === 'whatsapp' && (
            <SettingsCard icon={MessageCircle} title="WhatsApp Message" description="Pre-filled text for WhatsApp invitations. Each guest gets their own name and links.">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {WHATSAPP_PLACEHOLDERS.map(p => (
                    <button
                      key={p.key}
                      type="button"
                      title={p.label}
                      onClick={() => setSettings(s => ({ ...s, whatsapp_message_template: `${s.whatsapp_message_template}${p.key}` }))}
                      className="px-2 py-1 rounded-md bg-stone-100 hover:bg-[#A67B5B]/10 text-[11px] font-mono text-stone-700"
                    >
                      {p.key}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={10}
                  value={settings.whatsapp_message_template}
                  onChange={(e) => setSettings({ ...settings, whatsapp_message_template: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30"
                  aria-label="WhatsApp message template"
                />
                <p className="text-xs text-stone-500">
                  Tap a placeholder to add it. Use *text* for bold. Lines with {'{pdf_link}'} are left out when the PDF is attached by hand.
                </p>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Preview</p>
                  <div className="whitespace-pre-wrap text-sm bg-[#DCF8C6] text-stone-800 rounded-xl p-3 break-words">
                    {renderWhatsAppMessage(settings.whatsapp_message_template, {
                      name: 'Jane Doe',
                      code: 'ABC123',
                      invite_link: `${window.location.origin}/invitation/ABC123`,
                      pdf_link: `${window.location.origin}/storage/invitations/jane-doe.pdf`,
                      couple: `${settings.bride_name || 'Bride'} & ${settings.groom_name || 'Groom'}`,
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, whatsapp_message_template: DEFAULT_WHATSAPP_TEMPLATE })}
                  className="text-xs text-[#A67B5B] hover:underline"
                >
                  Reset to default message
                </button>
              </div>
            </SettingsCard>
            )}

            {/* Features */}
            {activeSection.id === 'features' && (
            <SettingsCard icon={Music} title="Features" description="Optional guest-facing modules.">
              <Toggle
                id="songLimitToggle"
                checked={settings.song_request_limit_enabled}
                onChange={(checked) => setSettings({ ...settings, song_request_limit_enabled: checked })}
                label="Limit Public Song Requests"
                hint="Guests can submit up to 5 song requests per hour."
              />
            </SettingsCard>
            )}

          </EditableFieldset>
          </form>

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

          <Button
            type="submit"
            variant="secondary"
            icon={ShieldCheck}
            fullWidth
            loading={verifying2fa}
          >
            {verifying2fa ? 'Verifying...' : 'Complete Setup'}
          </Button>
        </form>
      </AdminModal>
    </AdminPageLayout>
    </>
  );
}

function SettingsCard({ icon, title, description, children }) {
  const Icon = icon;
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white shadow-sm border border-stone-100">
      <div className="flex items-start gap-3 mb-4">
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
