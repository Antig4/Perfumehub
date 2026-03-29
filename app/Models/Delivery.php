<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    protected $fillable = [
        'order_id', 'rider_id', 'status', 'delivery_address',
        'recipient_name', 'recipient_phone', 'notes',
        'assigned_at', 'picked_up_at', 'delivered_at',
        'lat', 'lng',
    ];

    protected $casts = [
        'assigned_at'  => 'datetime',
        'picked_up_at' => 'datetime',
        'delivered_at' => 'datetime',
        'lat' => 'float',
        'lng' => 'float',
    ];

    public function order() { return $this->belongsTo(Order::class); }
    public function rider() { return $this->belongsTo(User::class, 'rider_id'); }
}
