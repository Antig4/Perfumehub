<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    private function getOrCreateCart(Request $request): Cart
    {
        return Cart::firstOrCreate(['user_id' => $request->user()->id]);
    }

    public function index(Request $request)
    {
        $cart = $this->getOrCreateCart($request);
        $cart->load(['items.product.primaryImage', 'items.product.brand', 'items.product.seller.sellerProfile']);

        $total = $cart->items->sum(fn($item) => $item->product->price * $item->quantity);

        return response()->json(['data' => $cart, 'total' => $total]);
    }

    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($request->product_id);

        if (!$product->is_active) {
            return response()->json(['message' => 'Product not available.'], 400);
        }

        if ($product->stock < $request->quantity) {
            return response()->json(['message' => 'Not enough stock.'], 400);
        }

        $cart = $this->getOrCreateCart($request);

        $item = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $request->product_id)
            ->first();

        if ($item) {
            $newQty = $item->quantity + $request->quantity;
            if ($newQty > $product->stock) {
                return response()->json(['message' => 'Exceeds available stock.'], 400);
            }
            $item->update(['quantity' => $newQty]);
        } else {
            CartItem::create([
                'cart_id'    => $cart->id,
                'product_id' => $request->product_id,
                'quantity'   => $request->quantity,
            ]);
        }

        return response()->json(['message' => 'Item added to cart.']);
    }

    public function update(Request $request, CartItem $cartItem)
    {
        if ($cartItem->cart->user_id !== $request->user()->id) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $request->validate(['quantity' => 'required|integer|min:1']);

        if ($request->quantity > $cartItem->product->stock) {
            return response()->json(['message' => 'Not enough stock.'], 400);
        }

        $cartItem->update(['quantity' => $request->quantity]);
        return response()->json(['message' => 'Cart updated.']);
    }

    public function remove(Request $request, CartItem $cartItem)
    {
        if ($cartItem->cart->user_id !== $request->user()->id) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $cartItem->delete();
        return response()->json(['message' => 'Item removed from cart.']);
    }

    public function clear(Request $request)
    {
        $cart = $this->getOrCreateCart($request);
        $cart->items()->delete();
        return response()->json(['message' => 'Cart cleared.']);
    }
}
