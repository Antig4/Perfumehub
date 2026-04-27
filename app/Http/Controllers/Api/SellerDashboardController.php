<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Delivery;
use App\Models\RiderProfile;
use App\Models\User;
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

    // ─── Rider Management ──────────────────────────────────────

    /** List riders assigned to this seller */
    public function riders(Request $request)
    {
        $riders = RiderProfile::with('user')
            ->where('seller_id', $request->user()->id)
            ->get();

        return response()->json(['data' => $riders]);
    }

    /** List riders not assigned to any seller (available for assignment) */
    public function availableRiders(Request $request)
    {
        $riders = RiderProfile::with('user')
            ->whereNull('seller_id')
            ->get();

        return response()->json(['data' => $riders]);
    }

    /** Assign a rider to this seller (max 3) */
    public function assignRider(Request $request, User $user)
    {
        $sellerId = $request->user()->id;

        // Check max 3 riders per seller
        $currentCount = RiderProfile::where('seller_id', $sellerId)->count();
        if ($currentCount >= 3) {
            return response()->json(['message' => 'You can only assign up to 3 riders.'], 422);
        }

        $riderProfile = RiderProfile::where('user_id', $user->id)->first();
        if (!$riderProfile) {
            return response()->json(['message' => 'Rider profile not found.'], 404);
        }

        if ($riderProfile->seller_id && $riderProfile->seller_id !== $sellerId) {
            return response()->json(['message' => 'This rider is already assigned to another seller.'], 422);
        }

        $riderProfile->update(['seller_id' => $sellerId]);

        return response()->json(['message' => 'Rider assigned successfully.', 'data' => $riderProfile->load('user')]);
    }

    /** Unassign a rider from this seller */
    public function unassignRider(Request $request, User $user)
    {
        $riderProfile = RiderProfile::where('user_id', $user->id)
            ->where('seller_id', $request->user()->id)
            ->first();

        if (!$riderProfile) {
            return response()->json(['message' => 'Rider not found in your team.'], 404);
        }

        $riderProfile->update(['seller_id' => null]);

        return response()->json(['message' => 'Rider removed from your team.']);
    }

    /** Manually assign a specific rider to a specific order's delivery */
    public function assignRiderToOrder(Request $request, Order $order)
    {
        $request->validate(['rider_id' => 'required|exists:users,id']);

        $sellerId = $request->user()->id;

        // Ensure the order belongs to this seller
        $hasItem = $order->items()->where('seller_id', $sellerId)->exists();
        if (!$hasItem) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Ensure the chosen rider belongs to this seller's team
        $riderProfile = RiderProfile::where('user_id', $request->rider_id)
            ->where('seller_id', $sellerId)
            ->first();

        if (!$riderProfile) {
            return response()->json(['message' => 'This rider is not in your team.'], 422);
        }

        // Find or create delivery for this order
        $delivery = \App\Models\Delivery::firstOrCreate(
            ['order_id' => $order->id],
            [
                'delivery_address' => $order->shipping_address,
                'recipient_name'   => $order->user->name,
                'recipient_phone'  => $order->contact_phone,
                'lat'              => null,
                'lng'              => null,
            ]
        );

        // Update rider assignment
        $delivery->update([
            'rider_id'    => $request->rider_id,
            'status'      => 'assigned',
            'assigned_at' => now(),
        ]);

        // Mark rider as busy
        $riderProfile->update(['is_available' => false]);

        // Notify rider
        \App\Models\Notification::create([
            'user_id' => $request->rider_id,
            'type'    => 'delivery_assigned',
            'title'   => 'New Delivery Assigned',
            'message' => "Order #{$order->order_number} has been assigned to you by the seller.",
            'data'    => [
                'delivery_id'     => $delivery->id,
                'order_id'        => $order->id,
                'items'           => $order->items->map->only(['id', 'product_name', 'quantity'])->values(),
                'delivery_status' => 'assigned',
            ],
        ]);

        return response()->json(['message' => 'Rider assigned to order.', 'data' => $delivery]);
    }
}
