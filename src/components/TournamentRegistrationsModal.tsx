import React, { useState, useEffect } from 'react';
import { X, Users, Search, CheckCircle, XCircle, Clock, DollarSign, Shield, Phone, Mail, Award } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  registrationId: string;
  teamName?: string;
  captainName: string;
  captainPhone: string;
  captainEmail?: string;
  players: string; // JSON
  substitutes?: string; // JSON
  registrationStatus: string;
  paymentStatus: string;
  amount: number;
  paymentOrderId?: string;
  paymentId?: string;
  createdAt: string;
  user?: User;
}

interface TournamentRegistrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentName: string;
}

export default function TournamentRegistrationsModal({
  isOpen,
  onClose,
  tournamentId,
  tournamentName,
}: TournamentRegistrationsModalProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const fetchRegistrations = async () => {
    if (!tournamentId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/registrations`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (err) {
      console.error('Error loading registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tournamentId) {
      fetchRegistrations();
    }
  }, [isOpen, tournamentId]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (regId: string, status: string) => {
    setUpdatingId(regId);
    try {
      const res = await fetch(`http://localhost:5000/api/tournaments/registrations/${regId}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrationStatus: status }),
      });
      if (res.ok) {
        fetchRegistrations();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const parseJsonArray = (jsonStr?: string): string[] => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const term = search.toLowerCase();
    const team = (reg.teamName || '').toLowerCase();
    const capt = (reg.captainName || '').toLowerCase();
    const code = (reg.registrationId || '').toLowerCase();
    return team.includes(term) || capt.includes(term) || code.includes(term);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Registered Teams / Participants</h2>
              <p className="text-xs text-slate-400">{tournamentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search team, captain, or Reg ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Total Registrations: <span className="text-emerald-400 font-bold">{registrations.length}</span>
          </div>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading registrations...</div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No registrations found.</div>
          ) : (
            filteredRegistrations.map((reg) => {
              const playersList = parseJsonArray(reg.players);
              const subsList = parseJsonArray(reg.substitutes);
              const isExpanded = expandedRegId === reg.id;

              return (
                <div
                  key={reg.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-base font-bold text-white">
                          {reg.teamName ? `🛡️ ${reg.teamName}` : `👤 ${reg.captainName}`}
                        </span>
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                          {reg.registrationId}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Phone size={12} className="text-emerald-400" />
                          <span>Capt: {reg.captainName} ({reg.captainPhone})</span>
                        </span>
                        {reg.captainEmail && (
                          <span className="flex items-center space-x-1">
                            <Mail size={12} className="text-emerald-400" />
                            <span>{reg.captainEmail}</span>
                          </span>
                        )}
                        <span>{new Date(reg.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Payment Status Badge */}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 border ${
                          reg.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : reg.paymentStatus === 'FREE'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        <DollarSign size={12} />
                        <span>{reg.paymentStatus}</span>
                      </span>

                      {/* Registration Status Badge */}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 border ${
                          reg.registrationStatus === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : reg.registrationStatus === 'REJECTED'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {reg.registrationStatus === 'CONFIRMED' ? (
                          <CheckCircle size={12} />
                        ) : reg.registrationStatus === 'REJECTED' ? (
                          <XCircle size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span>{reg.registrationStatus}</span>
                      </span>

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedRegId(isExpanded ? null : reg.id)}
                        className="text-xs text-slate-400 hover:text-white underline font-medium px-2 py-1"
                      >
                        {isExpanded ? 'Hide Roster' : 'View Roster'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Roster & Actions */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                          Squad Roster ({playersList.length} Players)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {playersList.map((p, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                            >
                              <span className="text-emerald-400 font-bold mr-1">#{idx + 1}</span> {p}
                            </div>
                          ))}
                        </div>
                      </div>

                      {subsList.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                            Substitutes ({subsList.length})
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {subsList.map((s, idx) => (
                              <div
                                key={idx}
                                className="text-xs bg-slate-900/60 border border-slate-800/60 rounded-lg px-3 py-1.5 text-slate-400"
                              >
                                {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status Action Buttons */}
                      <div className="flex items-center justify-end space-x-2 pt-2">
                        {reg.registrationStatus !== 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'CONFIRMED')}
                            disabled={updatingId === reg.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold transition-colors"
                          >
                            Approve Registration
                          </button>
                        )}
                        {reg.registrationStatus !== 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'REJECTED')}
                            disabled={updatingId === reg.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-semibold transition-colors"
                          >
                            Reject Registration
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
