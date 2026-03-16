<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function adminSales(Request $request)
    {
        $months = $request->months ?? 12;

        $sales = Order::where('payment_status', 'paid')
            ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as orders'))
            ->where('created_at', '>=', now()->subMonths($months))
            ->groupBy('month')->orderBy('month')->get();

        $topProducts = Product::orderByDesc('sales_count')
            ->with(['brand', 'primaryImage'])->take(10)
            ->get(['id', 'name', 'sales_count', 'price', 'brand_id']);

        $topSellers = DB::table('order_items')
            ->join('users', 'users.id', '=', 'order_items.seller_id')
            ->join('seller_profiles', 'seller_profiles.user_id', '=', 'order_items.seller_id')
            ->select('users.name', 'seller_profiles.store_name', DB::raw('SUM(order_items.quantity * order_items.price) as revenue'))
            ->groupBy('order_items.seller_id', 'users.name', 'seller_profiles.store_name')
            ->orderByDesc('revenue')->take(10)->get();

        $userGrowth = User::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subMonths($months))->groupBy('month')->orderBy('month')->get();

        return response()->json(compact('sales', 'topProducts', 'topSellers', 'userGrowth'));
    }

    public function sellerReport(Request $request)
    {
        $sellerId = $request->user()->id;
        $months   = $request->months ?? 6;

        $monthlySales = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', fn($q) => $q->where('payment_status', 'paid'))
            ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('SUM(quantity * price) as revenue'), DB::raw('SUM(quantity) as units'))
            ->where('created_at', '>=', now()->subMonths($months))
            ->groupBy('month')->orderBy('month')->get();

        $topProducts = Product::where('seller_id', $sellerId)
            ->orderByDesc('sales_count')->take(10)
            ->get(['id', 'name', 'sales_count', 'price', 'stock', 'rating']);

        $totalRevenue = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', fn($q) => $q->where('payment_status', 'paid'))
            ->sum(DB::raw('quantity * price'));

        return response()->json(compact('monthlySales', 'topProducts', 'totalRevenue'));
    }
}
