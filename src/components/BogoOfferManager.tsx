import React, { useState, useEffect } from 'react';
import { Tag, Calendar, Plus, CheckCircle, XCircle, Trash2, Edit3, Power, AlertCircle } from 'lucide-react';

interface Turf {
  id: string;
  name: string;
  location?: string;
}

interface BOGOOffer {
  id: string;
  turfId: string;
  turfName: string;
  offerDate: string;
  offerType: string;
  isActive: boolean;
  createdAt: string;
}

export default function BogoOfferManager() {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [offers, setOffers] = useState<BOGOOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTurfId, setSelectedTurfId] = useState<string>('');
  const [offerDate, setOfferDate] = useState<string>('');
  const [offerType, setOfferType] = useState<string>('BUY_1_GET_1');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [editingOffer, setEditingOffer] = useState<BOGOOffer | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState(true);

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
    const ownerId = getOwnerId();
    if (!ownerId) return;

    setLoading(true);
    try {
      // 1. Fetch Owner's Turfs
      const turfsRes = await fetch(`http://localhost:5000/api/turfs?ownerId=${ownerId}`, {
        headers: getAuthHeaders()
      });
      if (turfsRes.ok) {
        const turfsData = await turfsRes.json();
        setTurfs(turfsData);
        if (turfsData.length > 0 && !selectedTurfId) {
          setSelectedTurfId(turfsData[0].id);
        }
      }

      // 2. Fetch Owner's BOGO Offers
      const offersRes = await fetch(`http://localhost:5000/api/bogo-offers/owner`, {
        headers: getAuthHeaders()
      });
      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setOffers(offersData);
      }
    } catch (e) {
      console.error('Failed to load BOGO offer data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedTurfId) {
      setMessage({ type: 'error', text: 'Please select a turf' });
      return;
    }

    if (!offerDate) {
      setMessage({ type: 'error', text: 'Please select an offer date' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/bogo-offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          turfId: selectedTurfId,
          offerDate,
          offerType,
          isActive
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Buy 1 Get 1 Offer created successfully for ${offerDate}!` });
        setOfferDate('');
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create BOGO offer' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (offer: BOGOOffer) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bogo-offers/${offer.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ isActive: !offer.isActive })
      });

      if (res.ok) {
        setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: !o.isActive } : o));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to toggle status');
      }
    } catch (e) {
      alert('Error connecting to server');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this BOGO offer?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/bogo-offers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        setOffers(prev => prev.filter(o => o.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete offer');
      }
    } catch (e) {
      alert('Error connecting to server');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;

    try {
      const res = await fetch(`http://localhost:5000/api/bogo-offers/${editingOffer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          offerDate: editDate,
          isActive: editStatus
        })
      });

      if (res.ok) {
        alert('BOGO Offer updated successfully!');
        setEditingOffer(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update offer');
      }
    } catch (e) {
      alert('Error connecting to server');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
          <Tag className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">Buy 1 Get 1 Slot Offers</h2>
          <p className="text-sm text-slate-500 font-medium">Create and manage date-specific BOGO promotions for your turfs</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl mb-6 border flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* CREATE OFFER FORM */}
      <form onSubmit={handleCreateOffer} className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 mb-8 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Create Buy 1 Get 1 Offer</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Turf Selection */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Select Turf</label>
            <select
              value={selectedTurfId}
              onChange={(e) => setSelectedTurfId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-200 shadow-sm"
              required
            >
              {turfs.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Offer Type */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Offer Type</label>
            <input
              type="text"
              value="Buy 1 Get 1 Slot"
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600 shadow-sm cursor-not-allowed"
            />
          </div>

          {/* Offer Date */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Offer Date</label>
            <input
              type="date"
              value={offerDate}
              onChange={(e) => setOfferDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-200 shadow-sm"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
            />
            <span>Active immediately upon creation</span>
          </label>

          <button
            type="submit"
            disabled={submitting || turfs.length === 0}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Creating...' : 'Create Offer'}
          </button>
        </div>
      </form>

      {/* OFFERS LIST */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Active & Saved Offers ({offers.length})</h3>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm font-medium">Loading BOGO offers...</div>
        ) : offers.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-sm">
            No Buy 1 Get 1 offers created yet. Create your first date offer above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-3">Turf</th>
                  <th className="py-3 px-3">Offer Date</th>
                  <th className="py-3 px-3">Offer Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map(offer => (
                  <tr key={offer.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-3 font-bold text-slate-800">{offer.turfName}</td>
                    <td className="py-4 px-3 font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        <span>{offer.offerDate}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-100">
                        🎉 Buy 1 Get 1
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(offer)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${offer.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${offer.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {offer.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOffer(offer);
                            setEditDate(offer.offerDate);
                            setEditStatus(offer.isActive);
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                          title="Edit Offer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete Offer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-lg font-serif font-bold text-slate-800 mb-4">Edit BOGO Offer</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Turf</label>
                <input type="text" value={editingOffer.turfName} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-semibold" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Offer Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-200"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editStatus"
                  checked={editStatus}
                  onChange={(e) => setEditStatus(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <label htmlFor="editStatus" className="text-sm font-semibold text-slate-700 cursor-pointer">Active Offer</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOffer(null)}
                  className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
