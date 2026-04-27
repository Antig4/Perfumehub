<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'phone', 'address', 'lat', 'lng', 'avatar', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'lat' => 'float',
        'lng' => 'float',
    ];

    protected $appends = ['avatar_url'];

    // Role helpers
    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isSeller(): bool   { return $this->role === 'seller'; }
    public function isRider(): bool    { return $this->role === 'rider'; }
    public function isCustomer(): bool { return $this->role === 'customer'; }

    // Relationships
    public function sellerProfile()  { return $this->hasOne(SellerProfile::class); }
    public function riderProfile()   { return $this->hasOne(RiderProfile::class); }
    public function products()       { return $this->hasMany(Product::class, 'seller_id'); }
    public function orders()         { return $this->hasMany(Order::class); }
    public function cart()           { return $this->hasOne(Cart::class); }
    public function wishlists()      { return $this->hasMany(Wishlist::class); }
    public function reviews()        { return $this->hasMany(Review::class); }
    public function notifications()  { return $this->hasMany(Notification::class); }
    public function deliveries()     { return $this->hasMany(Delivery::class, 'rider_id'); }

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) return null;
        if (str_starts_with($this->avatar, 'http')) return $this->avatar;
        return url('storage/' . $this->avatar);
    }
}
