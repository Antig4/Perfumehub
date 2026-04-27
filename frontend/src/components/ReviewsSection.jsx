import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import {
  Star, Camera, Image, Video, X, Send, CheckCircle2, Lock,
  ThumbsUp, MoreVertical, Flag, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserAvatar from './UserAvatar';

/* ─── helpers ──────────────────────────────────────────── */
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

/* ─── VideoThumb: shows first-frame poster ─────────────── */
function VideoThumb({ src, onClick }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      v.currentTime = 0.5; // seek to 0.5s for a visible frame
    };
    const onSeeked = () => setReady(true);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('seeked', onSeeked);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('seeked', onSeeked);
    };
  }, [src]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-primary-400 transition relative bg-navy-900 group shrink-0"
    >
      {/* Hidden video for frame extraction */}
      <video
        ref={videoRef}
        src={src}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
        muted
        playsInline
        preload="metadata"
        style={{ pointerEvents: 'none' }}
      />
      {/* Fallback icon while loading */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy-900">
          <Video className="w-7 h-7 text-gray-500" />
        </div>
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <div className="w-0 h-0 ml-1 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[12px] border-l-gray-900" />
        </div>
      </div>
    </button>
  );
}

/* ─── ImageThumb ───────────────────────────────────────── */
function ImageThumb({ src, alt, onClick }) {
  const [error, setError] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-primary-400 transition relative bg-navy-900 group shrink-0"
    >
      {error ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-1">
          <Image className="w-6 h-6" />
          <span className="text-[9px]">No preview</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
          onError={() => setError(true)}
        />
      )}
    </button>
  );
}

/* ─── Report Modal ─────────────────────────────────────── */
const REPORT_REASONS = [
  { id: 'scam',         label: 'Scam or Fraud' },
  { id: 'spam',         label: 'Spam' },
  { id: 'hate_speech',  label: 'Hate Speech' },
  { id: 'bullying',     label: 'Bullying or Harassment' },
  { id: 'pornography',  label: 'Pornography & Nudity' },
  { id: 'illegal',      label: 'Illegal Activities' },
  { id: 'other',        label: 'Others' },
];

