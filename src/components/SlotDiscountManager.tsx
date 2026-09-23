import React, { useState, useEffect } from 'react';
import { Percent, Plus, Calendar, MapPin, Tag, CheckCircle, Clock, Edit3, Trash2, Power, AlertCircle, RefreshCw, Search } from 'lucide-react';
import AddEditDiscountModal, { SlotDiscountData } from './AddEditDiscountModal';

interface Turf {
  id: string;
  name: string;
  location?: string;
  activeSlots?: string;
}

export interface SlotDiscount {
  id: string;
  turfId: string;
  turf: Turf;
  date: string;
  slot: string;
  discountPercentage: number;
  label?: string;
  isActive: boolean;
  createdAt: string;
}

export default function SlotDiscountManager() {
  const [discounts, setDiscounts] = useState<SlotDiscount[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedTurfFilter, setSelectedTurfFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<SlotDiscountData | null>(null);

  const getAuthHeaders = () => {
    const profileStr = localStorage.getItem('kicko_admin_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        if (profile && profile.token) {
          return { Authorization: `Bearer ${profile.token}` };
        }
      } catch (e) { }
    }
    return {};
  };

  const getOwnerId = () => {
    const profileStr = localStorage.getItem('kicko_admin_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        return profile.id || '';
      } catch (e) { }
    }
    return '';
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ownerId = getOwnerId();
      // Fetch turfs
      const turfsRes = await fetch('http://localhost:5000/api/turfs', { headers: getAuthHeaders() });
      if (turfsRes.ok) {
        const allTurfs: Turf[] = await turfsRes.json();
        const myTurfs = allTurfs.filter((t: any) => t.ownerId === ownerId || !ownerId);
        setTurfs(myTurfs.length > 0 ? myTurfs : allTurfs);
      }

      // Fetch owner slot discounts
      const discRes = await fetch('http://localhost:5000/api/slot-discounts/owner', { headers: getAuthHeaders() });
      if (discRes.ok) {
        const data = await discRes.json();
        setDiscounts(data);
      } else {
        const errData = await discRes.json();
        setError(errData.error || 'Failed to fetch slot discounts');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNew = () => {
    setEditingDiscount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (d: SlotDiscount) => {
    setEditingDiscount({
      id: d.id,
      turfId: d.turfId,
      date: d.date,
      slot: d.slot,
      discountPercentage: d.discountPercentage,
      label: d.label,
      isActive: d.isActive,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:5000/api/slot-discounts/${id}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this slot discount?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/slot-discounts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting discount:', err);
    }
  };

  const filteredDiscounts = discounts.filter((d) => {
    const matchesTurf = !selectedTurfFilter || d.turfId === selectedTurfFilter;
    const term = search.toLowerCase();
    const turfName = (d.turf?.name || '').toLowerCase();
    const dateStr = d.date.toLowerCase();
    const slotStr = d.slot.toLowerCase();
    const labelStr = (d.label || '').toLowerCase();
    const matchesSearch =
      turfName.includes(term) || dateStr.includes(term) || slotStr.includes(term) || labelStr.includes(term);
    return matchesTurf && matchesSearch;
  });

  const maxPct = discounts.length > 0 ? Math.max(...discounts.map((d) => d.discountPercentage)) : 0;
  const activeCount = discounts.filter((d) => d.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Percent size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Slot Discount Management</h2>
            <p className="text-xs text-slate-400">Create date- & slot-specific percentage discounts for your turfs</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleCreateNew}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-colors flex items-center space-x-2 shadow-lg shadow-emerald-500/10"
          >
            <Plus size={18} />
            <span>Create Discount</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Slot Discounts</span>
          <div className="text-2xl font-bold text-white mt-1">{discounts.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Deals</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Highest Discount %</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{maxPct}% OFF</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search date, slot, label..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedTurfFilter}
            onChange={(e) => setSelectedTurfFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Turfs</option>
            {turfs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading slot discounts...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 flex items-center space-x-3 text-sm">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Percent size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Slot Discounts Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Offer percentage discounts on specific dates and times to attract more bookings!
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-colors inline-flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Create First Discount</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Turf Venue</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Slot</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Label</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDiscounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">{d.turf?.name || 'Turf Venue'}</td>
                    <td className="py-4 px-4 text-slate-300 font-medium">
                      <span className="flex items-center space-x-1.5">
                        <Calendar size={13} className="text-emerald-400" />
                        <span>{d.date}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-emerald-400 font-mono font-bold">
                        {d.slot}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-xs">
                        {d.discountPercentage}% OFF
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 italic">
                      {d.label ? (
                        <span className="flex items-center space-x-1 text-slate-300">
                          <Tag size={12} className="text-emerald-400" />
                          <span>{d.label}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(d.id, d.isActive)}
                        className={`px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 border text-xs transition-colors ${
                          d.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <Power size={12} />
                        <span>{d.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(d)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Discount"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Discount"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditDiscountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        turfs={turfs}
        initialData={editingDiscount}
      />
    </div>
  );
}
