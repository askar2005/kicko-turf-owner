import {
  LogOut,
  BarChart3,
  CalendarDays,
  IndianRupee,
  Users,
  Download,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminCharts from './AdminCharts';
import AdminDatabase from './AdminDatabase';
import AddTurfModal from './AddTurfModal';
import { PlusCircle, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [search, setSearch] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(true); // ✅ NEW
  const [isAddTurfOpen, setIsAddTurfOpen] = useState(false);
  const navigate = useNavigate();

  const adminProfileStr = localStorage.getItem("kicko_admin_profile");
  const ownerId = (() => {
    if (adminProfileStr) {
      try {
        const profile = JSON.parse(adminProfileStr);
        return profile.id;
      } catch {}
    }
    return '';
  })();

  const ownerName = (() => {
    if (adminProfileStr) {
      try {
        const profile = JSON.parse(adminProfileStr);
        return profile.name || "Owner";
      } catch {}
    }
    return "Owner";
  })();

  const role = (() => {
    if (adminProfileStr) {
      try {
        const profile = JSON.parse(adminProfileStr);
        return profile.role || "OWNER";
      } catch {}
    }
    return 'UNKNOWN';
  })();
  const hasScannerAccess = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'OWNER'].includes(role);

  const [bookings, setBookings] = useState<any[]>([]);
  const [ownerTurfs, setOwnerTurfs] = useState<any[]>([]);

  useEffect(() => {
    const getAuthHeaders = () => {
      const profileStr = localStorage.getItem("kicko_admin_profile");
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          if (profile && profile.token) {
            return { "Authorization": `Bearer ${profile.token}` };
          }
        } catch {}
      }
      return {};
    };

    const fetchBookings = async () => {
      if (!ownerId) return;
      try {
        // Fetch only owner's turfs
        const res = await fetch(`http://localhost:5000/api/turfs?ownerId=${ownerId}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) return;
        const turfs = await res.json();
        
        const activeTurfId = localStorage.getItem('kicko_active_turf_id');
        let displayTurfs = turfs;
        if (activeTurfId) {
            displayTurfs = turfs.filter((t: any) => t.id === activeTurfId);
            if (displayTurfs.length === 0) displayTurfs = turfs;
        }

        setOwnerTurfs(displayTurfs);
        
        let allBookings: any[] = [];
        for (const turf of displayTurfs) {
           try {
             const bRes = await fetch(`http://localhost:5000/api/bookings/turf/${turf.id}`, {
               headers: getAuthHeaders()
             });
             if (bRes.ok) {
                 const turfBookings = await bRes.json();
                 for (const b of turfBookings) {
                    allBookings.push({
                       id: b.id,
                       date: b.date,
                       turf: turf.name,
                       slot: `${b.startTime} - ${b.endTime}`,
                       user: b.user?.name || b.userId,
                       userName: b.user?.name || b.userId,
                       amount: turf.pricePerHour || turf.price || 1200,
                       status: b.status
                    });
                 }
             }
           } catch(e) {}
        }
        setBookings(allBookings);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(
    (b) =>
      b.turf.toLowerCase().includes(search.toLowerCase()) ||
      b.user.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate stats
  const todayStr = new Date().toISOString().split('T')[0];
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  
  let todayBookingsCount = 0;
  let todayRevenue = 0;
  let lastWeekBookingsCount = 0;

  bookings.forEach(b => {
      // Basic check (assuming b.date is YYYY-MM-DD or similar sortable/comparable format, or matches todayStr exactly)
      // For precision, we parse it:
      try {
        const bDateStr = new Date(b.date).toISOString().split('T')[0];
        if (bDateStr === todayStr) {
            todayBookingsCount++;
            todayRevenue += Number(b.amount) || 0;
        }
        const bDateObj = new Date(b.date);
        if (bDateObj >= lastWeekDate && bDateObj <= new Date()) {
            lastWeekBookingsCount++;
        }
      } catch (e) {
          // fallback if date parsing fails
          if (b.date === todayStr) todayBookingsCount++;
      }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-teal-50 to-indigo-50 font-sans">
      {/* HEADER */}
      <header className="bg-white/60 backdrop-blur-md border-b border-white/60 shadow-sm sticky top-0 z-10 p-2">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-xl bg-teal-100 shadow-sm border border-teal-50">
              <div className="h-5 w-5 bg-teal-500 rounded-md" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-slate-800 leading-tight">
                Kicko Workspace
              </h1>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                {localStorage.getItem('kicko_active_turf_id') && ownerTurfs.length === 1 ? ownerTurfs[0].name : "Turf Manager"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasScannerAccess && (
              <button
                onClick={() => navigate('/admin/scan')}
                className="flex items-center gap-2 text-slate-700 hover:text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-full transition-all text-sm font-medium border border-transparent hover:border-teal-100"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">QR Scanner</span>
                <span className="sm:hidden">Scan</span>
              </button>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 text-slate-700 hover:text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-full transition-all text-sm font-medium border border-transparent hover:border-teal-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-full transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* TOP STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <StatCard title="My Turfs" value={ownerTurfs.length.toString()} icon={<BarChart3 className="w-6 h-6" />} color="emerald" />
          <StatCard title="Today Bookings" value={todayBookingsCount.toString()} icon={<CalendarDays className="w-6 h-6" />} color="blue" />
          <StatCard title="Today Revenue" value={`₹${todayRevenue.toLocaleString()}`} icon={<IndianRupee className="w-6 h-6" />} color="rose" />
          <StatCard title="7-Day Bookings" value={lastWeekBookingsCount.toString()} icon={<Users className="w-6 h-6" />} color="amber" />

          {/* ADD TURF CARD BUTTON (Only show if 0 turfs) */}
          {ownerTurfs.length === 0 && (
              <button
                onClick={() => setIsAddTurfOpen(true)}
                className="group relative overflow-hidden bg-teal-500 text-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 flex flex-col justify-between hover:bg-teal-600 transition-all text-left border border-teal-400/50 hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110" />
                <div className="p-3 bg-white/20 text-white w-fit rounded-2xl mb-4 backdrop-blur-sm shadow-sm">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <p className="text-xs text-teal-100 font-medium uppercase tracking-wider mb-1">Quick Action</p>
                  <p className="text-xl font-serif font-bold">Add Turf</p>
                </div>
              </button>
          )}
        </div>

        {/* OWNER WELCOME & TURF DETAILS (If they have a turf) */}
        {ownerTurfs.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8 animate-fade-in">
            <h2 className="text-3xl font-serif text-slate-800 font-bold mb-2">Welcome back, {ownerName}! 👋</h2>
            <p className="text-slate-500 mb-6 font-medium">Here's a quick look at your active turfs on Kicko.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ownerTurfs.map(turf => (
                <div
                  key={turf.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (turf.status === 'APPROVED') {
                      navigate(`/admin/turf/${turf.id}`);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (turf.status === 'APPROVED' && (e.key === 'Enter' || e.key === ' ')) {
                      navigate(`/admin/turf/${turf.id}`);
                    }
                  }}
                  className={`border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex items-start gap-4 transition-all ${
                    turf.status === 'APPROVED'
                      ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
                      : 'opacity-75 cursor-not-allowed'
                  }`}
                >
                  <div className="h-16 w-16 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
                    <span className="text-2xl">🏟️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800">{turf.name}</h3>
                    <p className="text-sm text-slate-500 mb-2">{turf.location}</p>
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold border border-emerald-100 uppercase">{turf.status}</span>
                      <span className="text-sm font-bold text-slate-700">₹{turf.pricePerHour}/hr</span>
                    </div>
                    {turf.status === 'APPROVED' && (
                      <p className="mt-3 text-xs font-semibold text-teal-600">
                        Open slot manager to block or release approved slots.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOKINGS TABLE */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-serif text-slate-800 font-bold mb-1">Recent Approvals</h2>
              <p className="text-sm text-slate-500">Overview of today's upcoming turf reservations.</p>
            </div>

            <input
              placeholder="Search turf or user..."
              className="w-full sm:w-auto border border-slate-200 bg-white/50 px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-teal-200 outline-none transition-all shadow-sm"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ✅ LOADING HANDLED HERE */}
          {loadingBookings ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100/60 uppercase text-[11px] tracking-wider font-semibold">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Turf</th>
                    <th className="py-3 px-2">Slot</th>
                    <th className="py-3 px-2">User</th>
                    <th className="py-3 px-2">Amount</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((b, i) => (
                    <tr key={i} className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors last:border-none">
                      <td className="py-4 px-2 font-medium text-slate-700">{b.date}</td>
                      <td className="py-4 px-2 text-slate-600">{b.turf}</td>
                      <td className="py-4 px-2 text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-mono">{b.slot}</span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                            {b.user.charAt(0)}
                          </div>
                          <span className="text-slate-700 font-medium">{b.user}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 font-semibold text-slate-700">₹{b.amount}</td>
                      <td className="py-4 px-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold tracking-wide uppercase border border-emerald-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loadingBookings && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  const csv =
                    'Date,Turf,Slot,User,Amount\n25 Jan,Green Field Arena,07-08,Askar,800';
                  const blob = new Blob([csv]);
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'today-bookings.csv';
                  a.click();
                }}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          )}
        </div>

        {/* ADMIN ANALYTICS */}
        <div className="bg-transparent mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-serif font-bold text-slate-800">Turf Analytics</h2>
            <p className="text-sm text-slate-500">Real-time booking and revenue trends for your turfs.</p>
          </div>
          <AdminCharts bookings={bookings} />
        </div>

        {/* ADMIN DATABASE */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-slate-800">Database Records</h2>
            <p className="text-sm text-slate-500">Comprehensive view of all customer transactions and reservations.</p>
          </div>
          <AdminDatabase bookings={bookings} />
        </div>
      </main>

      <AddTurfModal
        isOpen={isAddTurfOpen}
        onClose={() => setIsAddTurfOpen(false)}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: JSX.Element;
  color: 'emerald' | 'blue' | 'rose' | 'amber';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-500',
    blue: 'bg-blue-50 text-blue-500',
    rose: 'bg-rose-50 text-rose-500',
    amber: 'bg-amber-50 text-amber-500',
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-default">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-serif font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
