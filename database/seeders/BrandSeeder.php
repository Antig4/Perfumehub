<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    public function run()
    {
        $brands = [
            ['name' => 'Chanel', 'country_of_origin' => 'France', 'description' => 'A symbol of luxury and elegance.'],
            ['name' => 'Dior', 'country_of_origin' => 'France', 'description' => 'House of Christian Dior fragrances.'],
            ['name' => 'Versace', 'country_of_origin' => 'Italy', 'description' => 'Bold and glamorous Italian fashion house.'],
            ['name' => 'Calvin Klein', 'country_of_origin' => 'USA', 'description' => 'Modern minimalist American fragrances.'],
            ['name' => 'Giorgio Armani', 'country_of_origin' => 'Italy', 'description' => 'Sophisticated Italian elegance.'],
            ['name' => 'Gucci', 'country_of_origin' => 'Italy', 'description' => 'Iconic Italian luxury brand.'],
            ['name' => 'Tom Ford', 'country_of_origin' => 'USA', 'description' => 'Opulent and daring signature scents.'],
            ['name' => 'Yves Saint Laurent', 'country_of_origin' => 'France', 'description' => 'French haute couture perfumes.'],
            ['name' => 'Burberry', 'country_of_origin' => 'UK', 'description' => 'Classic British heritage fragrances.'],
            ['name' => 'Hugo Boss', 'country_of_origin' => 'Germany', 'description' => 'Confident and contemporary scents.'],
        ];

        foreach ($brands as $brand) {
            Brand::updateOrCreate(
                ['name' => $brand['name']],
                array_merge($brand, ['slug' => Str::slug($brand['name'])])
            );
        }
    }
}
