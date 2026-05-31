import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Smartphone, ScanLine } from 'lucide-react';

type ScanState = 'idle' | 'scanning' | 'verifying' | 'success' | 'already_checked_in' | 'expired' | 'invalid' | 'rate_limited' | 'error';
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT_ADMIN' | 'OWNER' | 'UNKNOWN';

interface VerifyResponse {
    user_name?: string;
    slot_time?: string;
    checked_in_at?: string;
    message?: string;
}

function getUserRole(): Role {
    const profileStr = localStorage.getItem("kicko_admin_profile");
    if (profileStr) {
        try {
            const profile = JSON.parse(profileStr);
            return profile.role || "OWNER";
        } catch {
            return "OWNER";
        }
    }
    return 'UNKNOWN';
}

function hasAdminForceCheckInAccess(role: Role) {
    return ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN'].includes(role);
}

export default function QRScanner() {
    const navigate = useNavigate();
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [scanResponse, setScanResponse] = useState<VerifyResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [manualId, setManualId] = useState('');

    const qrRef = useRef<Html5Qrcode | null>(null);
    const qrcodeRegionId = "html5qr-code-full-region";
    const isScanningRef = useRef(false);
    const lastScanTimeRef = useRef(0);
    const mounted = useRef(true);

    const role = getUserRole();
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'OWNER'];

    useEffect(() => {
        if (!allowedRoles.includes(role)) {
            navigate('/admin', { replace: true });
        }
    }, [role, navigate]);

    const soundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Prepare a beep sound
        soundRef.current = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'); // Placeholder for valid mp3
        // We swallow any playback error if autoplay blocked
    }, []);

    const playSuccessSound = () => {
        try {
            soundRef.current?.play().catch(() => { });
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } catch (e) { }
    };

    const playErrorSound = () => {
        try {
            if (navigator.vibrate) navigator.vibrate([500]);
        } catch (e) { }
    };

    const startScanner = useCallback(async () => {
        if (qrRef.current) return;

        setScanState('scanning');
        setScanResponse(null);
        setErrorMessage('');

        try {
            const html5QrCode = new Html5Qrcode(qrcodeRegionId);
            qrRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                } as any,
                (decodedText) => {
                    handleScan(decodedText);
                },
                () => {
                    // parse errors are normal and frequent when moving the camera over non-qr stuff
                }
            );
            isScanningRef.current = true;
        } catch (err) {
            setScanState('error');
            setErrorMessage('Camera access denied or unavailable. Please check permissions.');
        }
    }, []);

    const stopScanner = async () => {
        if (qrRef.current && isScanningRef.current) {
            try {
                await qrRef.current.stop();
                qrRef.current.clear();
                qrRef.current = null;
                isScanningRef.current = false;
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    useEffect(() => {
        mounted.current = true;
        startScanner();
        return () => {
            mounted.current = false;
            stopScanner();
        };
    }, []);

    const handleScan = async (decodedText: string) => {
        const now = Date.now();
        if (now - lastScanTimeRef.current < 2000) return; // Debounce
        if (scanState === 'verifying') return; // Wait until current verify completes

        lastScanTimeRef.current = now;

        setScanState('verifying');

        // frontend simulation mode only
        await new Promise(resolve => setTimeout(resolve, 1500));

        let token = decodedText.trim();
        // Just for demo, we'll randomize the outcome based on the length of the string
        // or just cycle through states. Let's use a simple deterministic logic for demo purposes based on timestamp parity
        const mockRandom = Math.floor(Math.random() * 100);
        if (token.startsWith('http')) {
            try {
                const url = new URL(token);
                if (url.protocol !== 'https:') {
                    handleFailureState('invalid', 'Insecure QR Code origin. Only HTTPS is allowed.');
                    return;
                }
                const parts = url.pathname.split('/').filter(Boolean);
                token = parts[parts.length - 1];
            } catch (e) {
                handleFailureState('invalid', 'Malformed QR Code URL.');
                return;
            }
        }

        try {
            if (mockRandom < 60) { // 60% Success
                setScanResponse({
                    user_name: 'Alex Johnson',
                    slot_time: '18:00 - 19:00',
                    checked_in_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                });
                setScanState('success');
                playSuccessSound();
            } else if (mockRandom < 80) { // 20% Already Checked-in
                setScanState('already_checked_in');
                setScanResponse({ checked_in_at: '17:45 PM' });
                playErrorSound();
            } else if (mockRandom < 90) { // 10% Expired
                handleFailureState('expired', 'Booking Expired');
            } else { // 10% Invalid
                handleFailureState('invalid', 'Invalid QR Code');
            }
        } catch (e) {
            handleFailureState('error', 'Simulation error.');
        }
    };

    const handleFailureState = (state: ScanState, msg: string) => {
        setScanState(state);
        setErrorMessage(msg);
        playErrorSound();
    };

    const handleManualCheckIn = async () => {
        if (!manualId.trim()) return;
        setScanState('verifying');
        setErrorMessage('');

        if (qrRef.current) {
            await stopScanner();
        }

        try {
            // frontend simulation mode only
            await new Promise(resolve => setTimeout(resolve, 1500));

            const isSuccess = manualId.length > 4; // simple mock logic, ID > 4 chars = success

            if (isSuccess) {
                setScanResponse({
                    user_name: 'Manual Entry User',
                    slot_time: '19:00 - 20:00',
                    checked_in_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                });
                setScanState('success');
                playSuccessSound();
            } else {
                handleFailureState('invalid', 'Invalid Booking ID length (Demo requires >4 chars)');
            }
        } catch (e) {
            handleFailureState('invalid', 'Check-in request failed.');
        }
    };

    const resetScanner = () => {
        setScanState('idle');
        setScanResponse(null);
        setErrorMessage('');
        setManualId('');
        setTimeout(() => {
            if (mounted.current) startScanner();
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col font-sans">
            {/* Header */}
            <header className="flex-none h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between z-10">
                <button
                    onClick={() => { stopScanner(); navigate('/admin', { replace: true }); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-white font-serif font-bold text-lg tracking-wide">Scan Booking QR</h1>
                <div className="w-10 h-10" />
            </header>

            {/* Main Scanner Area */}
            <div className="flex-1 relative bg-black flex flex-col justify-center items-center overflow-hidden">
                {['idle', 'scanning', 'verifying'].includes(scanState) && (
                    <div className="absolute inset-0 w-full h-full flex flex-col">
                        <div id={qrcodeRegionId} className="w-full h-full object-cover qr-scanner-container [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
                        <div className="absolute inset-0 pointer-events-none z-10 border-[50px] border-slate-900/60" />

                        {scanState === 'scanning' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-teal-400 rounded-3xl pointer-events-none z-20 overflow-hidden shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                                <div className="w-full h-1 bg-teal-400/50 shadow-[0_0_15px_3px_#2dd4bf] animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                        )}
                    </div>
                )}

                {/* Verification Loader Overlay */}
                {scanState === 'verifying' && (
                    <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-4" />
                        <p className="text-white font-medium tracking-widest uppercase text-sm animate-pulse">Verifying booking...</p>
                    </div>
                )}

                {/* Status Cards */}
                <div className="absolute inset-x-0 bottom-6 px-4 z-40 flex flex-col gap-4 max-w-md mx-auto w-full">

                    {scanState === 'success' && scanResponse && (
                        <div className="bg-emerald-500 text-white p-6 rounded-3xl shadow-xl border border-emerald-400 flex flex-col items-center text-center animate-in slide-in-from-bottom-5 fade-in">
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-bold mb-1">✔ Check-in Successful</h2>
                            <div className="space-y-1 mt-3 w-full bg-emerald-600/30 rounded-2xl p-4 text-sm font-medium">
                                <div className="flex justify-between">
                                    <span className="text-emerald-100">User</span>
                                    <span>{scanResponse.user_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-emerald-100">Time Slot</span>
                                    <span>{scanResponse.slot_time}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-emerald-100">Checked In</span>
                                    <span>{scanResponse.checked_in_at}</span>
                                </div>
                            </div>
                            <button
                                onClick={resetScanner}
                                className="mt-5 w-full bg-white text-emerald-600 font-bold py-3.5 rounded-full hover:bg-emerald-50 active:scale-95 transition-all shadow-md"
                            >
                                Scan Next Booking
                            </button>
                        </div>
                    )}

                    {scanState === 'already_checked_in' && (
                        <div className="bg-amber-500 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center text-center animate-in slide-in-from-bottom-5 fade-in">
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                                <Clock className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Already Checked-in</h2>
                            <p className="text-amber-100 font-medium">This booking was already checked in at {scanResponse?.checked_in_at}.</p>
                            <button onClick={resetScanner} className="mt-5 w-full bg-white text-amber-600 font-bold py-3.5 rounded-full shadow-md">
                                Scan Again
                            </button>
                        </div>
                    )}

                    {['expired', 'invalid', 'rate_limited', 'error'].includes(scanState) && (
                        <div className="bg-rose-500 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center text-center animate-in slide-in-from-bottom-5 fade-in">
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                                {scanState === 'rate_limited' ? <Clock className="w-8 h-8 text-white" /> : <XCircle className="w-8 h-8 text-white" />}
                            </div>
                            <h2 className="text-xl font-bold mb-2">
                                {scanState === 'expired' ? 'Booking Expired' : scanState === 'rate_limited' ? 'Too many scans' : 'Invalid QR Code'}
                            </h2>
                            {errorMessage && <p className="text-rose-100 font-medium text-sm">{errorMessage}</p>}
                            <button onClick={resetScanner} className="mt-5 w-full bg-white text-rose-600 font-bold py-3.5 rounded-full shadow-md">
                                Try Again
                            </button>
                        </div>
                    )}

                    {scanState === 'scanning' && hasAdminForceCheckInAccess(role) && (
                        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-5 rounded-3xl shadow-xl mt-4">
                            <div className="mb-3">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-slate-400" />
                                    Manual Booking ID Entry
                                </h3>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value)}
                                    placeholder="Enter Booking ID"
                                    className="flex-1 bg-slate-900 border border-slate-600 text-white px-4 py-3 rounded-2xl outline-none focus:border-teal-500 font-mono text-sm placeholder:text-slate-500 placeholder:font-sans transition-colors"
                                />
                                <button
                                    onClick={handleManualCheckIn}
                                    disabled={!manualId.trim() || scanState === 'verifying'}
                                    className="bg-teal-500 text-white px-5 rounded-2xl font-semibold disabled:opacity-50 hover:bg-teal-400 active:scale-95 transition-all"
                                >
                                    Force Check-in
                                </button>
                            </div>
                        </div>
                    )}

                    {scanState === 'scanning' && !hasAdminForceCheckInAccess(role) && (
                        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 text-center border border-slate-700/50 shadow-xl mb-4">
                            <div className="animate-pulse flex flex-col justify-center items-center gap-2 mb-1">
                                <ScanLine className="w-6 h-6 text-teal-400" />
                                <p className="text-slate-300 font-medium text-sm tracking-wide">Align QR code within the frame to scan</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Scanner laser animation */}
            <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(256px); opacity: 0; }
        }
        .html5-qrcode-element {
            display: none !important;
        }
      `}</style>
        </div>
    );
}
