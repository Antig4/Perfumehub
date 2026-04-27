import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  Flag, Star, ShieldCheck, ShieldX, EyeOff,
  AlertTriangle, CheckCircle2, Clock, Filter, RefreshCw, X, Video as VideoIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserAvatar from '../../components/UserAvatar';

/* ─── URL helpers ─────────────────────────────────────── */
const BACKEND = 'http://127.0.0.1:8000';
function fixUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;          // already absolute
  return BACKEND + (url.startsWith('/') ? '' : '/') + url;
}
function isVideo(url) {
  return /\.(mp4|mov|avi|webm|ogv)(\?|$)/i.test(url || '');
}
function mimeType(url) {
  if (/\.mp4/i.test(url))  return 'video/mp4';
  if (/\.mov/i.test(url))  return 'video/quicktime';
  if (/\.avi/i.test(url))  return 'video/x-msvideo';
  if (/\.webm/i.test(url)) return 'video/webm';
  return 'video/mp4';
}
function parseMedia(raw) {
  try { return (JSON.parse(raw || '[]') || []).map(fixUrl); }
  catch { return []; }
}

/* ─── Video thumbnail ──────────────────────────────────── */
function VideoThumb({ src, onClick }) {
  const ref  = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const onMeta  = () => { v.currentTime = 0.5; };
    const onSeek  = () => setReady(true);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('seeked', onSeek);
    return () => { v.removeEventListener('loadedmetadata', onMeta); v.removeEventListener('seeked', onSeek); };
  }, [src]);
  return (
    <button type="button" onClick={onClick}
      className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-primary-400 transition relative bg-navy-900 shrink-0 group">
      <video ref={ref} src={src} muted playsInline preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`}
        style={{ pointerEvents: 'none' }} />
      {!ready && <div className="absolute inset-0 flex items-center justify-center"><VideoIcon className="w-5 h-5 text-gray-500" /></div>}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
          <div className="w-0 h-0 ml-0.5 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[9px] border-l-gray-900" />
        </div>
      </div>
    </button>
  );
}

/* ─── Image thumbnail ──────────────────────────────────── */
function ImageThumb({ src, alt, onClick }) {
  const [err, setErr] = useState(false);
  return (
    <button type="button" onClick={onClick}
      className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-primary-400 transition bg-navy-900 shrink-0 group">
      {err
        ? <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px]">No img</div>
        : <img src={src} alt={alt} onError={() => setErr(true)} className="w-full h-full object-cover group-hover:scale-105 transition" />
      }
    </button>
  );
}

/* ─── Fullscreen Lightbox ──────────────────────────────── */
function Lightbox({ url, onClose }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}>
      <button type="button" onClick={onClose}
        className="absolute top-5 right-5 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition">
        <X className="w-6 h-6" />
      </button>
      {isVideo(url) ? (
        <video key={url} controls autoPlay
          className="max-h-[88vh] rounded-xl shadow-2xl outline-none"
          style={{ maxWidth: '90vw' }}
          onClick={e => e.stopPropagation()}>
          <source src={url} type={mimeType(url)} />
          Your browser does not support HTML5 video.
        </video>
      ) : (
        <img key={url} src={url} alt="Review media"
          className="max-h-[88vh] rounded-xl object-contain shadow-2xl"
          style={{ maxWidth: '90vw' }}
          onClick={e => e.stopPropagation()} />
      )}
    </div>
  );
}

/* ─── Constants ────────────────────────────────────────── */
const REASON_LABELS = {
  scam:        { label: 'Scam or Fraud',        color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  spam:        { label: 'Spam',                  color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  hate_speech: { label: 'Hate Speech',           color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  bullying:    { label: 'Bullying / Harassment', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  pornography: { label: 'Pornography & Nudity',  color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  illegal:     { label: 'Illegal Activities',    color: 'text-red-300 bg-red-400/10 border-red-400/30' },
  other:       { label: 'Other',                 color: 'text-gray-300 bg-gray-500/10 border-gray-500/30' },
};

const STATUS_TABS = [
  { key: 'pending',   label: 'Pending',   icon: Clock,        color: 'text-yellow-400' },
  { key: 'reviewed',  label: 'Reviewed',  icon: CheckCircle2, color: 'text-green-400' },
  { key: 'dismissed', label: 'Dismissed', icon: ShieldX,      color: 'text-gray-400' },
  { key: 'all',       label: 'All',       icon: Filter,       color: 'text-blue-400' },
];

/* ─── Main page ────────────────────────────────────────── */
export default function AdminReviewReports() {
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusTab, setStatusTab]     = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [lightbox, setLightbox]       = useState(null); // active URL in lightbox

  useEffect(() => { fetchReports(); }, [statusTab]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/review-reports?status=${statusTab}`);
      setReports(data.data || []);
    } catch {
      toast.error('Failed to load review reports');
    } finally {
      setLoading(false);
    }
  };

  const takeAction = async (reportId, action) => {
    setActionLoading(reportId + action);
    try {
      const { data } = await api.post(`/admin/review-reports/${reportId}/action`, { action });
      toast.success(data.message);
      fetchReports();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Lightbox — renders at top-level so z-index works correctly */}
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-white flex items-center gap-3">
            <Flag className="w-7 h-7 text-red-400" /> Review Reports
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage customer-reported reviews. Dismiss false reports or remove violating content.
          </p>
        </div>
        <button onClick={fetchReports} className="flex items-center gap-2 btn-outline px-4 py-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setStatusTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${
                statusTab === tab.key
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                  : 'bg-navy-950/50 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}>
              <Icon className={`w-4 h-4 ${statusTab === tab.key ? 'text-primary-400' : tab.color}`} />
              {tab.label}
              {tab.key === 'pending' && pendingCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-navy-900/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-60" />
          <p className="text-xl text-gray-300">No {statusTab !== 'all' ? statusTab : ''} reports</p>
          <p className="text-sm text-gray-500 mt-1">Everything looks clean here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => {
            const reasonInfo    = REASON_LABELS[report.reason] || REASON_LABELS.other;
            const media         = parseMedia(report.review_media);
            const isPending     = report.status === 'pending';
            const isRemoved     = report.review_visible === 0 || report.review_visible === false;

            return (
              <div key={report.id}
                className={`glass-card overflow-hidden border ${isPending ? 'border-yellow-500/20' : 'border-white/8'}`}>

                {/* Card header */}
                <div className="bg-navy-950/60 px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${reasonInfo.color}`}>
                      {reasonInfo.label}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      report.status === 'pending'  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                      report.status === 'reviewed' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                                     'bg-gray-500/10 text-gray-400 border-gray-500/30'
                    }`}>{report.status}</span>
                    {isRemoved && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Review Hidden
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    Reported: {new Date(report.created_at).toLocaleString('en-PH')}
                  </span>
                </div>

                <div className="p-5 grid md:grid-cols-2 gap-6">
                  {/* Left: Reported review content */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Reported Review</p>
                    <div className="bg-navy-950/50 rounded-xl p-4 border border-white/5">
                      {/* Stars */}
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= report.review_rating ? 'text-primary-400 fill-primary-400' : 'text-gray-700'}`} />
                        ))}
                      </div>

                      {/* Comment */}
                      <p className="text-gray-300 text-sm leading-relaxed mb-3">
                        {report.review_comment
                          ? report.review_comment
                          : <span className="italic text-gray-600">No comment — media only</span>}
                      </p>

                      {/* ── Media thumbnails — click opens in-page lightbox ── */}
                      {media.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-3">
                          {media.map((url, i) =>
                            isVideo(url) ? (
                              <VideoThumb key={i} src={url} onClick={() => setLightbox(url)} />
                            ) : (
                              <ImageThumb key={i} src={url} alt={`media ${i+1}`} onClick={() => setLightbox(url)} />
                            )
                          )}
                        </div>
                      )}

                      {/* Author avatar + product */}
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                        <UserAvatar
                          name={report.author_name}
                          avatarUrl={report.author_avatar_url}
                          size="sm"
                        />
                        <p className="text-xs text-gray-500">
                          By <span className="text-gray-300">{report.author_name}</span>
                          {' · '}
                          <Link to={`/products/${report.product_id}`}
                            className="text-primary-400 hover:underline" target="_blank">
                            {report.product_name}
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Reporter + actions */}
                  <div className="flex flex-col gap-4">
                    {/* Reporter */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Reported By</p>
                      <div className="flex items-center gap-3 bg-navy-950/40 rounded-xl p-3 border border-white/5">
                        <UserAvatar
                          name={report.reporter_name}
                          avatarUrl={report.reporter_avatar_url}
                          size="md"
                        />
                        <div>
                          <p className="text-white text-sm font-medium">{report.reporter_name}</p>
                          <p className="text-gray-500 text-xs">{report.reporter_email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Extra description (for "other" reason) */}
                    {report.description && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Additional Details</p>
                        <div className="bg-navy-950/40 rounded-xl p-3 border border-white/5">
                          <p className="text-gray-300 text-sm leading-relaxed">{report.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {isPending && !isRemoved && (
                      <div className="mt-auto pt-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Admin Action</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => takeAction(report.id, 'dismiss')}
                            disabled={!!actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-white/5 text-sm font-medium transition disabled:opacity-50">
                            <ShieldX className="w-4 h-4" />
                            {actionLoading === report.id + 'dismiss' ? 'Dismissing...' : 'Dismiss'}
                          </button>
                          <button
                            onClick={() => takeAction(report.id, 'remove_review')}
                            disabled={!!actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition disabled:opacity-50">
                            <AlertTriangle className="w-4 h-4" />
                            {actionLoading === report.id + 'remove_review' ? 'Removing...' : 'Remove Review'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center">
                          "Remove Review" hides it from all customers permanently.
                        </p>
                      </div>
                    )}

                    {/* Already actioned */}
                    {(!isPending || isRemoved) && (
                      <div className={`mt-auto p-3 rounded-xl border flex items-center gap-2 ${
                        isRemoved
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-green-500/10 border-green-500/20 text-green-400'
                      }`}>
                        {isRemoved ? <EyeOff className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        <span className="text-sm font-medium">
                          {isRemoved ? 'Review has been removed from public view.' : `Report ${report.status}.`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
