<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    protected $fillable = ['product_id', 'image_path', 'is_primary', 'sort_order'];

    public function product() { return $this->belongsTo(Product::class); }

    public function getImageUrlAttribute(): string
    {
        return str_starts_with($this->image_path, 'http')
            ? $this->image_path
            : url('storage/' . $this->image_path);
    }
}
