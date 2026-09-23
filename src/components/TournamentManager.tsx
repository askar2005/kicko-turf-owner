import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Calendar, MapPin, Users, DollarSign, Award, Edit3, Trash2, CheckCircle, Clock, Eye, AlertCircle, PlayCircle, StopCircle, RefreshCw } from 'lucide-react';
import AddEditTournamentModal, { TournamentData } from './AddEditTournamentModal';
import TournamentRegistrationsModal from './TournamentRegistrationsModal';

interface Turf {
  id: string;
  name: string;
  location?: string;
  city?: string;
}

export interface OwnerTournament {
  id: string;
  turfId: string;
  turf: Turf;
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
  _count?: {
    registrations: number;
  };
  createdAt: string;
}

export default function TournamentManager() {
  const [tournaments, setTournaments] = useState<OwnerTournament[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<TournamentData | null>(null);

  const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
  const [selectedTournamentForReg, setSelectedTournamentForReg] = useState<{ id: string; name: string } | null>(null);

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
      // Fetch turfs owned by this owner
      const turfsRes = await fetch('http://localhost:5000/api/turfs', { headers: getAuthHeaders() });
      if (turfsRes.ok) {
        const allTurfs: Turf[] = await turfsRes.json();
        // Filter turfs for this owner if endpoint returns all
        const myTurfs = allTurfs.filter((t: any) => t.ownerId === ownerId || !ownerId);
        setTurfs(myTurfs.length > 0 ? myTurfs : allTurfs);
      }

      // Fetch owner tournaments
      const tourRes = await fetch('http://localhost:5000/api/tournaments/owner', { headers: getAuthHeaders() });
      if (tourRes.ok) {
        const data = await tourRes.json();
        setTournaments(data);
      } else {
        const errData = await tourRes.json();
        setError(errData.error || 'Failed to fetch tournaments');
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
    setEditingTournament(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (t: OwnerTournament) => {
    setEditingTournament({
      id: t.id,
      turfId: t.turfId,
      name: t.name,
      sport: t.sport,
      description: t.description,
      bannerUrl: t.bannerUrl,
      tournamentType: t.tournamentType,
      registrationStartDate: t.registrationStartDate,
      registrationEndDate: t.registrationEndDate,
      startDate: t.startDate,
      endDate: t.endDate,
      matchStartTime: t.matchStartTime,
      reportingTime: t.reportingTime,
      maxTeams: t.maxTeams,
      minTeams: t.minTeams,
      playersPerTeam: t.playersPerTeam,
      substitutePlayers: t.substitutePlayers,
      registrationType: t.registrationType,
      registrationFee: t.registrationFee,
      paymentRequired: t.paymentRequired,
      firstPrize: t.firstPrize,
      secondPrize: t.secondPrize,
      thirdPrize: t.thirdPrize,
      mvpPrize: t.mvpPrize,
      otherPrizes: t.otherPrizes,
      rules: t.rules,
      contactName: t.contactName,
      contactPhone: t.contactPhone,
      whatsappNumber: t.whatsappNumber,
      contactEmail: t.contactEmail,
      status: t.status,
    });
    setIsFormModalOpen(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tournaments/${id}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tournaments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting tournament:', err);
    }
  };

  const handleViewRegistrations = (t: OwnerTournament) => {
    setSelectedTournamentForReg({ id: t.id, name: t.name });
    setIsRegistrationsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Registration Open':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
            <CheckCircle size={12} />
            <span>Registration Open</span>
          </span>
        );
      case 'Draft':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1">
            <Clock size={12} />
            <span>Draft</span>
          </span>
        );
      case 'Registration Closed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1">
            <StopCircle size={12} />
            <span>Registration Closed</span>
          </span>
        );
      case 'Ongoing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center space-x-1">
            <PlayCircle size={12} />
            <span>Ongoing</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center space-x-1">
            <Trophy size={12} />
            <span>Completed</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center space-x-1">
            <AlertCircle size={12} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Tournament Management</h1>
              <p className="text-xs text-slate-400">Create, publish, and manage sports tournaments for your turfs</p>
            </div>
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
            <span>Create Tournament</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tournaments</span>
          <div className="text-2xl font-bold text-white mt-1">{tournaments.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Registration Open</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {tournaments.filter((t) => t.status === 'Registration Open').length}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Registrations</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {tournaments.reduce((sum, t) => sum + (t._count?.registrations || 0), 0)}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {tournaments.filter((t) => t.status === 'Completed').length}
          </div>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading tournaments...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 flex items-center space-x-3 text-sm">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Trophy size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Tournaments Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Organize tournaments for your turf to attract teams, increase revenue, and engage local players!
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-colors inline-flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Create First Tournament</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((t) => {
            const regCount = t._count?.registrations || 0;
            const progressPct = Math.min(100, Math.round((regCount / t.maxTeams) * 100));

            return (
              <div
                key={t.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
              >
                {/* Tournament Card Header */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                          {t.sport}
                        </span>
                        <span className="text-xs text-slate-400">• {t.tournamentType}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight">{t.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                        <MapPin size={12} className="text-emerald-400" />
                        <span>{t.turf?.name || 'Turf Venue'}</span>
                      </p>
                    </div>
                    <div>{getStatusBadge(t.status)}</div>
                  </div>

                  {/* Dates & Entry Details */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5">
                      <span className="text-slate-400 font-medium block">Tournament Dates</span>
                      <span className="text-slate-200 font-bold block mt-0.5">
                        {t.startDate} - {t.endDate}
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5">
                      <span className="text-slate-400 font-medium block">Entry Fee</span>
                      <span className="text-emerald-400 font-bold block mt-0.5">
                        {t.registrationFee > 0 ? `₹${t.registrationFee.toLocaleString()} / Team` : 'FREE Entry'}
                      </span>
                    </div>
                  </div>

                  {/* Prize Details */}
                  {t.firstPrize && (
                    <div className="flex items-center space-x-2 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl px-3 py-2">
                      <Award size={14} className="shrink-0 text-amber-400" />
                      <span className="font-semibold truncate">1st Prize: {t.firstPrize}</span>
                    </div>
                  )}

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center space-x-1">
                        <Users size={12} className="text-emerald-400" />
                        <span>Registered Teams</span>
                      </span>
                      <span className="font-bold text-white">
                        {regCount} / {t.maxTeams} Teams ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => handleViewRegistrations(t)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Eye size={14} />
                    <span>View Teams ({regCount})</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {/* Status Toggle Quick Button */}
                    {t.status === 'Draft' ? (
                      <button
                        onClick={() => handleStatusChange(t.id, 'Registration Open')}
                        className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-bold transition-colors"
                        title="Publish Tournament"
                      >
                        Publish
                      </button>
                    ) : t.status === 'Registration Open' ? (
                      <button
                        onClick={() => handleStatusChange(t.id, 'Registration Closed')}
                        className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-bold transition-colors"
                        title="Close Registration"
                      >
                        Close Reg
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleEdit(t)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Tournament"
                    >
                      <Edit3 size={16} />
                    </button>

                    {t.status === 'Draft' && (
                      <button
                        onClick={() => handleDelete(t.id, t.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Tournament"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditTournamentModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchData}
        turfs={turfs}
        initialData={editingTournament}
      />

      {/* Registrations List Modal */}
      {selectedTournamentForReg && (
        <TournamentRegistrationsModal
          isOpen={isRegistrationsModalOpen}
          onClose={() => setIsRegistrationsModalOpen(false)}
          tournamentId={selectedTournamentForReg.id}
          tournamentName={selectedTournamentForReg.name}
        />
      )}
    </div>
  );
}
