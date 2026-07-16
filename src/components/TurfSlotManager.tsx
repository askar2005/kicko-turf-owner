import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CircleSlash2,
  Loader2,
  Lock,
  Shield,
  Unlock,
} from 'lucide-react';

const SLOT_TIMES = [
  '06:00 - 07:00',
  '07:00 - 08:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00',
  '21:00 - 22:00',
  '22:00 - 23:00',
  '23:00 - 00:00',
];

const normalizeSlotLabel = (slot: string) => slot.replace(/\s*[-\u2013\u2014]\s*/, ' - ').trim();

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const isFetchNetworkError = (error: unknown) =>
  error instanceof TypeError || (error instanceof Error && error.message.toLowerCase().includes('failed to fetch'));

const safeJsonArray = (value: unknown): string[] => {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed)
      ? parsed
        .map((item) => {
          if (typeof item === 'string') return normalizeSlotLabel(item);
          if (item && typeof item === 'object' && 'slot' in item) {
            return normalizeSlotLabel(String((item as any).slot || ''));
          }
          return '';
        })
        .filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

const safeOwnerBooked = (value: unknown): Array<{ slot: string; date: string; releaseAt: string }> => {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        slot: normalizeSlotLabel(String(item?.slot || '')),
        date: String(item?.date || '').trim(),
        releaseAt: String(item?.releaseAt || '').trim(),
      }))
      .filter((item) => item.slot && item.date && item.releaseAt);
  } catch {
    return [];
  }
};

const safeSlotStates = (value: unknown): Array<{ slot: string; state: string; releaseAt?: string }> => {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        slot: normalizeSlotLabel(String(item?.slot || '')),
        state: String(item?.state || '').toUpperCase(),
        releaseAt: item?.releaseAt ? String(item.releaseAt).trim() : undefined,
      }))
      .filter((item) => item.slot && ['OPEN', 'BOOKED', 'OWNER_BOOKED', 'BLOCKED'].includes(item.state));
  } catch {
    return [];
  }
};

const money = (value: number | string | undefined) => {
  const num = Number(value || 0);
  return `₹${Number.isFinite(num) ? num.toLocaleString() : '0'}`;
};

