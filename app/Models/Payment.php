<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id', 'paymongo_payment_id', 'paymongo_payment_intent_id',
        'amount', 'currency', 'status', 'method', 'metadata',
    ];

    protected $casts = [
        'amount'   => 'float',
        'metadata' => 'array',
    ];

    public function order() { return $this->belongsTo(Order::class); }
}
