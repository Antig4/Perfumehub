<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Cart;
use App\Models\Delivery;
use App\Models\Notification;
use App\Models\RiderProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Order::with(['items.product', 'delivery', 'payment']);

        if ($user->isCustomer()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isSeller()) {
            $query->whereHas('items', function ($q) use ($user) { $q->where('seller_id', $user->id); });
        }

        if ($request->status) $query->where('status', $request->status);

        return response()->json($query->orderByDesc('created_at')->paginate(10));
    }

    public function show(Request $request, Order $order)
    {
        $user = $request->user();
        if ($user->isCustomer() && $order->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $order->load(['items.product.primaryImage', 'delivery.rider', 'payment', 'user', 'reviews']);
        return response()->json(['data' => $order]);
    }

    // Return a minimal status payload for an order. This is useful for
    // clients that only need the delivery/status without the full order
    // payload and with looser authorization checks where appropriate.
    public function status(Request $request, Order $order)
    {
        $user = $request->user();

        // Customers can view their own orders
        if ($user->isCustomer() && $order->user_id === $user->id) {
            return response()->json(['data' => ['status' => $order->status, 'delivery' => $order->delivery]]);
        }

        // Sellers can view orders that include items they sell
        if ($user->isSeller()) {
            $has = $order->items()->where('seller_id', $user->id)->exists();
            if ($has) return response()->json(['data' => ['status' => $order->status, 'delivery' => $order->delivery]]);
        }

        // Riders can view order status if assigned to the delivery or if the
        // delivery is currently unassigned (so a rider can claim it).
        if ($user->isRider()) {
            $delivery = $order->delivery;
            if ($delivery) {
                $canClaim = $delivery->rider_id === null;
                if ($delivery->rider_id === $user->id || $canClaim) {
                    return response()->json(['data' => ['status' => $order->status, 'delivery' => $order->delivery, 'can_claim' => $canClaim]]);
                }
            }
        }

        // For other cases, return unauthorized
        return response()->json(['message' => 'Unauthorized. Insufficient permissions.'], 403);
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'shipping_address' => 'required|string',
            'contact_phone'    => 'required|string',
            'payment_method'   => 'required|in:gcash,card',
            'notes'            => 'nullable|string',
        ]);

        $user    = $request->user();
        $cart    = Cart::with('items.product')->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['message' => 'Your cart is empty.'], 400);
        }

        // Validate stock
        foreach ($cart->items as $item) {
            if ($item->product->stock < $item->quantity) {
                return response()->json([
                    'message' => "Insufficient stock for {$item->product->name}.",
                ], 400);
            }
        }

        DB::beginTransaction();
        try {
            $subtotal = $cart->items->sum(function ($i) { return $i->product->price * $i->quantity; });
            $shipping = 100; // flat rate
            $total    = $subtotal + $shipping;

            $order = Order::create([
                'order_number'     => 'PH-' . strtoupper(Str::random(8)),
                'user_id'          => $user->id,
                'subtotal'         => $subtotal,
                'shipping_fee'     => $shipping,
                'total'            => $total,
                'payment_method'   => $request->payment_method,
                'shipping_address' => $request->shipping_address,
                'contact_phone'    => $request->contact_phone,
                'notes'            => $request->notes,
            ]);

            foreach ($cart->items as $item) {
                $primaryImage = $item->product->primaryImage ? $item->product->primaryImage->image_path : null;
                $orderItem = OrderItem::create([
                    'order_id'      => $order->id,
                    'product_id'    => $item->product_id,
                    'seller_id'     => $item->product->seller_id,
                    'quantity'      => $item->quantity,
                    'price'         => $item->product->price,
                    'product_name'  => $item->product->name,
                    'product_image' => $primaryImage,
                ]);

                // Decrement stock
                $item->product->decrement('stock', $item->quantity);
                // collect items per seller for notification
                $sellerId = $orderItem->seller_id;
                $sellerItems[$sellerId][] = [
                    'order_item_id' => $orderItem->id,
                    'product_id' => $orderItem->product_id,
                    'product_name' => $orderItem->product_name,
                    'quantity' => $orderItem->quantity,
                    'price' => $orderItem->price,
                ];
            }

            // Create delivery record (include optional lat/lng if customer provided via map picker)
            Delivery::create([
                'order_id'         => $order->id,
                'delivery_address' => $request->shipping_address,
                'recipient_name'   => $user->name,
                'recipient_phone'  => $request->contact_phone,
                'lat'              => $request->input('lat'),
                'lng'              => $request->input('lng'),
            ]);

            // Clear cart
            $cart->items()->delete();

            // Notify each seller about their items in this order
            if (!empty($sellerItems)) {
                foreach ($sellerItems as $sellerId => $items) {
                    $count = count($items);
                    Notification::create([
                        'user_id' => $sellerId,
                        'type'    => 'new_order',
                        'title'   => 'New Order Received',
                        'message' => "You have received a new order ({$order->order_number}) with {$count} item(s).",
                        'data'    => ['order_id' => $order->id, 'items' => $items],
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'data'    => $order->load('items'),
                'message' => 'Order placed successfully.',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Checkout failed: ' . $e->getMessage()], 500);
        }
    }

    public function cancel(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json(['message' => 'Cannot cancel order at this stage.'], 400);
        }

        // Restore stock
        foreach ($order->items as $item) {
            $product = Product::find($item->product_id);
            if ($product) { $product->increment('stock', $item->quantity); }
        }

        // Accept optional cancellation feedback from the customer
        $reason = $request->input('reason');
        $feedback = $request->input('notes');

        $order->update(['status' => 'cancelled']);

        // Notify admins with cancellation feedback so they can triage
        try {
            $admins = \App\Models\User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                \App\Models\Notification::create([
                    'user_id' => $admin->id,
                    'type'    => 'order_cancelled',
                    'title'   => 'Order Cancelled',
                    'message' => "Order #{$order->order_number} was cancelled by customer.",
                    'data'    => [
                        'order_id' => $order->id,
                        'user_id'  => $request->user()->id,
                        'reason'   => $reason,
                        'notes'    => $feedback,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            // ignore notification errors
        }

        return response()->json(['message' => 'Order cancelled.']);
    }

    // Admin / seller: update order status
    public function updateStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,packed,out_for_delivery,delivered,cancelled,refunded',
        ]);

        $order->update(['status' => $request->status]);

        // Notify customer
        Notification::create([
            'user_id' => $order->user_id,
            'type'    => 'order_status',
            'title'   => 'Order Update',
            'message' => "Your order #{$order->order_number} is now: {$request->status}.",
            'data'    => ['order_id' => $order->id],
        ]);

        // If seller confirmed/packed the order, notify the seller(s) and the customer
        if (in_array($request->status, ['confirmed', 'packed'])) {
            // Notify all sellers associated with this order
            foreach ($order->items->groupBy('seller_id') as $sellerId => $items) {
                Notification::create([
                    'user_id' => $sellerId,
                    'type'    => 'seller_order_update',
                    'title'   => 'Order to Fulfill',
                    'message' => "Order #{$order->order_number} has been marked {$request->status}. Please prepare the item(s) for fulfillment.",
                    'data'    => ['order_id' => $order->id, 'items' => $items->map->only(['id','product_id','product_name','quantity'])->values()],
                ]);
            }
            // If status is 'packed', try to auto-assign an available rider to the delivery
            if ($request->status === 'packed') {
                $delivery = $order->delivery;
                if ($delivery && !$delivery->rider_id) {
                    // Find an available rider profile
                    $riderProfile = RiderProfile::where('is_available', true)->first();
                    if ($riderProfile) {
                        $delivery->update([
                            'rider_id'    => $riderProfile->user_id,
                            'status'      => 'assigned',
                            'assigned_at' => now(),
                        ]);

                        // mark rider unavailable until delivery completed
                        $riderProfile->update(['is_available' => false]);

                        // Notify the rider
                        Notification::create([
                            'user_id' => $riderProfile->user_id,
                            'type'    => 'delivery_assigned',
                            'title'   => 'New Delivery Assigned',
                            'message' => "Order #{$order->order_number} has been assigned to you for delivery.",
                            'data'    => [
                                'order_id'    => $order->id,
                                'delivery_id' => $delivery->id,
                                'items'       => $order->items->map->only(['id','product_id','product_name','quantity'])->values(),
                                'delivery_status' => $delivery->status,
                            ],
                        ]);
                    } else {
                        // No riders available — notify admins so they can manually assign
                        $admins = User::where('role', 'admin')->get();
                        foreach ($admins as $admin) {
                            Notification::create([
                                'user_id' => $admin->id,
                                'type'    => 'delivery_needs_assignment',
                                'title'   => 'Delivery Needs Assignment',
                                'message' => "Order #{$order->order_number} is packed but no riders are available. Please assign a rider.",
                                'data'    => ['order_id' => $order->id, 'delivery_id' => $delivery ? $delivery->id : null],
                            ]);
                        }
                    }
                }
            }
        }

        return response()->json(['message' => 'Order status updated.', 'data' => $order]);
    }

    // Simple Server-Sent Events stream for seller orders.
    // NOTE: This is a lightweight dev-friendly implementation that streams
    // the seller's orders every few seconds. For production, consider using
    // a true broadcast system (Redis + Laravel Echo + Pusher/socket server).
    public function streamSellerOrders(Request $request)
    {
            // Try normal authenticated user first (cookie/session)
            $user = $request->user();

            // If no session auth, try token passed via query param or Authorization header
            if (!$user) {
                $token = $request->query('token') ?? $request->bearerToken();
                if ($token) {
                    $tokenModel = PersonalAccessToken::findToken($token);
                    if ($tokenModel) {
                        $user = $tokenModel->tokenable;
                    }
                }
            }

            if (!$user || !$user->isSeller()) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

        $callback = function () use ($user) {
            // Keep the connection open and periodically send updates
            while (true) {
                try {
                    $orders = Order::with(['items.product', 'user'])
                        ->whereHas('items', function ($q) use ($user) {
                            $q->where('seller_id', $user->id);
                        })
                        ->orderByDesc('created_at')
                        ->get();

                    echo "data: " . json_encode(['data' => $orders]) . "\n\n";
                    // flush buffers so client receives the message
                    @ob_flush();
                    @flush();
                } catch (\Exception $e) {
                    // On error, still sleep and continue
                }

                // Sleep for a short interval before sending the next update
                sleep(3);
            }
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
        ]);
    }
}
