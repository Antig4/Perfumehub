<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Cart;
use App\Models\Delivery;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

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
                OrderItem::create([
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
            }

            // Create delivery record
            Delivery::create([
                'order_id'         => $order->id,
                'delivery_address' => $request->shipping_address,
                'recipient_name'   => $user->name,
                'recipient_phone'  => $request->contact_phone,
            ]);

            // Clear cart
            $cart->items()->delete();

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

        $order->update(['status' => 'cancelled']);

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

        return response()->json(['message' => 'Order status updated.', 'data' => $order]);
    }
}
