<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RiderDashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        $riderId = $request->user()->id;

        // compute metrics in terms frontend expects
        $riderProfile = $request->user()->riderProfile;

        $pendingDeliveries = Delivery::where('rider_id', $riderId)->where('status', 'assigned')->count();
        $inTransit = Delivery::where('rider_id', $riderId)->whereIn('status', ['picked_up', 'out_for_delivery'])->count();
        $completedToday = Delivery::where('rider_id', $riderId)
            ->where('status', 'delivered')
            ->whereDate('delivered_at', now()->toDateString())
            ->count();

        $recentDeliveries = Delivery::with(['order.user'])
            ->where('rider_id', $riderId)
            ->orderByDesc('updated_at')
            ->take(5)
            ->get();

        return response()->json([
            'pending_deliveries' => $pendingDeliveries,
            'in_transit'         => $inTransit,
            'completed_today'    => $completedToday,
            'recent_activity'    => $recentDeliveries,
            'rating'             => $riderProfile ? $riderProfile->rating : 0,
        ]);
    }
}
