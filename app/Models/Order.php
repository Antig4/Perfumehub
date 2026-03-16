<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number', 'user_id', 'subtotal', 'shipping_fee', 'total',
        'status', 'payment_status', 'payment_method', 'paymongo_payment_intent_id',
        'shipping_address', 'contact_phone', 'notes',
    ];

    protected $casts = [
        'subtotal'     => 'float',
        'shipping_fee' => 'float',
        'total'        => 'float',
    ];

    public function user()     { return $this->belongsTo(User::class); }
    public function items()    { return $this->hasMany(OrderItem::class); }
    public function payment()  { return $this->hasOne(Payment::class); }
    public function delivery() { return $this->hasOne(Delivery::class); }
    public function reviews()  { return $this->hasMany(Review::class); }
}
