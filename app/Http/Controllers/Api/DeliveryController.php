<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Notification;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    // Rider: get assigned deliveries
    public function myDeliveries(Request $request)
    {
        $deliveries = Delivery::with(['order.user', 'order.items.product'])
            ->where('rider_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($deliveries);
    }

    // Admin: get all deliveries / unassigned
    public function index(Request $request)
    {
        $query = Delivery::with(['order.user', 'rider']);
        if ($request->status) $query->where('status', $request->status);
        if ($request->unassigned) $query->whereNull('rider_id');

        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    // Admin: assign rider to delivery
    public function assign(Request $request, Delivery $delivery)
    {
        $request->validate(['rider_id' => 'required|exists:users,id']);

        $delivery->update([
            'rider_id'    => $request->rider_id,
            'status'      => 'assigned',
            'assigned_at' => now(),
        ]);

        Notification::create([
            'user_id' => $request->rider_id,
            'type'    => 'delivery_assigned',
            'title'   => 'New Delivery Assigned',
            'message' => "Order #{$delivery->order->order_number} has been assigned to you.",
            'data'    => ['delivery_id' => $delivery->id],
        ]);

        return response()->json(['message' => 'Rider assigned.', 'data' => $delivery]);
    }

    // Rider: update delivery status
    public function updateStatus(Request $request, Delivery $delivery)
    {
        if ($delivery->rider_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'status' => 'required|in:picked_up,out_for_delivery,delivered,failed',
        ]);

        $updates = ['status' => $request->status];

        if ($request->status === 'picked_up')         $updates['picked_up_at'] = now();
        if ($request->status === 'delivered')         $updates['delivered_at'] = now();
        if ($request->notes)                          $updates['notes'] = $request->notes;

        $delivery->update($updates);

        // Sync order status
        $orderStatusMap = [
            'picked_up'        => 'packed',
            'out_for_delivery' => 'out_for_delivery',
            'delivered'        => 'delivered',
        ];

        if (isset($orderStatusMap[$request->status])) {
            $delivery->order->update(['status' => $orderStatusMap[$request->status]]);

            Notification::create([
                'user_id' => $delivery->order->user_id,
                'type'    => 'delivery_update',
                'title'   => 'Delivery Update',
                'message' => "Your order #{$delivery->order->order_number} is now: {$request->status}.",
                'data'    => ['order_id' => $delivery->order_id],
            ]);
        }

        if ($request->status === 'delivered') {
            $riderProfile = $request->user()->riderProfile;
            if ($riderProfile) { $riderProfile->increment('total_deliveries'); }
        }

        return response()->json(['message' => 'Delivery status updated.', 'data' => $delivery]);
    }
}
