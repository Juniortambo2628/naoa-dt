import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, UserCheck, Users, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';
import StatCard from '../../components/admin/StatCard';

export default function CheckInScanner() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [stats, setStats] = useState({ total_expected: 0, checked_in: 0, remaining: 0, percentage: 0 });
    const [recentCheckIns, setRecentCheckIns] = useState([]);
    const scannerRef = useRef(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/checkin/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to load stats', err);
        }
    };

    const startScanning = () => {
        setScanning(true);
        setResult(null);

        setTimeout(() => {
            const scanner = new Html5QrcodeScanner('qr-reader', {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            });

            scanner.render(onScanSuccess, onScanError);
            scannerRef.current = scanner;
        }, 100);
    };

    const stopScanning = () => {
        if (scannerRef.current) {
            scannerRef.current.clear();
        }
        setScanning(false);
    };

    const onScanSuccess = async (decodedText) => {
        stopScanning();
        
        try {
            const res = await api.post('/checkin/scan', { qr_code: decodedText });
            setResult({
                success: res.data.success,
                message: res.data.message,
                guest: res.data.guest
            });
            
            if (res.data.success) {
                setRecentCheckIns(prev => [res.data.guest, ...prev.slice(0, 4)]);
                fetchStats();
            }
        } catch (err) {
            setResult({
                success: false,
                message: err.response?.data?.message || 'Check-in failed',
                guest: err.response?.data?.guest
            });
        }
    };

    const onScanError = (error) => {
        // Ignore scan errors (continuous scanning)
    };

    return (
        <div className="space-y-6">
            <AdminPageHero
                title="Guest Check-In"
                description="Scan QR codes to check in guests"
                breadcrumb={[
                    { label: 'Dashboard', path: '/admin/dashboard' },
                    { label: 'Check-In' },
                ]}
                icon={<QrCode className="w-5 h-5 text-[#A67B5B]" />}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    icon={<Users className="w-6 h-6" />}
                    label="Expected"
                    value={stats.total_expected}
                    color="#A67B5B"
                />
                <StatCard 
                    icon={<UserCheck className="w-6 h-6" />}
                    label="Checked In"
                    value={stats.checked_in}
                    color="#8B9A7D"
                />
                <StatCard 
                    icon={<AlertCircle className="w-6 h-6" />}
                    label="Remaining"
                    value={stats.remaining}
                    color="#D4A59A"
                />
                <StatCard 
                    icon={<CheckCircle className="w-6 h-6" />}
                    label="Progress"
                    value={`${stats.percentage}%`}
                    color="#C8A68E"
                />
            </div>

            {/* Scanner Section */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                    <h3 className="text-lg font-medium text-stone-800 mb-4">QR Scanner</h3>
                    
                    {!scanning ? (
                        <div className="text-center py-12">
                            <QrCode className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                            <p className="text-stone-500 mb-4">Click below to start scanning</p>
                            <button 
                                onClick={startScanning}
                                className="btn-primary"
                            >
                                Start Scanning
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
                            <button 
                                onClick={stopScanning}
                                className="w-full mt-4 btn-secondary"
                            >
                                Stop Scanning
                            </button>
                        </div>
                    )}

                    {/* Result Display */}
                    {result && (
                        <div className={`mt-4 p-4 rounded-xl ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-center gap-3">
                                {result.success ? (
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                )}
                                <div>
                                    <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                        {result.message}
                                    </p>
                                    {result.guest && (
                                        <p className="text-sm text-stone-600">
                                            Table: {result.guest.table?.name || 'Unassigned'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => { setResult(null); startScanning(); }}
                                className="w-full mt-3 btn-primary"
                            >
                                Scan Next Guest
                            </button>
                        </div>
                    )}
                </div>

                {/* Recent Check-ins */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                    <h3 className="text-lg font-medium text-stone-800 mb-4">Recent Check-Ins</h3>
                    {recentCheckIns.length === 0 ? (
                        <p className="text-center py-8 text-stone-400">No check-ins yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentCheckIns.map((guest, idx) => (
                                <div key={guest.id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <div>
                                        <p className="font-medium text-stone-700">{guest.name}</p>
                                        <p className="text-xs text-stone-500">
                                            Table: {guest.table?.name || 'Unassigned'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
