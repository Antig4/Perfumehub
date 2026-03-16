<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiderProfile extends Model
{
    protected $fillable = ['user_id', 'vehicle_type', 'vehicle_plate', 'is_available', 'total_deliveries', 'rating'];

    public function user()       { return $this->belongsTo(User::class); }
    public function deliveries() { return $this->hasMany(Delivery::class, 'rider_id', 'user_id'); }
}
