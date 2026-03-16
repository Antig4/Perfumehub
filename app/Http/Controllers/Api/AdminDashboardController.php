<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Models\SellerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function dashboard()
    {
        $totalUsers     = User::count();
        $totalSellers   = User::where('role', 'seller')->count();
        $totalCustomers = User::where('role', 'customer')->count();
        $totalRiders    = User::where('role', 'rider')->count();
        $totalOrders    = Order::count();
        $totalRevenue   = Order::where('payment_status', 'paid')->sum('total');
        $pendingOrders  = Order::where('status', 'pending')->count();
        $pendingSellers = SellerProfile::where('status', 'pending')->count();

        $monthlySales = Order::where('payment_status', 'paid')
            ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as orders'))
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('month')->orderBy('month')->get();

        $topProducts = Product::orderByDesc('sales_count')->with(['brand', 'primaryImage'])
            ->take(5)->get(['id', 'name', 'sales_count', 'price', 'brand_id']);

        $topSellers = SellerProfile::with('user')->where('status', 'approved')
            ->orderByDesc('total_sales')->take(5)->get();

        $userGrowth = User::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subMonths(6))->groupBy('month')->orderBy('month')->get();

        return response()->json([
            'stats' => compact('totalUsers','totalSellers','totalCustomers','totalRiders','totalOrders','totalRevenue','pendingOrders','pendingSellers'),
            'monthly_sales' => $monthlySales,
            'top_products'  => $topProducts,
            'top_sellers'   => $topSellers,
            'user_growth'   => $userGrowth,
        ]);
    }

    public function sellers(Request $request)
    {
        $query = SellerProfile::with('user');
        if ($request->status) $query->where('status', $request->status);
        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    public function updateSellerStatus(Request $request, SellerProfile $sellerProfile)
    {
        $request->validate(['status' => 'required|in:approved,suspended', 'rejection_reason' => 'nullable|string']);
        $sellerProfile->update(['status' => $request->status, 'rejection_reason' => $request->rejection_reason]);
        $sellerProfile->user->update(['is_active' => $request->status === 'approved']);
        return response()->json(['message' => 'Seller status updated.', 'data' => $sellerProfile]);
    }
}