function ReportModal({ reviewId, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error('Please select a reason'); return; }
    setSubmitting(true);
    try {
      await api.post(`/reviews/${reviewId}/report`, { reason, description });
      toast.success('Report submitted. Thank you!');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div
        className="bg-navy-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-400" />
            <h3 className="text-white font-bold">Report Review</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-400 mb-3">Why are you reporting this review?</p>
          {REPORT_REASONS.map(r => (
            <label key={r.id} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${reason === r.id ? 'border-primary-400 bg-primary-400' : 'border-gray-600 group-hover:border-gray-400'}`}>
                {reason === r.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <input type="radio" name="report_reason" value={r.id} className="hidden" onChange={() => setReason(r.id)} />
              <span className="text-sm text-gray-300 group-hover:text-white transition">{r.label}</span>
            </label>
          ))}

          {reason === 'other' && (
            <textarea
              className="input-field min-h-[90px] resize-none mt-3"
              placeholder="Share more details about this issue..."
              maxLength={1000}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          )}
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Three-dots menu ──────────────────────────────────── */
function ReviewMenu({ reviewId, onReport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-white/5 transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-40 bg-navy-900 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
          <button
            type="button"
            onClick={() => { setOpen(false); onReport(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition text-left"
          >
            <Flag className="w-4 h-4" /> Report Review
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition text-left"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── ReviewCard ───────────────────────────────────────── */
function ReviewCard({ review, isAuthenticated }) {
  const [lightbox, setLightbox]     = useState(null);
  const [liked, setLiked]           = useState(review.user_liked || false);
  const [likesCount, setLikesCount] = useState(review.likes_count || 0);
  const [liking, setLiking]         = useState(false);
  const [reporting, setReporting]   = useState(false);

  const mediaItems = Array.isArray(review.media) ? review.media : [];

  const handleLike = async () => {
    if (!isAuthenticated) { toast('Sign in to like reviews', { icon: '🔒' }); return; }
    setLiking(true);
    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount(c => wasLiked ? c - 1 : c + 1);
    try {
      const { data } = await api.post(`/reviews/${review.id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    } catch {
      // revert
      setLiked(wasLiked);
      setLikesCount(c => wasLiked ? c + 1 : c - 1);
      toast.error('Failed to like review');
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="border border-white/8 bg-navy-950/40 rounded-2xl p-5">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={review.user?.name}
            avatarUrl={review.user?.avatar_url}
            size="md"
          />
          <div>
            <p className="font-medium text-white">{review.user?.name || 'Anonymous'}</p>
            <p className="text-xs text-gray-500">
              {new Date(review.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map(n => (
            <Star key={n} className={`w-4 h-4 ${n <= review.rating ? 'text-primary-400 fill-primary-400' : 'text-gray-700'}`} />
          ))}
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-300 text-sm leading-relaxed mb-4">{review.comment}</p>
      )}

      {/* Media thumbnails */}
      {mediaItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {mediaItems.map((url, i) =>
            isVideo(url) ? (
              <VideoThumb key={i} src={url} onClick={() => setLightbox(url)} />
            ) : (
              <ImageThumb key={i} src={url} alt={`Review photo ${i + 1}`} onClick={() => setLightbox(url)} />
            )
          )}
        </div>
      )}

      {/* Footer: Like + Report */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        {/* Thumbs up */}
        <button
          type="button"
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition ${
            liked
              ? 'text-primary-400 bg-primary-500/10 border border-primary-500/30'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-primary-400' : ''}`} />
          <span>{likesCount > 0 ? likesCount : ''} Helpful</span>
        </button>

        {/* Three dots menu */}
        <ReviewMenu reviewId={review.id} onReport={() => setReporting(true)} />
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-5 right-5 z-10 text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {isVideo(lightbox) ? (
            <video
              key={lightbox}
              controls
              autoPlay
              className="max-h-[88vh] rounded-xl shadow-2xl outline-none"
              style={{ maxWidth: '90vw' }}
              onClick={e => e.stopPropagation()}
            >
              <source src={lightbox} type={mimeType(lightbox)} />
              Your browser does not support HTML5 video.
            </video>
          ) : (
            <img
              key={lightbox}
              src={lightbox}
              alt="Review media"
              className="max-h-[88vh] rounded-xl object-contain shadow-2xl"
              style={{ maxWidth: '90vw' }}
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Report Modal */}
      {reporting && (
        <ReportModal reviewId={review.id} onClose={() => setReporting(false)} />
      )}
    </div>
  );
}

/* ─── Star Picker ──────────────────────────────────────── */
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-8 h-8 transition-colors ${n <= (hovered || value) ? 'text-primary-400 fill-primary-400' : 'text-gray-600'}`} />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-400 min-w-[70px]">{labels[hovered || value]}</span>
    </div>
  );
}

/* ─── Main Export ──────────────────────────────────────── */
export default function ReviewsSection({ productId }) {
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews]             = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [canReview, setCanReview]         = useState(null);
  const [submitted, setSubmitted]         = useState(false);

  // Write review form
  const [rating, setRating]           = useState(0);
  const [comment, setComment]         = useState('');
  const [mediaFiles, setMediaFiles]   = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [submitting, setSubmitting]   = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated) fetchCanReview();
    // eslint-disable-next-line
  }, [productId, isAuthenticated]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/products/${productId}/reviews`);
      setReviews(data.data || []);
    } catch { /* silent */ }
    finally { setLoadingReviews(false); }
  };

  const fetchCanReview = async () => {
    try {
      const { data } = await api.get(`/products/${productId}/can-review`);
      setCanReview(data);
    } catch {
      setCanReview({ can_review: false, reason: 'error' });
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (mediaFiles.length + files.length > 5) { toast.error('Max 5 files'); return; }
    const previews = files.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video') ? 'video' : 'image',
    }));
    setMediaFiles(p => [...p, ...files]);
    setMediaPreviews(p => [...p, ...previews]);
  };

  const removeMedia = (i) => {
    setMediaFiles(p => p.filter((_, idx) => idx !== i));
    setMediaPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('product_id', productId);
      form.append('order_id', canReview.order_id);
      form.append('rating', rating);
      if (comment) form.append('comment', comment);
      mediaFiles.forEach((f, i) => form.append(`media[${i}]`, f));
      const { data } = await api.post('/reviews', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Review submitted!');
      setSubmitted(true);
      setReviews(p => [{ ...data.data, user_liked: false, likes_count: 0 }, ...p]);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating  = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const ratingCounts = [5,4,3,2,1].map(n => ({ n, count: reviews.filter(r => r.rating === n).length }));

  return (
    <div className="mt-16 border-t border-white/10 pt-12">
      <h2 className="text-2xl font-serif text-white mb-8">Customer Reviews</h2>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="glass-card p-6 mb-8 flex flex-col sm:flex-row gap-8">
          <div className="text-center shrink-0">
            <p className="text-6xl font-bold text-white">{avgRating}</p>
            <div className="flex items-center justify-center gap-0.5 my-2">
              {[1,2,3,4,5].map(n => (
                <Star key={n} className={`w-5 h-5 ${n <= Math.round(avgRating) ? 'text-primary-400 fill-primary-400' : 'text-gray-600'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingCounts.map(({ n, count }) => (
              <div key={n} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4 shrink-0">{n}</span>
                <Star className="w-3.5 h-3.5 text-primary-400 fill-primary-400 shrink-0" />
                <div className="flex-1 h-2 bg-navy-950 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-400 rounded-full" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }} />
                </div>
                <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review form */}
      {isAuthenticated && canReview?.can_review && !submitted && (
        <div className="glass-card p-6 mb-8 border border-primary-500/20">
          <h3 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary-400 fill-primary-400" /> Write a Review
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-sm text-gray-400 mb-2">Your Rating *</p>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Review <span className="text-gray-600">(optional)</span></p>
              <textarea
                className="input-field min-h-[110px] resize-y"
                placeholder="Describe the scent, longevity, packaging quality..."
                maxLength={2000}
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <p className="text-xs text-gray-600 text-right mt-0.5">{comment.length}/2000</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" /> Photos & Videos <span className="text-gray-600">(up to 5, mp4/jpg/png)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {mediaPreviews.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group shrink-0">
                    {p.type === 'video'
                      ? <div className="w-full h-full bg-navy-950 flex items-center justify-center"><Video className="w-7 h-7 text-gray-400" /></div>
                      : <img src={p.url} alt="" className="w-full h-full object-cover" />
                    }
                    <button type="button" onClick={() => removeMedia(i)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
                {mediaFiles.length < 5 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 hover:border-primary-400 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-primary-400 transition shrink-0">
                    <Image className="w-6 h-6" /><span className="text-[10px]">Add</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/avi,video/webm" className="hidden" onChange={handleMediaChange} />
            </div>
            <button type="submit" disabled={submitting || rating === 0} className="btn-primary py-3 px-6 flex items-center gap-2 disabled:opacity-60">
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* Already submitted */}
      {submitted && (
        <div className="glass-card p-5 mb-8 border border-green-500/30 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
          <p className="text-green-300 font-medium">Your review has been posted! Thank you for your feedback.</p>
        </div>
      )}

      {/* Not eligible */}
      {isAuthenticated && canReview && !canReview.can_review && !submitted && (
        <div className="glass-card p-5 mb-8 border border-white/10 flex items-center gap-3">
          <Lock className="w-5 h-5 text-gray-500 shrink-0" />
          <p className="text-gray-400 text-sm">
            {canReview.reason === 'already_reviewed'
              ? 'You have already reviewed this product.'
              : 'Only customers who have received this product can leave a review.'}
          </p>
        </div>
      )}

      {!isAuthenticated && (
        <div className="glass-card p-5 mb-8 border border-white/10 flex items-center gap-3">
          <Lock className="w-5 h-5 text-gray-500 shrink-0" />
          <p className="text-gray-400 text-sm">
            <a href="/login" className="text-primary-400 hover:underline">Sign in</a> to write a review after receiving your order.
          </p>
        </div>
      )}

      {/* Reviews list */}
      {loadingReviews ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-navy-900/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      )}
    </div>
  );
}
