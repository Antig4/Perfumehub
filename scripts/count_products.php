<?php
require __DIR__ . '/../vendor/autoload.php';
use App\Models\Product;
use App\Models\User;

echo 'Total active products: ' . Product::where('is_active', 1)->count() . PHP_EOL;
$sellers = User::where('role', 'seller')->get();
foreach ($sellers as $s) {
    echo 'Seller ' . $s->id . ' (' . $s->email . '): ' . Product::where('seller_id', $s->id)->where('is_active', 1)->count() . PHP_EOL;
}
