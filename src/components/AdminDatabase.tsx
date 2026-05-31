import { useMemo, useState } from "react";
import { Search, Calendar, ArrowUpRight, X } from "lucide-react";

interface AdminDatabaseProps {
  bookings: any[];
}

interface Row {
  id: string;
  date: string;
  user: string;
  turf: string;
  slot: string;
  amount: number;
  status: string;
}

export default function AdminDatabase({ bookings }: AdminDatabaseProps) {
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => {
    return bookings.map((b, idx) => ({
      id: b.id || `BKG-${String(idx + 1).padStart(4, '0')}`,
      date: (() => {
        try {
          return new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return b.date; }
      })(),
      user: b.userName || b.user || "Unknown User",
      turf: b.turf || "Unknown Turf",
      slot: b.slot || "N/A",
      amount: Number(b.amount) || 0,
      status: b.status || "Confirmed",
    }));
  }, [bookings]);

  const filteredRows = rows.filter(r =>
    r.user.toLowerCase().includes(search.toLowerCase()) ||
    r.turf.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col rounded-b-xl -mx-6 -mb-6">
      {/* Utility Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 pb-6 border-b border-slate-100/60">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user or turf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50/50">
            <tr className="text-slate-500 border-b border-slate-100/60 uppercase text-[11px] tracking-wider font-semibold">
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Turf Booked</th>
              <th className="px-6 py-4">Payment (₹)</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/50">
            {filteredRows.map((r, idx) => {
              const initial = r.user.charAt(0).toUpperCase();
              return (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700">{r.date}</span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {r.slot}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] tracking-widest font-bold bg-teal-100 text-teal-600">
                        {initial}
                      </div>
                      <span className="font-medium text-slate-700">{r.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100/60">
                      {r.turf}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700">
                      ₹{r.amount.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${r.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' : r.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'Cancelled' ? 'bg-rose-500' : r.status === 'Pending' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(r);
                      }}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 bg-slate-50/30">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-8 h-8 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-500 text-sm">No booking records found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100/60 rounded-b-3xl text-xs text-slate-500 font-medium">
        <span>Showing {filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'}</span>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 font-sans">
          <div className="bg-white/95 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-white/60 w-full max-w-md relative overflow-hidden">
            <div className="px-6 sm:px-8 py-5 flex items-center justify-between z-10 border-b border-slate-100/60 bg-white/80 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-serif font-bold text-slate-800">Booking Details</h2>
                <p className="text-xs text-slate-500 mt-1">ID: {selectedBooking.id}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2.5 hover:bg-rose-50 rounded-full transition-colors text-slate-400 hover:text-rose-500 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:px-8 sm:py-6 space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm tracking-widest font-bold bg-teal-100 text-teal-600">
                  {selectedBooking.user.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{selectedBooking.user}</p>
                  <p className="text-xs text-slate-500 font-medium">Customer</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                  <span className="text-sm text-slate-500 font-medium">Turf Booked</span>
                  <span className="text-sm font-semibold text-slate-800">{selectedBooking.turf}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                  <span className="text-sm text-slate-500 font-medium">Date</span>
                  <span className="text-sm font-semibold text-slate-800">{selectedBooking.date}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                  <span className="text-sm text-slate-500 font-medium">Time Slot</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {selectedBooking.slot}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                  <span className="text-sm text-slate-500 font-medium">Payment</span>
                  <span className="text-sm font-bold text-slate-800">₹{selectedBooking.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-500 font-medium">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${selectedBooking.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' : selectedBooking.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedBooking.status === 'Cancelled' ? 'bg-rose-500' : selectedBooking.status === 'Pending' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:px-8 border-t border-slate-100/60 bg-slate-50/50">
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3 rounded-full border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
