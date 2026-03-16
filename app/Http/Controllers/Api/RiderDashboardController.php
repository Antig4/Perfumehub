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

        $totalDeliveries = Delivery::where('rider_id', $riderId)->where('status', 'delivered')->count();
        $pendingDeliveries = Delivery::where('rider_id', $riderId)->whereIn('status', ['assigned', 'picked_up', 'out_for_delivery'])->count();
        $riderProfile = $request->user()->riderProfile;

        $recentDeliveries = Delivery::with(['order.user'])
            ->where('rider_id', $riderId)
            ->orderByDesc('updated_at')
            ->take(5)
            ->get();

        $weeklyDeliveries = Delivery::where('rider_id', $riderId)
            ->where('status', 'delivered')
            ->select(DB::raw('DATE(delivered_at) as date'), DB::raw('COUNT(*) as count'))
            ->where('delivered_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'stats' => [
                'total_delivered' => $totalDeliveries,
                'pending'         => $pendingDeliveries,
                'rating'          => $riderProfile ? $riderProfile->rating : 0,
            ],
            'weekly_deliveries' => $weeklyDeliveries,
            'recent_deliveries' => $recentDeliveries,
        ]);
    }
}
