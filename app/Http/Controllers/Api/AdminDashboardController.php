<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Models\SellerProfile;
use App\Models\Brand;
use App\Models\Category;
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

        // Normalize and return in snake_case under `data` to match frontend expectations
        $stats = [
            'total_users' => $totalUsers,
            'total_sellers' => $totalSellers,
            'total_customers' => $totalCustomers,
            'total_riders' => $totalRiders,
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue ?: 0,
            'pending_orders' => $pendingOrders,
            'pending_sellers' => $pendingSellers,
            // optional growth metrics (computed elsewhere) — default to null to avoid NaN in frontend
            'sales_growth' => null,
            'order_growth' => null,
            // recent sellers for the admin overview panel
            'recent_sellers' => SellerProfile::with('user')->orderByDesc('created_at')->take(5)->get(),
            'total_brands' => Brand::count(),
            'total_categories' => Category::count(),
        ];

        return response()->json([
            'data' => $stats,
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
