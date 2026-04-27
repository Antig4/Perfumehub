<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    protected $fillable = ['name', 'slug', 'logo', 'description', 'country_of_origin', 'is_active'];

    protected $appends = ['logo_url'];

    public function products() { return $this->hasMany(Product::class); }

    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo) return null;
        return str_starts_with($this->logo, 'http') ? $this->logo : url('storage/' . $this->logo);
    }
}
