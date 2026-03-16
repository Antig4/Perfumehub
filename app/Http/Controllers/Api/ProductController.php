<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['brand', 'category', 'primaryImage', 'seller.sellerProfile'])
            ->where('is_active', true);

        // Filters
        if ($request->brand_id)    $query->where('brand_id', $request->brand_id);
        if ($request->category_id) $query->where('category_id', $request->category_id);
        if ($request->gender)      $query->where('gender', $request->gender);
        if ($request->min_price)   $query->where('price', '>=', $request->min_price);
        if ($request->max_price)   $query->where('price', '<=', $request->max_price);
        if ($request->seller_id)   $query->where('seller_id', $request->seller_id);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhereHas('brand', fn($b) => $b->where('name', 'like', "%{$request->search}%"));
            });
        }

        // Sort
        switch ($request->sort) {
            case 'price_asc':    $query->orderBy('price', 'asc'); break;
            case 'price_desc':   $query->orderBy('price', 'desc'); break;
            case 'popular':      $query->orderBy('sales_count', 'desc'); break;
            case 'rating':       $query->orderBy('rating', 'desc'); break;
            case 'newest':       $query->orderBy('created_at', 'desc'); break;
            default:             $query->orderBy('sales_count', 'desc');
        }

        $products = $query->paginate($request->per_page ?? 12);

        // Append trending flag
        $products->getCollection()->transform(function ($p) {
            $p->append('is_trending');
            return $p;
        });

        return response()->json($products);
    }

    public function trending()
    {
        $products = Product::with(['brand', 'category', 'primaryImage'])
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where('sales_count', '>=', 10)->orWhere('view_count', '>=', 50);
            })
            ->orderByDesc('sales_count')
            ->take(12)
            ->get()
            ->map(fn($p) => $p->append('is_trending'));

        return response()->json(['data' => $products]);
    }

    public function show(Product $product)
    {
        // Increment view count
        $product->increment('view_count');

        $product->load(['brand', 'category', 'images', 'seller.sellerProfile', 'reviews.user']);
        $product->append(['is_trending', 'is_low_stock']);

        return response()->json(['data' => $product]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'brand_id'    => 'required|exists:brands,id',
            'category_id' => 'required|exists:categories,id',
            'name'        => 'required|string|max:255',
            'description' => 'required|string',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'gender'      => 'required|in:male,female,unisex',
            'images.*'    => 'image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        $slug = Str::slug($request->name) . '-' . Str::random(6);

        $product = Product::create([
            'seller_id'   => $request->user()->id,
            'brand_id'    => $request->brand_id,
            'category_id' => $request->category_id,
            'name'        => $request->name,
            'slug'        => $slug,
            'description' => $request->description,
            'scent_notes' => $request->scent_notes,
            'gender'      => $request->gender,
            'volume_ml'   => $request->volume_ml,
            'price'       => $request->price,
            'original_price' => $request->original_price,
            'stock'       => $request->stock,
            'low_stock_threshold' => $request->low_stock_threshold ?? 5,
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $idx => $image) {
                $path = $image->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path,
                    'is_primary' => $idx === 0,
                    'sort_order' => $idx,
                ]);
            }
        }

        return response()->json(['data' => $product->load('images'), 'message' => 'Product created successfully.'], 201);
    }

    public function update(Request $request, Product $product)
    {
        // Ensure only the owning seller or admin can update
        if ($request->user()->role === 'seller' && $product->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $product->update($request->only([
            'brand_id', 'category_id', 'name', 'description', 'scent_notes',
            'gender', 'volume_ml', 'price', 'original_price', 'stock',
            'low_stock_threshold', 'is_active', 'is_featured',
        ]));

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $idx => $image) {
                $path = $image->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path,
                    'is_primary' => false,
                    'sort_order' => $product->images()->count() + $idx,
                ]);
            }
        }

        return response()->json(['data' => $product->load('images'), 'message' => 'Product updated.']);
    }

    public function destroy(Request $request, Product $product)
    {
        if ($request->user()->role === 'seller' && $product->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $product->update(['is_active' => false]);
        return response()->json(['message' => 'Product disabled.']);
    }

    public function deleteImage(Request $request, ProductImage $image)
    {
        $product = $image->product;
        if ($request->user()->role === 'seller' && $product->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        Storage::disk('public')->delete($image->image_path);
        $image->delete();
        return response()->json(['message' => 'Image deleted.']);
    }
}
