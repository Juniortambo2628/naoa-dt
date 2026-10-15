import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import {
  Mail, QrCode, Send, RefreshCw, CheckCircle, FlaskConical,
  Radio, Camera, Wifi, Database, HardDrive, Server, Bell,
  AlertTriangle, Check, X, Activity, Zap, BarChart3,
  Cloud, Map, ExternalLink, Settings, Plane, Trash2
} from 'lucide-react';
import api, { guestService, testLabService, weatherService, tableService, settingService } from '../../services/api';
import AdminCard from '../../components/admin/AdminCard';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { AdminInput } from '../../components/admin/AdminInput';
import { notifyError } from '../../utils/feedback';
import Button from '../../components/Button';
import SegmentedControl from '../../components/SegmentedControl';
import useAdminAction from '../../hooks/useAdminAction';

const LIVE_TYPE_OPTIONS = ['normal', 'important', 'alert'].map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

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

const SECTIONS = [
  { id: 'health', label: 'API Status', icon: Activity, description: 'Health of the API and its services' },
  { id: 'simulate', label: 'Simulations', icon: Radio, description: 'Live updates and polaroids' },
  { id: 'apis', label: 'API Endpoints', icon: Server, description: 'Weather, seating and settings' },
  { id: 'messaging', label: 'Email & Notifications', icon: Mail, description: 'Test emails and flight alerts' },
  { id: 'codes', label: 'Codes & QR', icon: QrCode, description: 'Generate and verify RSVP codes' },
];

