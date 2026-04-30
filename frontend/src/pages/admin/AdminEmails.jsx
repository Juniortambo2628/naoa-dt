import { useState, useEffect } from 'react';
import { Mail, Send, Loader2, CheckCircle, Clock, X, Save } from 'lucide-react';
import { invitationService, settingService } from '../../services/api';
import InvitationCanvas from '../../components/admin/InvitationCanvas';
import AdminPageHero from '../../components/admin/AdminPageHero';

const mockGuest = {
    name: "John Doe",
    unique_code: "WED-8723",
    table: { name: "Table 5" }
};

export default function AdminEmails() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('compose'); // compose, templates, history
  const [showPreview, setShowPreview] = useState(false);
  const [design, setDesign] = useState(null);
  const [invitationDesign, setInvitationDesign] = useState(null);
  const [saveTheDateDesign, setSaveTheDateDesign] = useState(null);
  const [previewType, setPreviewType] = useState('invitation'); // invitation or save_the_date
  const [emailSettings, setEmailSettings] = useState({
    email_invitation_subject: '',
    email_invitation_message: '',
    email_rsvp_subject: '',
    email_rsvp_attending_message: '',
    email_rsvp_declined_message: '',
    email_gift_subject: '',
    email_gift_message: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const handleBulkSend = async () => {
    if (!window.confirm('Send digital invitations to all guests with pending RSVPs and valid email addresses?')) return;
    setLoading(true);
    try {
        // Fetch current guest list to find pending ones
        const guestsRes = await guestService.getAll();
        const allGuests = guestsRes.data.data || guestsRes.data;
        
        // Filter: Pending RSVP AND has Email AND is NOT a plus-one (we send to primary guests, send method handles their plus-ones)
        const pendingGuests = allGuests.filter(g => 
            g.rsvp_status === 'pending' && 
            g.email && 
            !g.parent_guest_id
        );

        if (pendingGuests.length === 0) {
            alert('No pending primary guests with email addresses found.');
            setLoading(false);
            return;
        }

        if (!window.confirm(`Found ${pendingGuests.length} primary guests to invite. Proceed?`)) {
            setLoading(false);
            return;
        }

        const guestIds = pendingGuests.map(g => g.id);
        const res = await invitationService.sendBulk(guestIds);
        
        alert(`Successfully queued ${res.data.sent_count} invitations! ${res.data.error_count > 0 ? res.data.error_count + ' failed.' : ''}`);
    } catch(e) {
        console.error("Bulk send failed", e);
        alert('Failed to send bulk invitations: ' + (e.response?.data?.message || e.message));
    }
    setLoading(false);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
        await settingService.update(emailSettings);
        alert('Email templates saved successfully!');
    } catch (e) {
        alert('Failed to save email templates');
    }
    setSavingSettings(false);
  };

  useEffect(() => {
    const loadData = async () => {
        try {
            const res = await settingService.getAll();
            
            // Load Invitation Design
            if (res.data.invitation_theme) {
                let loaded = res.data.invitation_theme;
                if (typeof loaded === 'string') loaded = JSON.parse(loaded);
                if (loaded.title && typeof loaded.title === 'string') {
                     loaded.content = { en: { title: loaded.title, message: loaded.message } };
                }
                setInvitationDesign(loaded);
                setDesign(loaded); // Default active design
            }

            // Load Save the Date Design
            if (res.data.save_the_date_theme) {
                let loaded = res.data.save_the_date_theme;
                if (typeof loaded === 'string') loaded = JSON.parse(loaded);
                if (loaded.title && typeof loaded.title === 'string') {
                     loaded.content = { en: { title: loaded.title, message: loaded.message } };
                }
                setSaveTheDateDesign(loaded);
            }

            // Load Email Settings
            setEmailSettings({
                email_invitation_subject: res.data.email_invitation_subject || '',
                email_invitation_message: res.data.email_invitation_message || '',
                email_rsvp_subject: res.data.email_rsvp_subject || '',
                email_rsvp_attending_message: res.data.email_rsvp_attending_message || '',
                email_rsvp_declined_message: res.data.email_rsvp_declined_message || '',
                email_gift_subject: res.data.email_gift_subject || '',
                email_gift_message: res.data.email_gift_message || '',
            });
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };
    loadData();
  }, []);

  const mockGuest = {
      name: "John Doe",
      unique_code: "WED-8723",
      table: { name: "Table 5" }
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Email Management"
        description="Configure email templates and send digital invitations"
        breadcrumb={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Emails' },
        ]}
        icon={<Mail className="w-5 h-5 text-[#A67B5B]" />}
      />

      <div className="flex gap-4 border-b border-stone-100">
            <button 
                onClick={() => setActiveTab('compose')}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'compose' ? 'text-[#A67B5B]' : 'text-stone-400 hover:text-stone-600'}`}
            >
                Compose & Send
                {activeTab === 'compose' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A67B5B]" />}
            </button>
            <button 
                onClick={() => setActiveTab('templates')}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'templates' ? 'text-[#A67B5B]' : 'text-stone-400 hover:text-stone-600'}`}
            >
                Email Templates
                {activeTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A67B5B]" />}
            </button>
      </div>

      {activeTab === 'compose' ? (
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* ... existing compose UI ... */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <h2 className="text-lg font-medium mb-4 text-[#4A3F35]">Send Invitations</h2>
              
              <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 cursor-pointer hover:border-[#A67B5B] transition-colors">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="font-medium text-stone-800">Digital RSVP Invitation</h3>
                              <p className="text-sm text-stone-500 mt-1">Includes unique RSVP link and QR code.</p>
                          </div>
                          <Mail className="w-5 h-5 text-[#A67B5B]" />
                      </div>
                        <div className="mt-4 flex gap-2">
                           <button 
                               onClick={() => {
                                   setPreviewType('invitation');
                                   setDesign(invitationDesign);
                                   setShowPreview(true);
                               }}
                               className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-stone-200 hover:bg-stone-50"
                           >
                               Preview
                           </button>
                       </div>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 cursor-pointer hover:border-[#A67B5B] transition-colors">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="font-medium text-stone-800">Save The Date</h3>
                              <p className="text-sm text-stone-500 mt-1">Simple announcement with date and location.</p>
                          </div>
                          <Clock className="w-5 h-5 text-[#A67B5B]" />
                      </div>
                        <div className="mt-4 flex gap-2">
                           <button 
                               onClick={() => {
                                   setPreviewType('save_the_date');
                                   setDesign(saveTheDateDesign);
                                   setShowPreview(true);
                               }}
                               className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-stone-200 hover:bg-stone-50"
                           >
                               Preview
                           </button>
                       </div>
                  </div>
              </div>

               <div className="mt-6 pt-6 border-t border-stone-100">
                  <button 
                      onClick={handleBulkSend}
                      disabled={loading}
                      className="btn-primary w-full flex justify-center items-center gap-2"
                  >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      Send to All Pending Guests
                  </button>
                  <p className="text-center text-xs text-stone-400 mt-2">Will send via email to guests who haven't received an invite yet.</p>
              </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 h-fit">
              <h2 className="text-lg font-medium mb-4 text-[#4A3F35]">Email Status</h2>
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <span className="text-stone-600">Sent</span>
                      <span className="font-bold text-green-600">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-stone-600">Opened</span>
                      <span className="font-bold text-blue-600">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-stone-600">Bounced</span>
                      <span className="font-bold text-red-500">0</span>
                  </div>
                  <div className="pt-4 border-t border-stone-100">
                      <h3 className="text-sm font-medium text-stone-800 mb-2">Recent Logs</h3>
                      <div className="text-xs text-stone-400 italic">No emails sent yet.</div>
                  </div>
              </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Invitation Template */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <h2 className="text-lg font-medium mb-6 text-[#4A3F35] flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Invitation Email
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Subject Line</label>
                        <input 
                            type="text" 
                            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#A67B5B]/10 outline-none"
                            value={emailSettings.email_invitation_subject}
                            onChange={(e) => setEmailSettings({...emailSettings, email_invitation_subject: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Message Body</label>
                        <textarea 
                            rows={4}
                            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#A67B5B]/10 outline-none"
                            value={emailSettings.email_invitation_message}
                            onChange={(e) => setEmailSettings({...emailSettings, email_invitation_message: e.target.value})}
                        />
                         <p className="text-[10px] text-stone-400 italic mt-1">Variables: (The template automatically includes "Dear [Guest Name]" at the top)</p>
                    </div>
                </div>
            </div>

            {/* RSVP Confirmation Templates */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <h2 className="text-lg font-medium mb-6 text-[#4A3F35] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    RSVP Confirmation
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Subject Line</label>
                        <input 
                            type="text" 
                            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#A67B5B]/10 outline-none"
                            value={emailSettings.email_rsvp_subject}
                            onChange={(e) => setEmailSettings({...emailSettings, email_rsvp_subject: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">When Attending</label>
                            <textarea 
                                rows={4}
                                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#A67B5B]/10 outline-none"
                                value={emailSettings.email_rsvp_attending_message}
                                onChange={(e) => setEmailSettings({...emailSettings, email_rsvp_attending_message: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">When Declined</label>
                            <textarea 
                                rows={4}
                                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#A67B5B]/10 outline-none"
                                value={emailSettings.email_rsvp_declined_message}
                                onChange={(e) => setEmailSettings({...emailSettings, email_rsvp_declined_message: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </div>

             {/* Gift Registry Thank You */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <h2 className="text-lg font-medium mb-6 text-[#4A3F35] flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Gift Thank You
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Subject Line</label>
                        <input 
                            type="text" 
                            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#A67B5B]/10 outline-none"
                            value={emailSettings.email_gift_subject}
                            onChange={(e) => setEmailSettings({...emailSettings, email_gift_subject: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Message Body</label>
                        <textarea 
                            rows={4}
                            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#A67B5B]/10 outline-none"
                            value={emailSettings.email_gift_message}
                            onChange={(e) => setEmailSettings({...emailSettings, email_gift_message: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 sticky bottom-6 bg-white/80 backdrop-blur p-2 rounded-2xl border border-stone-100 shadow-xl">
                <button 
                    type="submit"
                    disabled={savingSettings}
                    className="btn-primary min-w-[200px] flex justify-center items-center gap-2"
                >
                    {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-4" />}
                    {savingSettings ? 'Saving...' : 'Save Email Templates'}
                </button>
            </div>
        </form>
      )}

      {/* Preview Modal */}
      {showPreview && design && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
               <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                   <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                       <h3 className="font-semibold text-lg">{previewType === 'invitation' ? 'Digital Invitation' : 'Save the Date'} Preview</h3>
                      <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-stone-200 rounded-full">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-auto bg-stone-800/50 p-8 flex items-center justify-center">
                      <div className="bg-white p-2 rounded shadow-xl scale-90 origin-center">
                        <InvitationCanvas 
                            design={design} 
                            mode="preview" 
                            guest={mockGuest}
                        />
                      </div>
                  </div>
                  <div className="p-4 border-t border-stone-100 bg-white">
                      <p className="text-sm text-stone-500 text-center">
                          Previewing with sample data for: <strong>John Doe</strong>
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
