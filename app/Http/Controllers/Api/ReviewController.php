<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use App\Models\Order;
use App\Models\SellerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReviewController extends Controller
{
    /** Public: Get all visible reviews for a product — includes likes_count and user_liked */
    public function productReviews(Product $product, Request $request)
    {
        $userId = optional($request->user())->id;

        $reviews = Review::with('user')
            ->where('product_id', $product->id)
            ->where('is_visible', true)
            ->withCount('likes')
            ->orderByDesc('likes_count')
            ->orderByDesc('created_at')
            ->paginate(20);

        // Append whether current user liked each review
        $reviews->getCollection()->transform(function ($review) use ($userId) {
            $review->user_liked = $userId
                ? $review->likes()->where('user_id', $userId)->exists()
                : false;
            return $review;
        });

        return response()->json($reviews);
    }

    /** Auth: Check if the current user can review a product */
    public function canReview(Request $request, Product $product)
    {
        $user = $request->user();

        $eligibleOrder = Order::where('user_id', $user->id)
            ->where('status', 'delivered')
            ->whereHas('items', fn($q) => $q->where('product_id', $product->id))
            ->first();

        if (!$eligibleOrder) {
            return response()->json(['can_review' => false, 'reason' => 'no_delivered_order']);
        }

        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->where('order_id', $eligibleOrder->id)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json(['can_review' => false, 'reason' => 'already_reviewed']);
        }

        return response()->json(['can_review' => true, 'order_id' => $eligibleOrder->id]);
    }

    /** Auth: Submit a new review with optional media */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'order_id'   => 'required|exists:orders,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:2000',
            'media.*'    => 'nullable|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,webm|max:51200',
        ]);

        $user  = $request->user();
        $order = Order::findOrFail($request->order_id);

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

        $existing = Review::where('user_id', $user->id)
            ->where('product_id', $request->product_id)
            ->where('order_id', $request->order_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already reviewed this product.'], 400);
        }

        // Handle media uploads — return full absolute URL
        $mediaPaths = [];
        if ($request->hasFile('media')) {
            foreach ($request->file('media') as $file) {
                $path = $file->store('reviews', 'public');
                $mediaPaths[] = url(Storage::url($path));
            }
        }

        $review = Review::create([
            'user_id'    => $user->id,
            'product_id' => $request->product_id,
            'order_id'   => $request->order_id,
            'seller_id'  => $item->seller_id,
            'rating'     => $request->rating,
            'comment'    => $request->comment,
            'media'      => $mediaPaths ?: null,
            'is_visible' => true,
        ]);

        // Update product rating
        $product   = Product::find($request->product_id);
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

        $review->loadCount('likes');
        $review->user_liked = false;

        return response()->json(['data' => $review->load('user'), 'message' => 'Review submitted successfully!'], 201);
    }

    /** Auth: Toggle like on a review */
    public function toggleLike(Request $request, Review $review)
    {
        $userId = $request->user()->id;
        $liked  = $review->likes()->where('user_id', $userId)->exists();

        if ($liked) {
            $review->likes()->where('user_id', $userId)->delete();
        } else {
            $review->likes()->create(['user_id' => $userId]);
        }

        return response()->json([
            'liked'       => !$liked,
            'likes_count' => $review->likes()->count(),
        ]);
    }

    /** Auth: Report a review */
    public function report(Request $request, Review $review)
    {
        $request->validate([
            'reason'      => 'required|in:scam,spam,hate_speech,bullying,pornography,illegal,other',
            'description' => 'nullable|string|max:1000',
        ]);

        $userId = $request->user()->id;

        // Can't report your own review
        if ($review->user_id === $userId) {
            return response()->json(['message' => 'You cannot report your own review.'], 400);
        }

        // Check already reported
        $alreadyReported = DB::table('review_reports')
            ->where('review_id', $review->id)
            ->where('user_id', $userId)
            ->exists();

        if ($alreadyReported) {
            return response()->json(['message' => 'You have already reported this review.'], 400);
        }

        DB::table('review_reports')->insert([
            'review_id'   => $review->id,
            'user_id'     => $userId,
            'reason'      => $request->reason,
            'description' => $request->description,
            'status'      => 'pending',
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json(['message' => 'Review reported. Our team will review it shortly.']);
    }
}
