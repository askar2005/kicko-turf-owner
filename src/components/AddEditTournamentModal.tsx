import React, { useState, useEffect } from 'react';
import { X, Trophy, Calendar, MapPin, Users, DollarSign, Award, FileText, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface Turf {
  id: string;
  name: string;
  location?: string;
  city?: string;
}

export interface TournamentData {
  id?: string;
  turfId: string;
  name: string;
  sport: string;
  description?: string;
  bannerUrl?: string;
  tournamentType: string;
  registrationStartDate: string;
  registrationEndDate: string;
  startDate: string;
  endDate: string;
  matchStartTime?: string;
  reportingTime?: string;
  maxTeams: number;
  minTeams: number;
  playersPerTeam: number;
  substitutePlayers: number;
  registrationType: string;
  registrationFee: number;
  paymentRequired: boolean;
  firstPrize?: string;
  secondPrize?: string;
  thirdPrize?: string;
  mvpPrize?: string;
  otherPrizes?: string;
  rules?: string;
  contactName: string;
  contactPhone: string;
  whatsappNumber?: string;
  contactEmail?: string;
  status: string;
}

interface AddEditTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  turfs: Turf[];
  initialData?: TournamentData | null;
}

export default function AddEditTournamentModal({
  isOpen,
  onClose,
  onSuccess,
  turfs,
  initialData,
}: AddEditTournamentModalProps) {
  const [formData, setFormData] = useState<Partial<TournamentData>>({
    turfId: '',
    name: '',
    sport: 'Football',
    description: '',
    bannerUrl: '',
    tournamentType: 'Knockout',
    registrationStartDate: '',
    registrationEndDate: '',
    startDate: '',
    endDate: '',
    matchStartTime: '09:00',
    reportingTime: '08:30',
    maxTeams: 16,
    minTeams: 4,
    playersPerTeam: 7,
    substitutePlayers: 3,
    registrationType: 'Team Registration',
    registrationFee: 1000,
    paymentRequired: true,
    firstPrize: '',
    secondPrize: '',
    thirdPrize: '',
    mvpPrize: '',
    otherPrizes: '',
    rules: '',
    contactName: '',
    contactPhone: '',
    whatsappNumber: '',
    contactEmail: '',
    status: 'Draft',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        registrationStartDate: initialData.registrationStartDate ? initialData.registrationStartDate.split('T')[0] : '',
        registrationEndDate: initialData.registrationEndDate ? initialData.registrationEndDate.split('T')[0] : '',
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
      });
    } else {
      setFormData({
        turfId: turfs.length > 0 ? turfs[0].id : '',
        name: '',
        sport: 'Football',
        description: '',
        bannerUrl: '',
        tournamentType: 'Knockout',
        registrationStartDate: new Date().toISOString().split('T')[0],
        registrationEndDate: '',
        startDate: '',
        endDate: '',
        matchStartTime: '09:00',
        reportingTime: '08:30',
        maxTeams: 16,
        minTeams: 4,
        playersPerTeam: 7,
        substitutePlayers: 3,
        registrationType: 'Team Registration',
        registrationFee: 1000,
        paymentRequired: true,
        firstPrize: '',
        secondPrize: '',
        thirdPrize: '',
        mvpPrize: '',
        otherPrizes: '',
        rules: '',
        contactName: '',
        contactPhone: '',
        whatsappNumber: '',
        contactEmail: '',
        status: 'Draft',
      });
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

  const handleChange = (field: keyof TournamentData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.turfId) {
        throw new Error('Please select a turf venue');
      }
      if (!formData.name?.trim()) {
        throw new Error('Tournament Name is required');
      }
      if (!formData.registrationStartDate || !formData.registrationEndDate) {
        throw new Error('Registration Start & End dates are required');
      }
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Tournament Start & End dates are required');
      }
      if (!formData.contactName?.trim() || !formData.contactPhone?.trim()) {
        throw new Error('Contact Name and Phone are required');
      }

      const isEdit = Boolean(initialData && initialData.id);
      const url = isEdit
        ? `http://localhost:5000/api/tournaments/${initialData!.id}`
        : 'http://localhost:5000/api/tournaments';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save tournament');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {initialData ? 'Edit Tournament' : 'Create New Tournament'}
              </h2>
              <p className="text-xs text-slate-400">Setup and publish a tournament for your turf</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <Trophy size={16} />
              <span>Basic Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Turf Venue *</label>
                <select
                  value={formData.turfId}
                  onChange={(e) => handleChange('turfId', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="" disabled>-- Select Turf --</option>
                  {turfs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.location ? `(${t.location})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tournament Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Kicko Premier League 2026"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sport *</label>
                <select
                  value={formData.sport || 'Football'}
                  onChange={(e) => handleChange('sport', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Football">⚽ Football</option>
                  <option value="Cricket">🏏 Cricket</option>
                  <option value="Badminton">🏸 Badminton</option>
                  <option value="Volleyball">🏐 Volleyball</option>
                  <option value="Basketball">🏀 Basketball</option>
                  <option value="Tennis">🎾 Tennis</option>
                  <option value="Other">🏆 Other Sport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tournament Type</label>
                <select
                  value={formData.tournamentType || 'Knockout'}
                  onChange={(e) => handleChange('tournamentType', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Knockout">Knockout</option>
                  <option value="League">League</option>
                  <option value="League + Knockout">League + Knockout</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Banner Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.bannerUrl || ''}
                  onChange={(e) => handleChange('bannerUrl', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of the tournament, format, highlights..."
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DATES & TIME */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <Calendar size={16} />
              <span>Dates & Timings</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Registration Start Date *</label>
                <input
                  type="date"
                  value={formData.registrationStartDate || ''}
                  onChange={(e) => handleChange('registrationStartDate', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Registration End Date *</label>
                <input
                  type="date"
                  value={formData.registrationEndDate || ''}
                  onChange={(e) => handleChange('registrationEndDate', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tournament Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tournament End Date *</label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Match Start Time</label>
                <input
                  type="time"
                  value={formData.matchStartTime || '09:00'}
                  onChange={(e) => handleChange('matchStartTime', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reporting Time</label>
                <input
                  type="time"
                  value={formData.reportingTime || '08:30'}
                  onChange={(e) => handleChange('reportingTime', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: TEAM & PARTICIPANTS */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <Users size={16} />
              <span>Team & Participant Rules</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Max Teams / Entries *</label>
                <input
                  type="number"
                  min={2}
                  max={128}
                  value={formData.maxTeams || 16}
                  onChange={(e) => handleChange('maxTeams', parseInt(e.target.value) || 2)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Players Per Team *</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={formData.playersPerTeam || 7}
                  onChange={(e) => handleChange('playersPerTeam', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Substitute Players</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={formData.substitutePlayers ?? 3}
                  onChange={(e) => handleChange('substitutePlayers', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Registration Type</label>
                <select
                  value={formData.registrationType || 'Team Registration'}
                  onChange={(e) => handleChange('registrationType', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Team Registration">Team Registration</option>
                  <option value="Individual Registration">Individual Registration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status || 'Draft'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Draft" className="text-white">Draft (Hidden from users)</option>
                  <option value="Registration Open" className="text-white">Registration Open (Live)</option>
                  <option value="Registration Closed" className="text-white">Registration Closed</option>
                  <option value="Ongoing" className="text-white">Ongoing</option>
                  <option value="Completed" className="text-white">Completed</option>
                  <option value="Cancelled" className="text-white">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: ENTRY FEE & PAYMENT */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <DollarSign size={16} />
              <span>Registration Fee</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Registration Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.registrationFee ?? 0}
                  onChange={(e) => handleChange('registrationFee', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Required?</label>
                <select
                  value={formData.paymentRequired ? 'true' : 'false'}
                  onChange={(e) => handleChange('paymentRequired', e.target.value === 'true')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="true">Yes (Online Payment via Razorpay)</option>
                  <option value="false">No (Free Registration)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5: PRIZES */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <Award size={16} />
              <span>Prize Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">1st Prize / Champions</label>
                <input
                  type="text"
                  placeholder="e.g. ₹25,000 + Trophy & Medals"
                  value={formData.firstPrize || ''}
                  onChange={(e) => handleChange('firstPrize', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">2nd Prize / Runners-up</label>
                <input
                  type="text"
                  placeholder="e.g. ₹10,000 + Trophy"
                  value={formData.secondPrize || ''}
                  onChange={(e) => handleChange('secondPrize', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">3rd Prize (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ₹5,000"
                  value={formData.thirdPrize || ''}
                  onChange={(e) => handleChange('thirdPrize', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">MVP / Player of the Tournament</label>
                <input
                  type="text"
                  placeholder="e.g. ₹2,000 + Trophy"
                  value={formData.mvpPrize || ''}
                  onChange={(e) => handleChange('mvpPrize', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: RULES */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <FileText size={16} />
              <span>Tournament Rules & Guidelines</span>
            </h3>
            <div>
              <textarea
                rows={4}
                placeholder="List rules (e.g., 20 mins per half, yellow/red card policy, age restrictions, shoe requirements)..."
                value={formData.rules || ''}
                onChange={(e) => handleChange('rules', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* SECTION 7: CONTACT */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <Phone size={16} />
              <span>Organizers Contact Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={formData.contactName || ''}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={formData.contactPhone || ''}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={formData.whatsappNumber || ''}
                  onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contact Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. tournament@kicko.com"
                  value={formData.contactEmail || ''}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
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
                <span>{initialData ? 'Update Tournament' : 'Create Tournament'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
