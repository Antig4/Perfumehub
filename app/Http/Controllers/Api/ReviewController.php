<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use App\Models\Order;
use App\Models\SellerProfile;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function productReviews(Product $product)
    {
        $reviews = Review::with('user')
            ->where('product_id', $product->id)
            ->where('is_visible', true)
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'order_id'   => 'required|exists:orders,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
        ]);

        $user  = $request->user();
        $order = Order::findOrFail($request->order_id);

        // Must be owner and order must be delivered
        if ($order->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($order->status !== 'delivered') {
            return response()->json(['message' => 'You can only review delivered orders.'], 400);
        }

        $item = $order->items->firstWhere('product_id', $request->product_id);
        if (!$item) {
            return response()->json(['message' => 'Product not in this order.'], 400);
        }

        $review = Review::create([
            'user_id'    => $user->id,
            'product_id' => $request->product_id,
            'order_id'   => $request->order_id,
            'seller_id'  => $item->seller_id,
            'rating'     => $request->rating,
            'comment'    => $request->comment,
        ]);

        // Update product rating
        $product = Product::find($request->product_id);
        $avgRating = Review::where('product_id', $request->product_id)->avg('rating');
        $count     = Review::where('product_id', $request->product_id)->count();
        $product->update(['rating' => round($avgRating, 1), 'review_count' => $count]);

        // Update seller rating
        $avgSellerRating = Review::where('seller_id', $item->seller_id)->avg('rating');
        $countSeller     = Review::where('seller_id', $item->seller_id)->count();
        SellerProfile::where('user_id', $item->seller_id)->update([
            'rating'        => round($avgSellerRating, 1),
            'total_reviews' => $countSeller,
        ]);

        return response()->json(['data' => $review->load('user'), 'message' => 'Review submitted.'], 201);
    }
}
