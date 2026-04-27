<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SellerProfile;
use App\Models\RiderProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VerificationController extends Controller
{
    /* ─────────────────────────────────────────────────────────
     | SELLER — upload business permit
     ──────────────────────────────────────────────────────── */
    public function uploadSellerDocument(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $user    = $request->user();
        $profile = $user->sellerProfile;

        if (!$profile) {
            return response()->json(['message' => 'Seller profile not found.'], 404);
        }

        // Delete old document
        if ($profile->verification_document) {
            Storage::disk('public')->delete($profile->verification_document);
        }

        $path = $request->file('document')->store('verifications/sellers', 'public');

        $profile->update([
            'verification_document' => $path,
            'verification_status'   => 'pending',
            'verification_rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Document submitted for review. We will verify within 1-2 business days.',
            'verification_status' => 'pending',
            'verification_document_url' => $profile->fresh()->verification_document_url,
        ]);
    }

    /* ─────────────────────────────────────────────────────────
     | RIDER — upload driving license
     ──────────────────────────────────────────────────────── */
    public function uploadRiderDocument(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $user    = $request->user();
        $profile = $user->riderProfile;

        if (!$profile) {
            return response()->json(['message' => 'Rider profile not found.'], 404);
        }

        if ($profile->license_document) {
            Storage::disk('public')->delete($profile->license_document);
        }

        $path = $request->file('document')->store('verifications/riders', 'public');

        $profile->update([
            'license_document'      => $path,
            'verification_status'   => 'pending',
            'verification_rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Driving license submitted for review.',
            'verification_status' => 'pending',
            'license_document_url' => $profile->fresh()->license_document_url,
        ]);
    }

    /* ─────────────────────────────────────────────────────────
     | ADMIN — list pending verifications (sellers + riders)
     ──────────────────────────────────────────────────────── */
    public function adminList(Request $request)
    {
        $type   = $request->get('type', 'all');   // seller|rider|all
        $status = $request->get('status', 'pending');

        $sellers = collect();
        $riders  = collect();

        if ($type !== 'rider') {
            $sellers = SellerProfile::with('user')
                ->when($status !== 'all', fn($q) => $q->where('verification_status', $status))
                ->whereNotNull('verification_document')
                ->latest('updated_at')
                ->get()
                ->map(fn($s) => [
                    'id'              => $s->id,
                    'kind'            => 'seller',
                    'name'            => optional($s->user)->name,
                    'email'           => optional($s->user)->email,
                    'avatar_url'      => optional($s->user)->avatar_url,
                    'store_name'      => $s->store_name,
                    'document_url'    => $s->verification_document_url,
                    'document_type'   => 'Business Permit',
                    'status'          => $s->verification_status,
                    'rejection_reason'=> $s->verification_rejection_reason,
                    'verified_at'     => $s->verified_at ? (string) $s->verified_at : null,
                    'submitted_at'    => $s->updated_at ? (string) $s->updated_at : null,
                ]);
        }

        if ($type !== 'seller') {
            $riders = RiderProfile::with('user')
                ->when($status !== 'all', fn($q) => $q->where('verification_status', $status))
                ->whereNotNull('license_document')
                ->latest('updated_at')
                ->get()
                ->map(fn($r) => [
                    'id'              => $r->id,
                    'kind'            => 'rider',
                    'name'            => optional($r->user)->name,
                    'email'           => optional($r->user)->email,
                    'avatar_url'      => optional($r->user)->avatar_url,
                    'vehicle_type'    => $r->vehicle_type,
                    'document_url'    => $r->license_document_url,
                    'document_type'   => 'Driving License',
                    'status'          => $r->verification_status,
                    'rejection_reason'=> $r->verification_rejection_reason,
                    'verified_at'     => $r->verified_at ? (string) $r->verified_at : null,
                    'submitted_at'    => $r->updated_at ? (string) $r->updated_at : null,
                ]);
        }

        $all = $sellers->concat($riders)->sortByDesc('submitted_at')->values();

        return response()->json(['data' => $all]);
    }

    /* ─────────────────────────────────────────────────────────
     | ADMIN — approve or reject
     ──────────────────────────────────────────────────────── */
    public function adminAction(Request $request, $kind, $profileId)
    {
        $request->validate([
            'action' => 'required|in:approve,reject',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($kind === 'seller') {
            $profile = SellerProfile::findOrFail($profileId);
            if ($request->action === 'approve') {
                $profile->update([
                    'verification_status' => 'verified',
                    'status'              => 'approved',          // also approve the seller account
                    'verified_at'         => now(),
                    'verification_rejection_reason' => null,
                ]);
                if ($profile->user) {
                    $profile->user->update(['is_active' => true]);
                }
            } else {
                $profile->update([
                    'verification_status' => 'rejected',
                    'verification_rejection_reason' => $request->reason,
                ]);
            }
        } elseif ($kind === 'rider') {
            $profile = RiderProfile::findOrFail($profileId);
            if ($request->action === 'approve') {
                $profile->update([
                    'verification_status' => 'verified',
                    'verified_at'         => now(),
                    'verification_rejection_reason' => null,
                ]);
                if ($profile->user) {
                    $profile->user->update(['is_active' => true]);
                }
            } else {
                $profile->update([
                    'verification_status' => 'rejected',
                    'verification_rejection_reason' => $request->reason,
                ]);
            }
        } else {
            return response()->json(['message' => 'Unknown profile type.'], 422);
        }

        return response()->json([
            'message' => $request->action === 'approve' ? 'Profile verified and approved.' : 'Profile rejected.',
        ]);
    }

    /* ─────────────────────────────────────────────────────────
     | Current seller / rider — get their own verification status
     ──────────────────────────────────────────────────────── */
    public function mySellerStatus(Request $request)
    {
        $profile = $request->user()->sellerProfile;
        if (!$profile) return response()->json(['data' => null]);
        return response()->json(['data' => [
            'verification_status'          => $profile->verification_status,
            'verification_document_url'    => $profile->verification_document_url,
            'verification_rejection_reason'=> $profile->verification_rejection_reason,
            'is_verified'                  => $profile->is_verified,
            'verified_at'                  => $profile->verified_at,
        ]]);
    }

    public function myRiderStatus(Request $request)
    {
        $profile = $request->user()->riderProfile;
        if (!$profile) return response()->json(['data' => null]);
        return response()->json(['data' => [
            'verification_status'          => $profile->verification_status,
            'license_document_url'         => $profile->license_document_url,
            'verification_rejection_reason'=> $profile->verification_rejection_reason,
            'is_verified'                  => $profile->is_verified,
            'verified_at'                  => $profile->verified_at,
        ]]);
    }
}
