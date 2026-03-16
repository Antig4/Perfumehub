<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'seller_id', 'brand_id', 'category_id', 'name', 'slug', 'description',
        'scent_notes', 'gender', 'volume_ml', 'price', 'original_price', 'stock',
        'low_stock_threshold', 'sales_count', 'view_count', 'rating', 'review_count',
        'is_active', 'is_featured',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'is_featured' => 'boolean',
        'price'        => 'float',
        'original_price' => 'float',
    ];

    public function seller()       { return $this->belongsTo(User::class, 'seller_id'); }
    public function brand()        { return $this->belongsTo(Brand::class); }
    public function category()     { return $this->belongsTo(Category::class); }
    public function images()       { return $this->hasMany(ProductImage::class)->orderBy('sort_order'); }
    public function primaryImage() { return $this->hasOne(ProductImage::class)->where('is_primary', true); }
    public function reviews()      { return $this->hasMany(Review::class); }
    public function wishlists()    { return $this->hasMany(Wishlist::class); }
    public function orderItems()   { return $this->hasMany(OrderItem::class); }

    // Trending = sales_count > 10 or view_count > 50
    public function getIsTrendingAttribute(): bool
    {
        return $this->sales_count >= 10 || $this->view_count >= 50;
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->stock > 0 && $this->stock <= $this->low_stock_threshold;
    }
}
