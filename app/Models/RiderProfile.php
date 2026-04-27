<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiderProfile extends Model
{
    protected $fillable = [
        'user_id', 'seller_id', 'vehicle_type', 'vehicle_plate', 'is_available',
        'total_deliveries', 'rating',
        'license_document', 'verification_status', 'verification_rejection_reason', 'verified_at',
    ];

    protected $appends = ['license_document_url', 'is_verified'];

    public function user()       { return $this->belongsTo(User::class); }
    public function seller()     { return $this->belongsTo(User::class, 'seller_id'); }
    public function deliveries() { return $this->hasMany(Delivery::class, 'rider_id', 'user_id'); }

    public function getLicenseDocumentUrlAttribute(): ?string
    {
        if (!$this->license_document) return null;
        return str_starts_with($this->license_document, 'http')
            ? $this->license_document
            : url('storage/' . $this->license_document);
    }

    public function getIsVerifiedAttribute(): bool
    {
        return $this->verification_status === 'verified';
    }
}