export default function AdminTestLab() {
  const [section, setSection] = useState('health');
  const [testEmail, setTestEmail] = useState('');
  const [testCode, setTestCode] = useState('TEST-CODE-123');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Simulation states
  const [liveMsg, setLiveMsg] = useState('');
  const [liveType, setLiveType] = useState('normal');
  const [polaroidCaption, setPolaroidCaption] = useState('');
  const [polaroidLocation, setPolaroidLocation] = useState('');

  // API test states
  const [weatherResult, setWeatherResult] = useState(null);
  const [seatingResult, setSeatingResult] = useState(null);
  const [settingsResult, setSettingsResult] = useState(null);

  // API Health states
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true); // the check runs on mount
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
      if (!res.data?.checks) throw new Error('No health data returned');
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
  // Test Lab results go to its log panel, not toasts.
  const logFailure = (err) => addLog(`Failed: ${err.response?.data?.message || err.message}`, 'error');
  const simulateLiveUpdate = useAdminAction(() => testLabService.simulateLiveUpdate({ message: liveMsg, type: liveType }), {
    key: () => 'live',
    error: false,
    onSuccess: () => { addLog('Live update posted! Check Programme page.', 'success'); setLiveMsg(''); },
    onError: logFailure,
  });
  const handleSimulateLiveUpdate = async () => {
    if (!liveMsg.trim()) return notifyError('Enter a message');
    setLoading(true);
    addLog(`Posting live update: "${liveMsg}"`, 'info');
    await simulateLiveUpdate.run();
    setLoading(false);
  };

  // --- Simulate Polaroid ---
  const simulatePolaroid = useAdminAction(() => testLabService.simulatePolaroid({
    note: polaroidCaption || 'Test polaroid from admin',
    location: polaroidLocation || 'Test Lab',
  }), {
    key: () => 'polaroid',
    error: false,
    onSuccess: () => {
      addLog('Polaroid simulated! Check Programme page.', 'success');
      setPolaroidCaption('');
      setPolaroidLocation('');
    },
    onError: logFailure,
  });
  const handleSimulatePolaroid = async () => {
    setLoading(true);
    addLog('Simulating polaroid image...', 'info');
    await simulatePolaroid.run();
    setLoading(false);
  };

  // --- Email Test ---
  const handleSendTestEmail = async (type) => {
    if (!testEmail) return notifyError('Enter an email');
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

  // --- Flight Notification Test ---
  const handleSendTestFlightNotification = async (type) => {
    if (!testEmail) return notifyError('Enter an email in the Email System card first');
    setLoading(true);
    addLog(`Sending test flight notification (${type}) to ${testEmail}...`, 'info');
    try {
      await api.post('/test/flight-notification', { email: testEmail, type });
      addLog(`Flight notification (${type}) sent! Check your inbox.`, 'success');
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

  // --- Test Weather API ---
  const handleTestWeather = async () => {
    setLoading(true);
    addLog('Fetching weather forecast...', 'info');
    try {
      const res = await weatherService.getForecast();
      setWeatherResult(res.data);
      addLog(`Weather loaded: ${res.data?.daily?.time?.length || 0} days`, 'success');
    } catch (err) {
      addLog(`Weather failed: ${err.response?.data?.message || err.message}`, 'error');
    }
    setLoading(false);
  };

  // --- Test Seating API ---
  const handleTestSeating = async () => {
    setLoading(true);
    addLog('Fetching public seating chart...', 'info');
    try {
      const res = await tableService.getPublic();
      const tables = res.data || [];
      setSeatingResult(tables);
      addLog(`Seating loaded: ${tables.length} tables`, 'success');
    } catch (err) {
      addLog(`Seating failed: ${err.response?.data?.message || err.message}`, 'error');
    }
    setLoading(false);
  };

  // --- Test Settings API ---
  const handleTestSettings = async () => {
    setLoading(true);
    addLog('Fetching venue settings...', 'info');
    try {
      const res = await settingService.getAll();
      setSettingsResult(res.data);
      addLog(`Settings loaded: lat=${res.data?.venue_lat}, lng=${res.data?.venue_lng}`, 'success');
    } catch (err) {
      addLog(`Settings failed: ${err.response?.data?.message || err.message}`, 'error');
    }
    setLoading(false);
  };

  return (
    <AdminPageLayout
      actions={[
        {
          id: 'health-check',
          label: healthLoading ? 'Checking...' : 'Run Health Check',
          icon: Activity,
          variant: 'secondary',
          onClick: runHealthCheck,
          disabled: healthLoading,
        },
        { id: 'clear-logs', readOnly: true, label: 'Clear Logs', icon: Trash2, variant: 'danger', onClick: () => setLogs([]), hidden: logs.length === 0 },
      ]}
      panel={{
        id: 'test-lab',
        title: 'Test Areas',
        icon: FlaskConical,
        items: SECTIONS,
        activeId: section,
        onChange: setSection,
        footer: (
          <p className="text-xs text-stone-600 leading-relaxed">
            Everything you run here is recorded in the activity log under each area.
          </p>
        ),
      }}
      hero={
        <AdminPageHero
          title="Test Lab"
          description="API monitoring, feature simulation, and testing utilities"
          icon={<FlaskConical className="w-5 h-5 text-[#A67B5B]" />}
          breadcrumb="Test Lab"
        />
      }
    >
      {section === 'health' && (<>
      {/* API Status Monitor */}
      <AdminCard className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
              <Activity className="w-5 h-5 text-[#A67B5B]" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">API Status Monitor</h2>
          </div>
          <Button icon={RefreshCw} onClick={runHealthCheck} loading={healthLoading}>
            Refresh
          </Button>
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

            <div className="grid grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-5 gap-3">
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
                <div className="grid grid-cols-3 @2xl:grid-cols-5 gap-4">
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
        ) : healthLoading ? (
          <div className="flex items-center gap-2 text-stone-500" role="status">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading health status...
          </div>
        ) : (
          <div className="flex items-center gap-2 text-stone-600" role="status">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Health status unavailable — see the logs below and run the check again.
          </div>
        )}
      </AdminCard>
      </>)}

      {section === 'simulate' && (<>
      {/* Feature Simulation */}
      <div className="grid @2xl:grid-cols-2 gap-4 mb-6">
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
              <SegmentedControl
                aria-label="Live update type"
                className="gap-2"
                options={LIVE_TYPE_OPTIONS}
                value={liveType}
                onChange={setLiveType}
              />
            </div>
            <Button edit
              variant="secondary"
              icon={Radio}
              fullWidth
              onClick={handleSimulateLiveUpdate}
              disabled={loading || !liveMsg.trim()}
            >
              Post Live Update
            </Button>
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
            <Button edit
              variant="secondary"
              icon={Camera}
              fullWidth
              onClick={handleSimulatePolaroid}
              disabled={loading}
            >
              Simulate Polaroid
            </Button>
            <p className="text-xs text-stone-400 text-center">Creates a placeholder entry on Digital Invitation page</p>
          </div>
        </AdminCard>
      </div>
      </>)}

      {section === 'apis' && (<>
      {/* API Endpoint Testing */}
      <div className="grid @3xl:grid-cols-3 gap-4 mb-6">
        {/* Weather API Test */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Cloud className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">Weather API</h2>
          </div>
          <p className="text-xs text-stone-500 mb-4">Test the Open-Meteo weather proxy for venue forecast.</p>
          <Button icon={Cloud} fullWidth onClick={handleTestWeather} disabled={loading}>
            Test Weather Endpoint
          </Button>
          {weatherResult && (
            <div className="mt-3 p-3 bg-stone-50 rounded-lg text-xs">
              <p className="font-medium text-stone-700">{weatherResult.location || 'Venue'}</p>
              <p className="text-stone-500">{weatherResult.daily?.time?.length || 0} day forecast</p>
              {weatherResult.current && <p className="text-stone-500">Current: {weatherResult.current.temperature}°C</p>}
            </div>
          )}
        </AdminCard>

        {/* Seating API Test */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Map className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">Seating API</h2>
          </div>
          <p className="text-xs text-stone-500 mb-4">Test the public seating chart endpoint.</p>
          <Button icon={Map} fullWidth onClick={handleTestSeating} disabled={loading}>
            Test Seating Endpoint
          </Button>
          {seatingResult && (
            <div className="mt-3 p-3 bg-stone-50 rounded-lg text-xs">
              <p className="font-medium text-stone-700">{seatingResult.length} tables found</p>
              {seatingResult.slice(0, 3).map((t, i) => (
                <p key={i} className="text-stone-500">{t.name} — {t.guests?.length || 0} guests</p>
              ))}
            </div>
          )}
        </AdminCard>

        {/* Settings API Test */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Settings className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">Settings API</h2>
          </div>
          <p className="text-xs text-stone-500 mb-4">Verify venue coordinates and site settings.</p>
          <Button icon={Settings} fullWidth onClick={handleTestSettings} disabled={loading}>
            Test Settings Endpoint
          </Button>
          {settingsResult && (
            <div className="mt-3 p-3 bg-stone-50 rounded-lg text-xs">
              <p className="font-medium text-stone-700">Venue Location</p>
              <p className="text-stone-500">Lat: {settingsResult.venue_lat || 'Not set'}</p>
              <p className="text-stone-500">Lng: {settingsResult.venue_lng || 'Not set'}</p>
            </div>
          )}
        </AdminCard>
      </div>

      {/* Quick Links */}
      <div className="flex gap-3 mb-6">
        <Button as={Link} to="/invitation/LO2J85UX" target="_blank" icon={ExternalLink}>
          Preview Digital Invitation
        </Button>
        <Button as={Link} to="/programme" target="_blank" icon={ExternalLink}>
          Preview Programme Page
        </Button>
      </div>
      </>)}

      {section === 'messaging' && (<>
      {/* Email & Code Testing */}
      <div className="grid @2xl:grid-cols-2 gap-4 mb-6">
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
              <Button icon={Send} onClick={() => handleSendTestEmail('invitation')} disabled={loading}>
                Invitation
              </Button>
              <Button icon={CheckCircle} onClick={() => handleSendTestEmail('rsvp_confirmation')} disabled={loading}>
                Confirmation
              </Button>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Plane className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-medium text-stone-800">Flight Notifications</h2>
          </div>
          <p className="text-xs text-stone-500 mb-4">Send test flight status emails to verify notification system.</p>
          <div className="space-y-3">
            {[
              { type: 'delayed', label: 'Delayed (+45min)', color: 'amber' },
              { type: 'cancelled', label: 'Cancelled', color: 'red' },
              { type: 'gate_change', label: 'Gate Change', color: 'blue' },
              { type: 'diverted', label: 'Diverted', color: 'purple' },
              { type: 'status_change', label: 'Landed', color: 'green' },
            ].map((item) => (
              <Button
                key={item.type}
                icon={Plane}
                fullWidth
                onClick={() => handleSendTestFlightNotification(item.type)}
                disabled={loading || !testEmail}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {!testEmail && (
            <p className="text-xs text-amber-600 mt-2 text-center">Enter an email in the Email System card first</p>
          )}
        </AdminCard>
      </div>
      </>)}

      {section === 'codes' && (<>
      {/* Code & QR */}
      <div className="grid @2xl:grid-cols-2 gap-4 mb-6">
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
              <Button size="icon" icon={RefreshCw} aria-label="Generate a random code" title="Generate a random code" onClick={generateRandomCode} />
            </div>
            <div className="flex justify-center p-4 bg-white border border-stone-200 rounded-xl">
              <QRCodeSVG value={testCode || ' '} size={112} title={`QR code for ${testCode}`} />
            </div>
            <Button edit variant="secondary" icon={CheckCircle} fullWidth onClick={handleVerifyCode} disabled={loading}>
              Verify RSVP Code
            </Button>
          </div>
        </AdminCard>
      </div>
      </>)}

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
