import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mail, QrCode, Send, RefreshCw, CheckCircle, FlaskConical, 
  Radio, Camera, Wifi, Database, HardDrive, Server, Bell,
  AlertTriangle, Check, X, Activity, Zap, BarChart3
} from 'lucide-react';
import api, { guestService, testLabService } from '../../services/api';
import AdminCard from '../../components/admin/AdminCard';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { AdminInput } from '../../components/admin/AdminInput';

const STATUS_COLORS = {
  ok: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  loading: { bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-500', dot: 'bg-stone-400' },
};

const STATUS_ICONS = { ok: Check, warning: AlertTriangle, error: X, loading: RefreshCw };

function StatusBadge({ status, label }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.loading;
  const Icon = STATUS_ICONS[status] || RefreshCw;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} ${colors.border} border`}>
      <Icon className={`w-4 h-4 ${colors.text} ${status === 'loading' ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${colors.text}`}>{label}</span>
    </div>
  );
}

export default function AdminTestLab() {
  const [testEmail, setTestEmail] = useState('');
  const [testCode, setTestCode] = useState('TEST-CODE-123');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Simulation states
  const [liveMsg, setLiveMsg] = useState('');
  const [liveType, setLiveType] = useState('info');
  const [polaroidCaption, setPolaroidCaption] = useState('');
  const [polaroidLocation, setPolaroidLocation] = useState('');

  // API Health states
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [entityCounts, setEntityCounts] = useState(null);
  const fetchedHealthRef = useRef(false);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [{ id: Date.now(), message, type }, ...prev].slice(0, 50));
  };

  // --- API Health Check ---
  const runHealthCheck = useCallback(async () => {
    setHealthLoading(true);
    addLog('Running API health check...', 'info');
    try {
      const res = await testLabService.healthCheck();
      setHealth(res.data);
      const failed = Object.entries(res.data.checks).filter(([, v]) => v.status === 'error');
      if (failed.length === 0) {
        addLog('All services healthy', 'success');
      } else {
        failed.forEach(([name, check]) => addLog(`${name}: ${check.message}`, 'error'));
      }
    } catch (err) {
      addLog(`Health check failed: ${err.message}`, 'error');
    }
    setHealthLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!fetchedHealthRef.current) {
        fetchedHealthRef.current = true;
        try {
          const res = await testLabService.healthCheck();
          if (cancelled) return;
          setHealth(res.data);
          const failed = Object.entries(res.data.checks).filter(([, v]) => v.status === 'error');
          if (failed.length === 0) {
            addLog('All services healthy', 'success');
          } else {
            failed.forEach(([name, check]) => addLog(`${name}: ${check.message}`, 'error'));
          }
        } catch (err) {
          addLog(`Health check failed: ${err.message}`, 'error');
        }
        try {
          const res = await testLabService.getStats();
          if (!cancelled) setEntityCounts(res.data);
        } catch { /* silent */ }
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // --- Simulate Live Update ---
  const handleSimulateLiveUpdate = async () => {
    if (!liveMsg.trim()) return alert('Enter a message');
    setLoading(true);
    addLog(`Posting live update: "${liveMsg}"`, 'info');
    try {
      await testLabService.simulateLiveUpdate({ message: liveMsg, type: liveType });
      addLog('Live update posted! Check Programme page.', 'success');
      setLiveMsg('');
    } catch (err) {
      addLog(`Failed: ${err.response?.data?.message || err.message}`, 'error');
    }
    setLoading(false);
  };

  // --- Simulate Polaroid ---
  const handleSimulatePolaroid = async () => {
    setLoading(true);
    addLog('Simulating polaroid image...', 'info');
    try {
      await testLabService.simulatePolaroid({
        caption: polaroidCaption || 'Test polaroid from admin',
        location: polaroidLocation || 'Test Lab',
      });
      addLog('Polaroid simulated! Check Digital Invitation page.', 'success');
      setPolaroidCaption('');
      setPolaroidLocation('');
    } catch (err) {
      addLog(`Failed: ${err.response?.data?.message || err.message}`, 'error');
    }
    setLoading(false);
  };

  // --- Email Test ---
  const handleSendTestEmail = async (type) => {
    if (!testEmail) return alert('Enter an email');
    setLoading(true);
    addLog(`Sending ${type} to ${testEmail}...`, 'info');
    try {
      await api.post('/test/email', { email: testEmail, type });
      addLog(`${type} email sent!`, 'success');
    } catch (err) {
      addLog(`Failed: ${err.response?.data?.message || err.message}`, 'error');
    }
    setLoading(false);
  };

  // --- Code Verify ---
  const handleVerifyCode = async () => {
    if (!testCode) return;
    setLoading(true);
    addLog(`Verifying code: ${testCode}...`, 'info');
    try {
      const res = await guestService.getByCode(testCode);
      addLog(`Valid! Guest: ${res.data.name} (${res.data.rsvp_status})`, 'success');
    } catch (err) {
      addLog(`Failed: ${err.response?.status === 404 ? 'Code not found' : err.message}`, 'error');
    }
    setLoading(false);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setTestCode(result);
    addLog(`Generated code: ${result}`, 'info');
  };

  return (
    <AdminPageLayout
      hero={
        <AdminPageHero
          title="Test Lab"
          description="API monitoring, feature simulation, and testing utilities"
          icon={<FlaskConical className="w-5 h-5 text-[#A67B5B]" />}
          breadcrumb="Test Lab"
        />
      }
    >
      {/* API Status Monitor */}
      <AdminCard className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
              <Activity className="w-5 h-5 text-[#A67B5B]" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">API Status Monitor</h2>
          </div>
          <button
            onClick={runHealthCheck}
            disabled={healthLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {health ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                health.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {health.status === 'healthy' ? 'All Systems Operational' : 'Degraded'}
              </span>
              <span className="text-xs text-stone-400">Last checked: {new Date(health.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(health.checks).map(([name, check]) => (
                <div key={name} className={`p-3 rounded-xl border ${STATUS_COLORS[check.status]?.bg || ''} ${STATUS_COLORS[check.status]?.border || ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[check.status]?.dot || ''}`} />
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">{name}</span>
                  </div>
                  <p className={`text-xs ${STATUS_COLORS[check.status]?.text || ''}`}>{check.message}</p>
                </div>
              ))}
            </div>

            {entityCounts && (
              <div className="mt-4 p-4 bg-stone-50 rounded-xl">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">Entity Counts</h4>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(entityCounts).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <p className="text-2xl font-bold text-[#A67B5B]">{val}</p>
                      <p className="text-xs text-stone-500 capitalize">{key.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-stone-400">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading health status...
          </div>
        )}
      </AdminCard>

      {/* Feature Simulation */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Live Update Simulation */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
              <Radio className="w-5 h-5 text-[#A67B5B]" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">Simulate Live Update</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Message</label>
              <textarea
                value={liveMsg}
                onChange={(e) => setLiveMsg(e.target.value)}
                placeholder="e.g. Ceremony starting in 5 minutes!"
                className="w-full p-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Type</label>
              <div className="flex gap-2">
                {['info', 'warning', 'success'].map(t => (
                  <button
                    key={t}
                    onClick={() => setLiveType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      liveType === t
                        ? 'bg-[#A67B5B] text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSimulateLiveUpdate}
              disabled={loading || !liveMsg.trim()}
              className="w-full py-3 bg-[#A67B5B] text-white rounded-lg hover:bg-[#8B6A4E] transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Radio className="w-4 h-4" /> Post Live Update
            </button>
            <p className="text-xs text-stone-400 text-center">Posts to Programme page via polling</p>
          </div>
        </AdminCard>

        {/* Polaroid Simulation */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
              <Camera className="w-5 h-5 text-[#A67B5B]" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">Simulate Polaroid</h2>
          </div>
          <div className="space-y-4">
            <AdminInput
              label="Caption"
              value={polaroidCaption}
              onChange={(e) => setPolaroidCaption(e.target.value)}
              placeholder="First dance moments"
            />
            <AdminInput
              label="Location"
              value={polaroidLocation}
              onChange={(e) => setPolaroidLocation(e.target.value)}
              placeholder="Main Hall"
            />
            <button
              onClick={handleSimulatePolaroid}
              disabled={loading}
              className="w-full py-3 bg-[#A67B5B] text-white rounded-lg hover:bg-[#8B6A4E] transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" /> Simulate Polaroid
            </button>
            <p className="text-xs text-stone-400 text-center">Creates a placeholder entry on Digital Invitation page</p>
          </div>
        </AdminCard>
      </div>

      {/* Email & Code Testing */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <AdminCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
              <Mail className="w-5 h-5 text-[#A67B5B]" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">Email System</h2>
          </div>
          <div className="space-y-4">
            <AdminInput
              label="Recipient"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="guest@example.com"
            />
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
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
              <QrCode className="w-5 h-5 text-[#A67B5B]" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">Code & QR</h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                className="flex-1 p-2 border border-stone-200 rounded-lg outline-none font-mono text-center tracking-widest font-bold"
              />
              <button onClick={generateRandomCode} className="p-2 bg-stone-100 rounded-lg hover:bg-stone-200 text-stone-600">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center p-4 bg-white border border-stone-200 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${testCode}`}
                alt="QR Code"
                className="w-28 h-28"
              />
            </div>
            <button
              onClick={handleVerifyCode}
              disabled={loading}
              className="w-full py-3 bg-[#A67B5B] text-white rounded-lg hover:bg-[#8B6A4E] transition-all font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Verify RSVP Code
            </button>
          </div>
        </AdminCard>
      </div>

      {/* Activity Log */}
      <div className="bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-800 font-mono text-sm h-64 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-stone-400 text-xs uppercase tracking-widest">Activity Log</h3>
          <button onClick={() => setLogs([])} className="text-xs text-stone-500 hover:text-stone-300">Clear</button>
        </div>
        <div className="space-y-2">
          {logs.length === 0 && <span className="text-stone-600 italic">No activity yet...</span>}
          {logs.map(log => (
            <div key={log.id} className="flex gap-3">
              <span className="text-stone-600">[{new Date(log.id).toLocaleTimeString()}]</span>
              <span className={
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                'text-stone-300'
              }>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminPageLayout>
  );
}
