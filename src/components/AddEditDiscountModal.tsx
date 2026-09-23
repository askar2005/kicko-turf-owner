import React, { useState, useEffect } from 'react';
import { X, Percent, Calendar, MapPin, Tag, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Turf {
  id: string;
  name: string;
  location?: string;
  activeSlots?: string;
}

export interface SlotDiscountData {
  id?: string;
  turfId: string;
  date: string;
  slot: string | string[];
  discountPercentage: number;
  label?: string;
  isActive: boolean;
}

interface AddEditDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  turfs: Turf[];
  initialData?: any | null;
}

const DEFAULT_SLOT_TIMES = [
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

export default function AddEditDiscountModal({
  isOpen,
  onClose,
  onSuccess,
  turfs,
  initialData,
}: AddEditDiscountModalProps) {
  const [selectedTurfId, setSelectedTurfId] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState<number>(20);
  const [label, setLabel] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setSelectedTurfId(initialData.turfId || '');
      setDate(initialData.date ? initialData.date.split('T')[0] : '');
      setSelectedSlots(Array.isArray(initialData.slot) ? initialData.slot : [initialData.slot]);
      setDiscountPercentage(initialData.discountPercentage || 20);
      setLabel(initialData.label || '');
      setIsActive(initialData.isActive !== undefined ? initialData.isActive : true);
    } else {
      setSelectedTurfId(turfs.length > 0 ? turfs[0].id : '');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setSelectedSlots([]);
      setDiscountPercentage(20);
      setLabel('');
      setIsActive(true);
    }
    setError(null);
  }, [initialData, isOpen, turfs]);

  if (!isOpen) return null;

  const getAuthHeaders = () => {
    const profileStr = localStorage.getItem('kicko_admin_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        if (profile && profile.token) {
          return { Authorization: `Bearer ${profile.token}`, 'Content-Type': 'application/json' };
        }
      } catch (e) { }
    }
    return { 'Content-Type': 'application/json' };
  };

  const getAvailableSlotsForSelectedTurf = (): string[] => {
    const selectedTurf = turfs.find((t) => t.id === selectedTurfId);
    if (selectedTurf && selectedTurf.activeSlots) {
      try {
        const parsed = JSON.parse(selectedTurf.activeSlots);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_SLOT_TIMES;
  };

  const toggleSlotSelection = (slotStr: string) => {
    if (initialData) {
      // Editing single slot discount
      setSelectedSlots([slotStr]);
    } else {
      // Multi-slot selection
      if (selectedSlots.includes(slotStr)) {
        setSelectedSlots(selectedSlots.filter((s) => s !== slotStr));
      } else {
        setSelectedSlots([...selectedSlots, slotStr]);
      }
    }
  };

  const selectAllSlots = () => {
    const available = getAvailableSlotsForSelectedTurf();
    if (selectedSlots.length === available.length) {
      setSelectedSlots([]);
    } else {
      setSelectedSlots(available);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedTurfId) {
        throw new Error('Please select a turf venue');
      }
      if (!date) {
        throw new Error('Please select a date');
      }
      if (selectedSlots.length === 0) {
        throw new Error('Please select at least one time slot');
      }
      if (discountPercentage < 1 || discountPercentage > 100) {
        throw new Error('Discount percentage must be between 1% and 100%');
      }

      const isEdit = Boolean(initialData && initialData.id);
      const url = isEdit
        ? `http://localhost:5000/api/slot-discounts/${initialData.id}`
        : 'http://localhost:5000/api/slot-discounts';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit
        ? {
            discountPercentage,
            label: label.trim(),
            isActive,
            date,
            slot: selectedSlots[0],
          }
        : {
            turfId: selectedTurfId,
            date,
            slots: selectedSlots,
            discountPercentage,
            label: label.trim(),
            isActive,
          };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save slot discount');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = getAvailableSlotsForSelectedTurf();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Percent size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {initialData ? 'Edit Slot Discount' : 'Create Slot Discount'}
              </h2>
              <p className="text-xs text-slate-400">Configure percentage discount for specific slots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Turf & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Turf Venue *</label>
              <select
                value={selectedTurfId}
                onChange={(e) => setSelectedTurfId(e.target.value)}
                disabled={Boolean(initialData)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                required
              >
                <option value="" disabled>-- Select Turf --</option>
                {turfs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Discount Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Discount Percentage & Label */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Discount Percentage (1% - 100%) *
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value) || 1)}
                  className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  required
                />
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Offer Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Early Bird, Weekend Special"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Discount Status</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={isActive}
                  onChange={() => setIsActive(true)}
                  className="accent-emerald-500"
                />
                <span className="text-sm text-emerald-400 font-semibold">Active</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={!isActive}
                  onChange={() => setIsActive(false)}
                  className="accent-slate-500"
                />
                <span className="text-sm text-slate-400 font-semibold">Inactive (Paused)</span>
              </label>
            </div>
          </div>

          {/* Slots Multi-Selection Grid */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock size={14} />
                <span>Select Time Slots * ({selectedSlots.length} Selected)</span>
              </label>
              {!initialData && (
                <button
                  type="button"
                  onClick={selectAllSlots}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  {selectedSlots.length === availableSlots.length ? 'Deselect All' : 'Select All Slots'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              {availableSlots.map((slotStr) => {
                const isSelected = selectedSlots.includes(slotStr);
                return (
                  <button
                    type="button"
                    key={slotStr}
                    onClick={() => toggleSlotSelection(slotStr)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{slotStr}</span>
                    {isSelected && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>{initialData ? 'Update Discount' : 'Save Slot Discount'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
