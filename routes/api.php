<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SellerDashboardController;
use App\Http\Controllers\Api\RiderDashboardController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingsController;

// ─── Public Routes ────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Public product browsing
Route::get('/products',             [ProductController::class, 'index']);
Route::get('/products/trending',    [ProductController::class, 'trending']);
Route::get('/products/{product}',   [ProductController::class, 'show']);
Route::get('/brands',               [BrandController::class, 'index']);
Route::get('/categories',           [CategoryController::class, 'index']);
Route::get('/products/{product}/reviews', [ReviewController::class, 'productReviews']);

// PayMongo webhook (public, verified by signature)
Route::post('/payment/webhook', [PaymentController::class, 'webhook']);

// Server-Sent Events stream for seller order updates (token-authenticated)
Route::get('/seller/orders/stream', [OrderController::class, 'streamSellerOrders']);

// ─── Authenticated Routes ──────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Minimal order status endpoint accessible to authenticated users with
    // role-specific authorization (customer owner, seller with items, rider assigned).
    Route::get('/orders/{order}/status', [OrderController::class, 'status']);

    // Profile
    Route::get('/profile',             [UserController::class, 'profile']);
    Route::put('/profile',             [UserController::class, 'updateProfile']);
    Route::post('/profile/avatar',     [UserController::class, 'updateAvatar']);
    Route::put('/profile/password',    [UserController::class, 'changePassword']);

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::put('/notifications/{notification}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markRead']);
    Route::put('/notifications/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllRead']);

    // ─── Customer ───────────────────────────────────────────────
    Route::middleware('role:customer')->group(function () {
        // Cart
        Route::get('/cart',                   [CartController::class, 'index']);
        Route::post('/cart',                  [CartController::class, 'add']);
        Route::put('/cart/items/{cartItem}',  [CartController::class, 'update']);
        Route::delete('/cart/items/{cartItem}', [CartController::class, 'remove']);
        Route::delete('/cart',               [CartController::class, 'clear']);

        // Wishlist
        Route::get('/wishlist',     [WishlistController::class, 'index']);
        Route::post('/wishlist',    [WishlistController::class, 'toggle']);

        // Orders
        Route::post('/checkout',              [OrderController::class, 'checkout']);
        Route::get('/orders',                 [OrderController::class, 'index']);
        Route::get('/orders/{order}',         [OrderController::class, 'show']);
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

        // Reviews
        Route::post('/reviews', [ReviewController::class, 'store']);

        // Payment
        Route::post('/payment/intent',  [PaymentController::class, 'createIntent']);
        Route::post('/payment/attach',  [PaymentController::class, 'attachMethod']);
    });

    // ─── Seller ─────────────────────────────────────────────────
    Route::middleware('role:seller')->group(function () {
        Route::get('/seller/dashboard', [SellerDashboardController::class, 'dashboard']);
        Route::get('/seller/orders',    [OrderController::class, 'index']);
        Route::get('/seller/orders/{order}', [OrderController::class, 'show']);
        Route::put('/seller/orders/{order}/status', [OrderController::class, 'updateStatus']);

        // Products – seller can CRUD their own
        Route::post('/products',                 [ProductController::class, 'store']);
        Route::put('/products/{product}',        [ProductController::class, 'update']);
        Route::delete('/products/{product}',     [ProductController::class, 'destroy']);
        Route::delete('/product-images/{image}', [ProductController::class, 'deleteImage']);

        // Seller reports
        Route::get('/seller/report', [ReportController::class, 'sellerReport']);
    });

    // ─── Rider ─────────────────────────────────────────────────
    Route::middleware('role:rider')->group(function () {
        Route::get('/rider/dashboard',         [RiderDashboardController::class, 'dashboard']);
        Route::get('/rider/deliveries',        [DeliveryController::class, 'myDeliveries']);
        Route::put('/rider/deliveries/{delivery}/status', [DeliveryController::class, 'updateStatus']);
    });

    // ─── Admin ─────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [AdminDashboardController::class, 'dashboard']);

        // Users
        Route::get('/admin/users',                  [UserController::class, 'index']);
        Route::put('/admin/users/{user}/status',    [UserController::class, 'toggleStatus']);
        Route::put('/admin/users/{user}/password',  [UserController::class, 'resetPassword']);

        // Sellers
        Route::get('/admin/sellers',                    [AdminDashboardController::class, 'sellers']);
        Route::put('/admin/sellers/{sellerProfile}',    [AdminDashboardController::class, 'updateSellerStatus']);

        // Products (moderation)
        Route::put('/admin/products/{product}', [ProductController::class, 'update']);

        // Brands & Categories
        Route::post('/brands',           [BrandController::class, 'store']);
        Route::put('/brands/{brand}',    [BrandController::class, 'update']);
        Route::delete('/brands/{brand}', [BrandController::class, 'destroy']);
        Route::post('/categories',              [CategoryController::class, 'store']);
        Route::put('/categories/{category}',    [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        // Deliveries
        Route::get('/admin/deliveries',                   [DeliveryController::class, 'index']);
        Route::put('/admin/deliveries/{delivery}/assign', [DeliveryController::class, 'assign']);
        Route::put('/admin/deliveries/{delivery}/status', [DeliveryController::class, 'updateStatus']);

        // Reports
        Route::get('/admin/reports/sales', [ReportController::class, 'adminSales']);

        // Settings
        Route::get('/settings',  [SettingsController::class, 'index']);
        Route::put('/settings',  [SettingsController::class, 'update']);
    });
});
