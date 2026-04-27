<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SellerProfile extends Model
{
    protected $fillable = [
        'user_id', 'store_name', 'store_slug', 'description', 'banner', 'logo',
        'rating', 'total_reviews', 'total_sales', 'status', 'rejection_reason',
        'business_address', 'business_phone',
        'verification_document', 'verification_status', 'verification_rejection_reason', 'verified_at',
    ];

    protected $appends = ['logo_url', 'banner_url', 'verification_document_url', 'is_verified'];

    public function user()     { return $this->belongsTo(User::class); }
    public function products() { return $this->hasMany(Product::class, 'seller_id', 'user_id'); }

    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo) return null;
        return str_starts_with($this->logo, 'http') ? $this->logo : url('storage/' . $this->logo);
    }

    public function getBannerUrlAttribute(): ?string
    {
        if (!$this->banner) return null;
        return str_starts_with($this->banner, 'http') ? $this->banner : url('storage/' . $this->banner);
    }

    public function getVerificationDocumentUrlAttribute(): ?string
    {
        if (!$this->verification_document) return null;
        return str_starts_with($this->verification_document, 'http')
            ? $this->verification_document
            : url('storage/' . $this->verification_document);
    }

    public function getIsVerifiedAttribute(): bool
    {
        return $this->verification_status === 'verified';
    }
}
