<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $wishlist = Wishlist::with(['product.primaryImage', 'product.brand'])
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json(['data' => $wishlist]);
    }

    public function toggle(Request $request)
    {
        $request->validate(['product_id' => 'required|exists:products,id']);

        $existing = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $request->product_id)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['message' => 'Removed from wishlist.', 'in_wishlist' => false]);
        }

        Wishlist::create(['user_id' => $request->user()->id, 'product_id' => $request->product_id]);
        return response()->json(['message' => 'Added to wishlist.', 'in_wishlist' => true]);
    }
}
