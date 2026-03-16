<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Delivery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SellerDashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        $sellerId = $request->user()->id;

        $totalRevenue = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', fn($q) => $q->where('payment_status', 'paid'))
            ->sum(DB::raw('quantity * price'));

        $totalOrders = OrderItem::where('seller_id', $sellerId)->distinct('order_id')->count('order_id');

        $totalProducts = Product::where('seller_id', $sellerId)->where('is_active', true)->count();

        $lowStockProducts = Product::where('seller_id', $sellerId)
            ->where('is_active', true)
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->where('stock', '>', 0)
            ->count();

        $monthlySales = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', fn($q) => $q->where('payment_status', 'paid'))
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('SUM(quantity * price) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $topProducts = Product::where('seller_id', $sellerId)
            ->where('is_active', true)
            ->orderByDesc('sales_count')
            ->take(5)
            ->get(['id', 'name', 'sales_count', 'price', 'stock']);

        $recentOrders = OrderItem::with(['order.user'])
            ->where('seller_id', $sellerId)
            ->orderByDesc('created_at')
            ->take(5)
            ->get();

        return response()->json([
            'stats' => [
                'total_revenue'     => $totalRevenue,
                'total_orders'      => $totalOrders,
                'total_products'    => $totalProducts,
                'low_stock_count'   => $lowStockProducts,
            ],
            'monthly_sales' => $monthlySales,
            'top_products'  => $topProducts,
            'recent_orders' => $recentOrders,
        ]);
    }
}
