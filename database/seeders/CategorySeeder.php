<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            ['name' => 'Floral', 'description' => 'Romantic, feminine scents with flower notes.', 'icon' => '🌸'],
            ['name' => 'Woody', 'description' => 'Warm, earthy tones of cedarwood and sandalwood.', 'icon' => '🌲'],
            ['name' => 'Fresh', 'description' => 'Light, clean and aquatic fragrances.', 'icon' => '💧'],
            ['name' => 'Oriental', 'description' => 'Rich, exotic spiced and musky aromatics.', 'icon' => '✨'],
            ['name' => 'Fruity', 'description' => 'Sweet, vibrant notes of tropical and citrus fruits.', 'icon' => '🍓'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['name' => $cat['name']],
                array_merge($cat, ['slug' => Str::slug($cat['name'])])
            );
        }
    }
}
