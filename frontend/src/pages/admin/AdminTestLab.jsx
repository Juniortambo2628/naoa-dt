import { useState } from 'react';
import { Mail, QrCode, Send, RefreshCw, CheckCircle, AlertCircle, FlaskConical } from 'lucide-react';
import api from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';

export default function AdminTestLab() {
  const [testEmail, setTestEmail] = useState('');
  const [testCode, setTestCode] = useState('TEST-CODE-123');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
      setLogs(prev => [{ id: Date.now(), message, type }, ...prev]);
  };

  const handleSendTestEmail = async (type) => {
      if (!testEmail) return alert('Please enter an email address');
      
      setLoading(true);
      addLog(`Sending ${type} to ${testEmail}...`, 'info');
      
      try {
          await api.post('/test/email', { email: testEmail, type });
          addLog(`${type} email sent successfully!`, 'success');
      } catch (err) {
          addLog(`Failed to send email: ${err.message}`, 'error');
      }
      setLoading(false);
  };

  const generateRandomCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setTestCode(result);
      addLog(`Generated new code: ${result}`, 'info');
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Test Lab"
        description="Development and testing utilities"
        icon={<FlaskConical className="w-5 h-5 text-[#A67B5B]" />}
        breadcrumb={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Test Lab' },
        ]}
        actions={
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium border border-orange-200">
            Development Mode
          </span>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
          {/* Email Testing */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
                      <Mail className="w-5 h-5 text-[#A67B5B]" />
                  </div>
                  <h2 className="text-lg font-medium text-stone-800">Email System</h2>
              </div>

              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Recipient Address</label>
                      <input 
                        type="email" 
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="w-full p-2 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-[#A67B5B]/20"
                        placeholder="kanye@west.com"
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleSendTestEmail('invitation')}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-lg hover:border-[#A67B5B] hover:bg-white transition-all text-sm font-medium text-stone-700"
                      >
                          <Send className="w-4 h-4" /> Invitation
                      </button>
                      <button 
                         onClick={() => handleSendTestEmail('rsvp_confirmation')}
                         disabled={loading}
                        className="flex items-center justify-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-lg hover:border-[#A67B5B] hover:bg-white transition-all text-sm font-medium text-stone-700"
                      >
                          <CheckCircle className="w-4 h-4" /> Confirmation
                      </button>
                  </div>
              </div>
          </div>

          {/* Code Generation */}
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
                      <QrCode className="w-5 h-5 text-[#A67B5B]" />
                  </div>
                  <h2 className="text-lg font-medium text-stone-800">Code & QR</h2>
              </div>

              <div className="space-y-6">
                  <div className="flex gap-2">
                      <input 
                        value={testCode}
                        onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                        className="flex-1 p-2 border border-stone-200 rounded-lg outline-none font-mono text-center tracking-widest font-bold"
                      />
                      <button 
                        onClick={generateRandomCode}
                        className="p-2 bg-stone-100 rounded-lg hover:bg-stone-200 text-stone-600"
                      >
                          <RefreshCw className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="flex justify-center p-6 bg-white border border-stone-200 rounded-xl" id="qr-canvas-container">
                       {/* Simplified QR Display - in real app use a library, here simulating with an image API or placeholder */}
                       <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${testCode}`} 
                        alt="QR Code" 
                        className="w-32 h-32"
                       />
                  </div>
                  <p className="text-center text-xs text-stone-400">Scan to test deep linking</p>
              </div>
          </div>
      </div>

      {/* Logs */}
      <div className="bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-800 font-mono text-sm h-64 overflow-y-auto">
          <h3 className="text-stone-400 mb-4 text-xs uppercase tracking-widest">System Logs</h3>
          <div className="space-y-2">
              {logs.length === 0 && <span className="text-stone-600 italic">No activity yet...</span>}
              {logs.map(log => (
                  <div key={log.id} className="flex gap-3">
                      <span className="text-stone-600">[{new Date(log.id).toLocaleTimeString()}]</span>
                      <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-stone-300'}`}>
                          {log.message}
                      </span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}
