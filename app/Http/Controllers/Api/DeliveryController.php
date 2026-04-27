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
            'data'    => [
                'delivery_id' => $delivery->id,
                'order_id'    => $delivery->order_id,
                'items'       => $delivery->order->items->map->only(['id','product_id','product_name','quantity'])->values(),
                'delivery_status' => $delivery->status,
            ],
        ]);

        return response()->json(['message' => 'Rider assigned.', 'data' => $delivery]);
    }

    // Rider: update delivery status
    public function updateStatus(Request $request, Delivery $delivery)
    {
        $user = $request->user();

        // If delivery is unassigned and the rider is trying to pick it up, allow them to claim it
        if ($delivery->rider_id === null && $request->status === 'picked_up') {
            // Assign to the current rider
            $delivery->update([
                'rider_id'    => $user->id,
                'status'      => 'assigned',
                'assigned_at' => now(),
            ]);

            // mark rider unavailable
            $riderProfile = $user->riderProfile;
            if ($riderProfile) { $riderProfile->update(['is_available' => false]); }
        }

        if ($delivery->rider_id !== $user->id && !$user->isAdmin()) {
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
            'picked_up'        => 'out_for_delivery',
            'out_for_delivery' => 'out_for_delivery',
            'delivered'        => 'delivered',
        ];

        if (isset($orderStatusMap[$request->status])) {
            $delivery->order->update(['status' => $orderStatusMap[$request->status]]);

            $profMessage = "Your order #{$delivery->order->order_number} is now: " . ucfirst(str_replace('_', ' ', $request->status)) . ".";
            
            if ($request->status === 'picked_up') {
                $profMessage = "Great news! Your order #{$delivery->order->order_number} has been picked up by our rider.";
            }

            Notification::create([
                'user_id' => $delivery->order->user_id,
                'type'    => 'delivery_update',
                'title'   => 'Delivery Update',
                'message' => $profMessage,
                'data'    => ['order_id' => $delivery->order_id],
            ]);
        }

        if ($request->status === 'delivered') {
            $order = $delivery->order;
            
            // For COD orders: rider has collected the cash — mark payment as paid
            if ($order->payment_method === 'cod') {
                $order->update(['payment_status' => 'paid']);

                // Notify the customer that payment was received
                Notification::create([
                    'user_id' => $order->user_id,
                    'type'    => 'payment_received',
                    'title'   => 'Payment Received',
                    'message' => "Your cash payment of ₱{$order->total} for order #{$order->order_number} has been collected by the rider.",
                    'data'    => ['order_id' => $order->id],
                ]);
            }
            

            $riderProfile = $request->user()->riderProfile;
            if ($riderProfile) {
                $riderProfile->increment('total_deliveries');
                $riderProfile->update(['is_available' => true]);
            }
            // Update any existing delivery_assigned notifications for this delivery
            try {
                $notes = Notification::where('type', 'delivery_assigned')
                    ->where('data->delivery_id', $delivery->id)
                    ->get();
                foreach ($notes as $note) {
                    $d = $note->data ?? [];
                    $d['delivery_status'] = 'delivered';
                    $note->data = $d;
                    $note->save();
                }
            } catch (\Exception $e) {
                // ignore notification update errors
            }
            
        }

        // If delivery failed, also mark rider available again so they can be reassigned
        if ($request->status === 'failed') {
            $riderProfile = $request->user()->riderProfile;
            if ($riderProfile) { $riderProfile->update(['is_available' => true]); }
        }

        return response()->json(['message' => 'Delivery status updated.', 'data' => $delivery]);
    }
}
