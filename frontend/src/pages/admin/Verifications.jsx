import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import UserAvatar from '../../components/UserAvatar';
import {
  ShieldCheck, ShieldX, Clock, Filter, RefreshCw,
  ArrowLeft, FileText, Store, Truck, AlertTriangle, CheckCircle2, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'pending',  label: 'Pending',  icon: Clock,        color: 'text-yellow-400' },
  { key: 'verified', label: 'Verified', icon: ShieldCheck,  color: 'text-green-400' },
  { key: 'rejected', label: 'Rejected', icon: ShieldX,      color: 'text-red-400' },
  { key: 'all',      label: 'All',      icon: Filter,       color: 'text-blue-400' },
];

const TYPE_TABS = [
  { key: 'all',    label: 'All' },
  { key: 'seller', label: 'Sellers' },
  { key: 'rider',  label: 'Riders' },
];

export default function AdminVerifications() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusTab, setStatusTab] = useState('pending');
  const [typeTab, setTypeTab]     = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);   // { id, kind }
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { fetch(); }, [statusTab, typeTab]);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/verifications?status=${statusTab}&type=${typeTab}`);
      setItems(data.data || []);
    } catch {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const act = async (id, kind, action, reason = '') => {
    setActionLoading(id + action);
    try {
      const { data } = await api.post(`/admin/verifications/${kind}/${id}/action`, { action, reason });
      toast.success(data.message);
      setRejectModal(null);
      setRejectReason('');
      fetch();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h2 className="text-white font-serif text-xl mb-2">Reject Verification</h2>
            <p className="text-gray-400 text-sm mb-4">Provide a reason so the applicant knows what to fix.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Document is blurry / expired / doesn't match registration name…"
              rows={4}
              className="input-field w-full resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 btn-outline py-2 text-sm">Cancel</button>
              <button
                onClick={() => act(rejectModal.id, rejectModal.kind, 'reject', rejectReason)}
                disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition disabled:opacity-50">
                <ShieldX className="w-4 h-4" />
                {actionLoading ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-white">Verifications</h1>
            <p className="text-sm text-gray-400">Review seller business permits &amp; rider driving licenses</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/dashboard" className="flex items-center gap-2 btn-outline py-2 px-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <button onClick={fetch} className="flex items-center gap-2 btn-outline py-2 px-4 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Type + Status tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {TYPE_TABS.map(t => (
            <button key={t.key} onClick={() => setTypeTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                typeTab === t.key
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                  : 'bg-navy-950/50 border-white/10 text-gray-400 hover:text-white'
              }`}>{t.label}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setStatusTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${
                  statusTab === tab.key
                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                    : 'bg-navy-950/50 border-white/10 text-gray-400 hover:text-white'
                }`}>
                <Icon className={`w-4 h-4 ${statusTab === tab.key ? 'text-primary-400' : tab.color}`} />
                {tab.label}
                {tab.key === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 bg-yellow-500 text-navy-950 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-navy-900/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-green-400 opacity-40" />
          <p className="text-xl text-gray-300">No {statusTab !== 'all' ? statusTab : ''} verifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.kind + item.id}
              className={`glass-card overflow-hidden border ${item.status === 'pending' ? 'border-yellow-500/20' : 'border-white/8'}`}>
              {/* Header bar */}
              <div className="bg-navy-950/60 px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {item.kind === 'seller'
                    ? <Store className="w-4 h-4 text-primary-400" />
                    : <Truck className="w-4 h-4 text-blue-400" />}
                  <span className={`text-xs font-bold uppercase tracking-wider ${item.kind === 'seller' ? 'text-primary-300' : 'text-blue-300'}`}>
                    {item.kind}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    item.status === 'pending'  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    item.status === 'verified' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                                 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>{item.status}</span>
                </div>
                <span className="text-xs text-gray-500">
                  Submitted: {new Date(item.submitted_at).toLocaleString('en-PH')}
                </span>
              </div>

              <div className="p-5 grid md:grid-cols-2 gap-6">
                {/* Left: applicant info */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Applicant</p>
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar name={item.name} avatarUrl={item.avatar_url} size="md" />
                    <div>
                      <p className="text-white font-semibold text-sm">{item.name}</p>
                      <p className="text-gray-500 text-xs">{item.email}</p>
                    </div>
                  </div>
                  {item.store_name && (
                    <p className="text-xs text-gray-400"><span className="text-gray-600">Store: </span>{item.store_name}</p>
                  )}
                  {item.vehicle_type && (
                    <p className="text-xs text-gray-400"><span className="text-gray-600">Vehicle: </span>{item.vehicle_type}</p>
                  )}

                  {/* Rejection reason shown */}
                  {item.status === 'rejected' && item.rejection_reason && (
                    <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400 font-semibold mb-1">Rejection Reason</p>
                      <p className="text-xs text-gray-400">{item.rejection_reason}</p>
                    </div>
                  )}
                  {item.status === 'verified' && item.verified_at && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified on {new Date(item.verified_at).toLocaleDateString('en-PH')}
                    </div>
                  )}
                </div>

                {/* Right: document + actions */}
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{item.document_type}</p>

                  {/* Document preview */}
                  {item.document_url && (
                    <div className="relative">
                      {/\.(pdf)$/i.test(item.document_url) ? (
                        <a href={item.document_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 rounded-xl bg-navy-950/50 border border-white/10 hover:border-primary-500/40 transition group">
                          <FileText className="w-10 h-10 text-primary-400 shrink-0" />
                          <div>
                            <p className="text-white text-sm font-medium">View PDF Document</p>
                            <p className="text-gray-500 text-xs">{item.document_type}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-primary-400 ml-auto" />
                        </a>
                      ) : (
                        <a href={item.document_url} target="_blank" rel="noopener noreferrer">
                          <img src={item.document_url} alt={item.document_type}
                            className="w-full max-h-48 object-contain rounded-xl border border-white/10 hover:border-primary-500/40 transition bg-navy-950/50" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  {item.status === 'pending' && (
                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() => { setRejectModal({ id: item.id, kind: item.kind }); setRejectReason(''); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-medium transition">
                        <ShieldX className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => act(item.id, item.kind, 'approve')}
                        disabled={!!actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition disabled:opacity-50">
                        <ShieldCheck className="w-4 h-4" />
                        {actionLoading === item.id + 'approve' ? 'Approving…' : 'Approve'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
