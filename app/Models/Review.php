<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = ['user_id', 'product_id', 'order_id', 'seller_id', 'rating', 'comment', 'is_visible'];

    protected $casts = ['is_visible' => 'boolean'];

    public function user()    { return $this->belongsTo(User::class); }
    public function product() { return $this->belongsTo(Product::class); }
    public function order()   { return $this->belongsTo(Order::class); }
    public function seller()  { return $this->belongsTo(User::class, 'seller_id'); }
}
