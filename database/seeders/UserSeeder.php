<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Cart;
use App\Models\SellerProfile;
use App\Models\RiderProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Admin
        User::create([
            'name' => 'PerfumeHub Admin',
            'email' => 'admin@perfumehub.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Sellers
        $sellers = [
            ['name' => 'Luxe Scents PH', 'email' => 'luxe@perfumehub.com', 'store' => 'Luxe Scents PH'],
            ['name' => 'Aroma House', 'email' => 'aroma@perfumehub.com', 'store' => 'Aroma House'],
            ['name' => 'Fragrance World', 'email' => 'fragranceworld@perfumehub.com', 'store' => 'Fragrance World'],
        ];

        foreach ($sellers as $idx => $s) {
            $user = User::create([
                'name' => $s['name'],
                'email' => $s['email'],
                'password' => Hash::make('password'),
                'role' => 'seller',
                'is_active' => true,
            ]);
            SellerProfile::create([
                'user_id' => $user->id,
                'store_name' => $s['store'],
                'store_slug' => Str::slug($s['store']) . '-' . $user->id,
                'description' => 'Your trusted source for authentic luxury perfumes.',
                'status' => 'approved',
                'rating' => round(4.2 + ($idx * 0.1), 1),
                'total_sales' => 50 + ($idx * 20),
            ]);
        }

        // Customers
        $customers = [
            ['name' => 'Maria Santos', 'email' => 'maria@example.com'],
            ['name' => 'Juan Dela Cruz', 'email' => 'juan@example.com'],
            ['name' => 'Anna Reyes', 'email' => 'anna@example.com'],
            ['name' => 'Mark Torres', 'email' => 'mark@example.com'],
            ['name' => 'Lisa Gomez', 'email' => 'lisa@example.com'],
        ];

        foreach ($customers as $c) {
            $user = User::create([
                'name' => $c['name'],
                'email' => $c['email'],
                'password' => Hash::make('password'),
                'role' => 'customer',
                'is_active' => true,
            ]);
            Cart::create(['user_id' => $user->id]);
        }

        // Riders
        $riders = [
            ['name' => 'Carlos Rider', 'email' => 'carlos@rider.com'],
            ['name' => 'Jose Deliveryman', 'email' => 'jose@rider.com'],
        ];

        foreach ($riders as $r) {
            $user = User::create([
                'name' => $r['name'],
                'email' => $r['email'],
                'password' => Hash::make('password'),
                'role' => 'rider',
                'is_active' => true,
            ]);
            RiderProfile::create([
                'user_id' => $user->id,
                'vehicle_type' => 'Motorcycle',
                'vehicle_plate' => 'ABC-' . rand(1000, 9999),
                'is_available' => true,
            ]);
        }
    }
}
