import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, FileText, ShieldCheck, Settings as SettingsIcon, PlusCircle, MapPin, IndianRupee, Layers } from 'lucide-react';
import AddTurfModal from './AddTurfModal';

export default function Settings() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [isAddTurfOpen, setIsAddTurfOpen] = useState(false);
    const [ownerTurfs, setOwnerTurfs] = useState<any[]>([]);
    const [showOtherTurfs, setShowOtherTurfs] = useState(false);

    useEffect(() => {
        const profileStr = localStorage.getItem("kicko_admin_profile");
        if (profileStr) {
            const parsed = JSON.parse(profileStr);
            setProfile(parsed);

            // Fetch owner's turfs
            if (parsed.id) {
                const headers: any = {};
                if (parsed.token) {
                    headers["Authorization"] = `Bearer ${parsed.token}`;
                }
                fetch(`http://localhost:5000/api/turfs?ownerId=${parsed.id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(data => setOwnerTurfs(data))
                    .catch(() => { });
            }
        }
    }, []);

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-teal-50 to-indigo-50 font-sans">
            <header className="bg-white/60 backdrop-blur-md border-b border-white/60 shadow-sm sticky top-0 z-10 p-2">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 text-slate-600 hover:text-teal-600 px-2 py-2 rounded-full transition-all text-sm font-medium"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-teal-100 text-teal-600 shadow-sm">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-slate-800">Settings & Profile</h1>
                        <p className="text-sm text-slate-500">Manage your account details and review policies</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mb-6">
                    {ownerTurfs.length > 1 && (
                        <button
                            onClick={() => setShowOtherTurfs(!showOtherTurfs)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 border ${showOtherTurfs ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Layers className="w-5 h-5" />
                            {showOtherTurfs ? 'Hide Other Turfs' : `View Other Turfs (${ownerTurfs.length})`}
                        </button>
                    )}
                    <button
                        onClick={() => setIsAddTurfOpen(true)}
                        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Add New Turf
                    </button>
                </div>

                {/* Other Turfs Section (Only for multi-turf owners) */}
                {showOtherTurfs && ownerTurfs.length > 1 && (
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8 animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Your Turfs ({ownerTurfs.length})</h2>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('kicko_active_turf_id');
                                    navigate('/admin');
                                }}
                                className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-full transition-colors"
                            >
                                View All Turfs Aggregated
                            </button>
                        </div>

                        <div className="space-y-4">
                            {ownerTurfs.map(turf => (
                                <div key={turf.id} className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex items-start gap-4 hover:border-teal-200 transition-colors">
                                    <div className="h-14 w-14 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
                                        <span className="text-2xl">🏟️</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-slate-800 mb-1">{turf.name}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{turf.location}</span>
                                            <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />₹{turf.pricePerHour}/hr</span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${turf.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : turf.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${turf.status === 'APPROVED' ? 'bg-emerald-500' : turf.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                {turf.status}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    localStorage.setItem('kicko_active_turf_id', turf.id);
                                                    navigate('/admin');
                                                }}
                                                className="bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                                            >
                                                Manage this Turf
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Profile Details */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
                    <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-6">Owner Profile</h2>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-16 w-16 bg-teal-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-800">{profile.name}</p>
                            <p className="text-sm text-slate-500 font-medium">{profile.role || 'Turf Owner'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                            <Mail className="text-slate-400 w-5 h-5" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                                <p className="text-sm font-semibold text-slate-700">{profile.email}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                            <Phone className="text-slate-400 w-5 h-5" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Mobile Number</p>
                                <p className="text-sm font-semibold text-slate-700">{profile.mobile || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Policies */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
                    <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-6">Platform Policies</h2>

                    <div className="space-y-3">
                        <details className="group bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                            <summary className="flex items-center p-4 font-semibold text-slate-700 list-none">
                                <FileText className="w-5 h-5 text-teal-500 mr-3" />
                                Turf Listing Guidelines
                            </summary>
                            <div className="px-4 pb-4 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-2 pt-3">
                                As a turf owner, you must ensure that your turf availability is kept up to date. Any cancellations initiated by the owner may incur a penalty. You must provide clear images and accurate location details.
                            </div>
                        </details>

                        <details className="group bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                            <summary className="flex items-center p-4 font-semibold text-slate-700 list-none">
                                <ShieldCheck className="w-5 h-5 text-teal-500 mr-3" />
                                Platform Fee Policy
                            </summary>
                            <div className="px-4 pb-4 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-2 pt-3">
                                Kicko charges a flat ₹50 convenience fee to the customer per booking. There are no direct listing fees for owners. Payouts are settled to your linked bank account every 7 business days.
                            </div>
                        </details>
                    </div>
                </div>
            </main>

            <AddTurfModal
                isOpen={isAddTurfOpen}
                onClose={() => setIsAddTurfOpen(false)}
            />
        </div>
    );
}