export default function TurfSlotManager() {
  const navigate = useNavigate();
  const { turfId } = useParams<{ turfId: string }>();

  const today = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turf, setTurf] = useState<any>(null);
  const [availability, setAvailability] = useState<{
    activeSlots: string[];
    blockedSlots: string[];
    bookedSlots: string[];
    ownerBookedSlots: Array<{ slot: string; date: string; releaseAt: string }>;
    slotStates: Array<{ slot: string; state: string; releaseAt?: string }>;
  }>({
    activeSlots: [],
    blockedSlots: [],
    bookedSlots: [],
    ownerBookedSlots: [],
    slotStates: [],
  });

  const authHeaders = useMemo(() => {
    const profileStr = localStorage.getItem('kicko_admin_profile');
    if (!profileStr) return {};

    try {
      const profile = JSON.parse(profileStr);
      return profile?.token ? { Authorization: `Bearer ${profile.token}` } : {};
    } catch {
      return {};
    }
  }, []);

  const fetchData = async () => {
    if (!turfId) return;

    setLoading(true);
    setError(null);

    try {
      const turfRes = await fetch(apiUrl(`/api/turfs/${turfId}`));

      if (!turfRes.ok) {
        throw new Error('Failed to load turf');
      }

      const turfData = await turfRes.json();
      turfData.activeSlots = safeJsonArray(turfData.activeSlots);
      turfData.blockedSlots = safeJsonArray(turfData.blockedSlots);
      turfData.ownerBookedSlots = safeOwnerBooked(turfData.ownerBookedSlots);
      setTurf(turfData);

      try {
        const availabilityRes = await fetch(apiUrl(`/api/turfs/${turfId}/availability?date=${selectedDate}`));

        if (availabilityRes.ok) {
          const av = await availabilityRes.json();
          setAvailability({
            activeSlots: safeJsonArray(av.activeSlots),
            blockedSlots: safeJsonArray(av.blockedSlots),
            bookedSlots: safeJsonArray(av.bookedSlots),
            ownerBookedSlots: safeOwnerBooked(av.ownerBookedSlots),
            slotStates: safeSlotStates(av.slotStates),
          });
        } else {
          console.warn('Availability request failed, using turf fallback data.');
          setAvailability({
            activeSlots: safeJsonArray(turfData.activeSlots),
            blockedSlots: safeJsonArray(turfData.blockedSlots),
            bookedSlots: [],
            ownerBookedSlots: safeOwnerBooked(turfData.ownerBookedSlots),
            slotStates: [],
          });
        }
      } catch (availabilityError) {
        console.warn('Availability fetch failed, using turf fallback data.', availabilityError);
        setAvailability({
          activeSlots: safeJsonArray(turfData.activeSlots),
          blockedSlots: safeJsonArray(turfData.blockedSlots),
          bookedSlots: [],
          ownerBookedSlots: safeOwnerBooked(turfData.ownerBookedSlots),
          slotStates: [],
        });
      }
    } catch (e: any) {
      if (isFetchNetworkError(e)) {
        setError('Unable to reach the backend. Please make sure the server is running on port 5000.');
        return;
      }

      setError(e?.message || 'Unable to load slot manager');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [turfId, selectedDate]);

  const approvedSlots = availability.activeSlots.length > 0 ? availability.activeSlots : SLOT_TIMES;
  const slotStateMap = new Map(
    (availability.slotStates || [])
      .map((item) => ({
        slot: normalizeSlotLabel(item.slot),
        state: String(item.state || '').toUpperCase(),
        releaseAt: item.releaseAt,
      }))
      .filter((item) => item.slot)
      .map((item) => [item.slot, item] as const)
  );
  const ownerBookedForDate = availability.ownerBookedSlots.filter((hold) => hold.date === selectedDate);
  const ownerBookedSet = new Set(ownerBookedForDate.map((hold) => normalizeSlotLabel(hold.slot)));
  const bookedCount = (availability.slotStates || []).filter((item) => String(item.state || '').toUpperCase() === 'BOOKED').length;
  const blockedCount = (availability.slotStates || []).filter((item) => String(item.state || '').toUpperCase() === 'BLOCKED').length;

  const getReleaseText = (slot: string) => {
    const hold = ownerBookedForDate.find((item) => item.slot === normalizeSlotLabel(slot));
    if (!hold?.releaseAt) return 'soon';
    const parsed = new Date(hold.releaseAt);
    if (Number.isNaN(parsed.getTime())) return 'soon';
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleOwnerBooked = async (slot: string) => {
    if (!turfId) return;
    const normalized = normalizeSlotLabel(slot);
    const currentState = slotStateMap.get(normalized)?.state;
    if (currentState === 'BLOCKED' || currentState === 'BOOKED') return;

    setSaving(true);
    setError(null);

    try {
      const isOpen = ownerBookedSet.has(normalized);
      const res = await fetch(apiUrl(`/api/turfs/${turfId}/owner-booked-slot`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          date: selectedDate,
          slot: normalized,
          status: isOpen ? 'OPEN' : 'BOOKED',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update slot');
      }

      setAvailability((prev) => ({
        ...prev,
        ownerBookedSlots: safeOwnerBooked(data.ownerBookedSlots || []),
      }));
    } catch (e: any) {
      if (isFetchNetworkError(e)) {
        console.warn('Owner booked slot update failed because the backend could not be reached.', e);
        return;
      }

      setError(e?.message || 'Failed to update slot');
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = async (slot: string) => {
    if (!turfId) return;
    const normalized = normalizeSlotLabel(slot);
    const currentState = slotStateMap.get(normalized)?.state;
    if (currentState === 'BOOKED' || currentState === 'OWNER_BOOKED') return;

    setSaving(true);
    setError(null);

    try {
      const isBlocked = slotStateMap.get(normalized)?.state === 'BLOCKED';
      const nextBlockedSlots = isBlocked
        ? availability.blockedSlots.filter((item) => normalizeSlotLabel(item) !== normalized)
        : [...availability.blockedSlots, normalized];

      const res = await fetch(apiUrl(`/api/turfs/${turfId}/blocked-slots`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          date: selectedDate,
          blockedSlots: Array.from(new Set(nextBlockedSlots.map(normalizeSlotLabel))),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update blocked slot');
      }

      setAvailability({
        activeSlots: safeJsonArray(data.activeSlots || availability.activeSlots),
        blockedSlots: safeJsonArray(data.blockedSlots || []),
        bookedSlots: safeJsonArray(data.bookedSlots || availability.bookedSlots),
        ownerBookedSlots: safeOwnerBooked(data.ownerBookedSlots || availability.ownerBookedSlots),
        slotStates: Array.isArray(data.slotStates) ? data.slotStates : availability.slotStates,
      });
    } catch (e: any) {
      if (isFetchNetworkError(e)) {
        console.warn('Blocked slot update failed because the backend could not be reached.', e);
        return;
      }

      setError(e?.message || 'Failed to update blocked slot');
    } finally {
      setSaving(false);
    }
  };

  const handleSlotClick = (event: MouseEvent<HTMLButtonElement>, slot: string) => {
    if (event.altKey || event.shiftKey) {
      void toggleBlocked(slot);
      return;
    }

    const normalized = normalizeSlotLabel(slot);
    if (slotStateMap.get(normalized)?.state === 'BLOCKED') {
      void toggleBlocked(slot);
      return;
    }

    void toggleOwnerBooked(slot);
  };

  const openCount = approvedSlots.filter((slot) => {
    const normalized = normalizeSlotLabel(slot);
    const state = slotStateMap.get(normalized)?.state;
    return state !== 'BLOCKED' && state !== 'BOOKED' && state !== 'OWNER_BOOKED';
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>

        <div className="bg-white rounded-[28px] shadow-[0_10px_30px_rgba(15,23,42,0.08)] border border-white/80 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-[0.18em] mb-4">
                <Shield className="w-3.5 h-3.5" />
                Seat control
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
                {turf?.name || 'Turf slot manager'}
              </h1>
              <p className="text-slate-500 mt-2 max-w-2xl">
                Tap a slot to mark it booked for an offline reservation. That hold will automatically reopen after the slot ends.
              </p>
              <div className="flex flex-wrap gap-3 mt-4 text-sm">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                  <CalendarDays className="w-4 h-4" />
                  {selectedDate}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {money(turf?.pricePerHour)}/hr
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[220px]">
              <Metric label="Open" value={String(openCount)} color="teal" />
              <Metric label="Owner booked" value={String(ownerBookedSet.size)} color="amber" />
              <Metric label="Booked" value={String(bookedCount)} color="slate" />
              <Metric label="Blocked" value={String(blockedCount)} color="rose" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-6">
          <div className="bg-white rounded-[28px] shadow-[0_10px_30px_rgba(15,23,42,0.08)] border border-white/80 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-slate-900">Approved slots</h2>
                <p className="text-sm text-slate-500">Tap a seat to book it offline, tap again to release it.</p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-teal-200"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading slots...
              </div>
            ) : (
              <>
                {error && (
                  <div className="rounded-3xl border border-rose-100 bg-rose-50 text-rose-700 p-4 mb-4">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {approvedSlots.map((slot) => {
                    const normalized = normalizeSlotLabel(slot);
                    const slotState = slotStateMap.get(normalized)?.state;
                    const isBlocked = slotState === 'BLOCKED';
                    const isBooked = slotState === 'BOOKED';
                    const isOwnerBooked = ownerBookedSet.has(normalized);

                    return (
                      <button
                        key={normalized}
                        type="button"
                        onClick={(event) => handleSlotClick(event, normalized)}
                        disabled={saving || isBooked}
                        title={isBlocked ? 'Click to unblock this date' : 'Click to mark booked. Hold Shift/Alt and click to block this date.'}
                        className={`rounded-2xl border p-4 text-left transition-all ${isBooked
                          ? 'bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed line-through'
                          : isOwnerBooked
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : isBlocked
                              ? 'bg-rose-50 border-rose-200 text-rose-700 cursor-not-allowed line-through'
                              : 'bg-teal-50/40 border-teal-100 text-slate-800 hover:border-teal-300 hover:-translate-y-0.5'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-sm">{normalized}</p>
                            <p className="mt-1 text-xs font-medium opacity-80">
                              {isBooked
                                ? 'Sold to customer'
                                : isOwnerBooked
                                  ? `Booked by owner until ${getReleaseText(normalized)}`
                                  : isBlocked
                                    ? 'Blocked by owner'
                                    : 'Available'}
                            </p>
                          </div>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isBooked
                            ? 'bg-slate-800 text-slate-500'
                            : isOwnerBooked
                              ? 'bg-amber-100 text-amber-700'
                              : isBlocked
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-white text-teal-600'
                            }`}>
                            {isBooked ? <CircleSlash2 className="w-4 h-4" /> : isOwnerBooked ? <Lock className="w-4 h-4" /> : isBlocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </div>
                        </div>

                        {!isBooked && !isBlocked && (
                          <div className="mt-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                            <span>{isOwnerBooked ? 'Release' : 'Mark booked'}</span>
                            <span>{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}</span>
                          </div>
                        )}
                        {isBlocked && (
                          <div className="mt-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                            <span>Unblock</span>
                            <span>{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <aside className="bg-white rounded-[28px] shadow-[0_10px_30px_rgba(15,23,42,0.08)] border border-white/80 p-6 sm:p-8 h-fit">
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">Legend</h2>
            <div className="space-y-3 text-sm">
              <LegendRow label="Available" description="Customer can book this slot" colorClass="bg-teal-500" />
              <LegendRow label="Owner booked" description="Offline hold that auto-opens after the slot ends" colorClass="bg-amber-500" />
              <LegendRow label="Blocked" description="Owner has manually blocked this slot" colorClass="bg-rose-500" />
              <LegendRow label="Booked" description="Already sold to a customer" colorClass="bg-slate-900" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'teal' | 'amber' | 'slate' | 'rose';
}) {
  const colors = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <div className={`rounded-2xl border p-3 ${colors[color]}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold opacity-80">{label}</p>
      <p className="text-xl font-serif font-bold mt-1">{value}</p>
    </div>
  );
}

function LegendRow({
  label,
  description,
  colorClass,
}: {
  label: string;
  description: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1 w-3 h-3 rounded-full ${colorClass}`} />
      <div>
        <p className="font-semibold text-slate-800">{label}</p>
        <p className="text-slate-500">{description}</p>
      </div>
    </div>
  );
}
