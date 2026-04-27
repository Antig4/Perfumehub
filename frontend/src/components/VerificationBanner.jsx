import { useState, useRef } from 'react';
import { ShieldCheck, ShieldX, Clock, Upload, AlertTriangle, CheckCircle2, FileText, X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/**
 * VerificationBanner
 *
 * Props:
 *   status       'unverified'|'pending'|'verified'|'rejected'
 *   kind         'seller'|'rider'
 *   docUrl       string|null   — already uploaded document preview URL
 *   reason       string|null   — rejection reason
 *   onUploaded   fn()          — callback after successful upload
 */
export default function VerificationBanner({ status, kind, docUrl, reason, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null);
  const fileRef = useRef(null);

  const docLabel   = kind === 'seller' ? 'Business Permit' : 'Driving License';
  const uploadUrl  = kind === 'seller' ? '/verification/seller/upload' : '/verification/rider/upload';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // local preview
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('document', file);
      const { data } = await api.post(uploadUrl, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message);
      onUploaded?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  if (status === 'verified') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/30 mb-6">
        <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
        <div>
          <p className="text-green-300 font-semibold text-sm">✓ Verified {kind === 'seller' ? 'Seller' : 'Rider'}</p>
          <p className="text-green-500 text-xs">Your account has been verified. All features are unlocked.</p>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex items-start gap-3 px-4 py-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
        <Clock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-300 font-semibold text-sm">Document Under Review</p>
          <p className="text-yellow-600 text-xs mt-0.5">
            Your {docLabel} has been submitted and is being reviewed by our admin team. This usually takes 1–2 business days.
          </p>
          {docUrl && (
            <a href={docUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-yellow-400 hover:text-yellow-300 underline">
              <FileText className="w-3 h-3" /> View submitted document
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border mb-6 overflow-hidden ${
      status === 'rejected'
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-primary-500/10 border-primary-500/30'
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {status === 'rejected'
            ? <ShieldX className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
          }
          <div>
            <p className={`font-semibold text-sm ${status === 'rejected' ? 'text-red-300' : 'text-primary-300'}`}>
              {status === 'rejected'
                ? 'Verification Rejected — Please resubmit'
                : `Verify Your ${kind === 'seller' ? 'Seller' : 'Rider'} Account`}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {status === 'rejected'
                ? `Reason: ${reason || 'No reason provided. Please contact support.'}`
                : `Upload your ${docLabel} to unlock all features. Unverified accounts cannot ${kind === 'seller' ? 'add products, manage orders, or manage riders' : 'accept deliveries'}.`}
            </p>
          </div>
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition ${
            uploading
              ? 'border-primary-500/30 opacity-60'
              : 'border-white/15 hover:border-primary-500/50 hover:bg-white/[0.02]'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
          {preview ? (
            <img src={preview} alt="Preview" className="h-20 rounded-lg object-contain" />
          ) : (
            <Upload className="w-8 h-8 text-gray-500" />
          )}
          <p className="text-sm text-gray-400 font-medium">
            {uploading ? 'Uploading…' : `Click to upload ${docLabel}`}
          </p>
          <p className="text-xs text-gray-600">JPG, PNG or PDF · Max 10 MB</p>
        </div>

        {/* Already uploaded doc link */}
        {docUrl && status === 'rejected' && (
          <a href={docUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-gray-300 underline">
            <FileText className="w-3 h-3" /> View previously submitted document
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * VerifiedBadge — small inline badge for product pages / public profiles
 */
export function VerifiedBadge({ kind = 'seller', size = 'sm' }) {
  const sizes = {
    sm: { wrap: 'px-2 py-0.5 text-xs gap-1', icon: 'w-3 h-3' },
    md: { wrap: 'px-3 py-1 text-sm gap-1.5', icon: 'w-4 h-4' },
  };
  const s = sizes[size] || sizes.sm;
  return (
    <span className={`inline-flex items-center ${s.wrap} rounded-full bg-green-500/15 border border-green-500/30 text-green-400 font-semibold`}>
      <ShieldCheck className={s.icon} />
      Verified {kind === 'seller' ? 'Seller' : 'Rider'}
    </span>
  );
}
