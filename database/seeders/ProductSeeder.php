<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run()
    {
        $sellers = User::where('role', 'seller')->get();
        $brands = Brand::all();
        $categories = Category::all();

        $products = [
            // Chanel
            ['name' => 'Chanel N°5', 'price' => 7500, 'stock' => 30, 'sales_count' => 85, 'gender' => 'female', 'volume' => '100ml',
             'desc' => 'The iconic floral-aldehyde fragrance. A timeless symbol of femininity.',
             'scent' => 'Ylang-ylang, Rose, Jasmine, Sandalwood'],
            ['name' => 'Chanel Bleu de Chanel', 'price' => 6800, 'stock' => 25, 'sales_count' => 72, 'gender' => 'male', 'volume' => '100ml',
             'desc' => 'A woody aromatic fragrance for the man who defies convention.',
             'scent' => 'Citrus, Labdanum, Vetiver, Cedar'],
            // Dior
            ['name' => 'Dior Sauvage', 'price' => 5900, 'stock' => 40, 'sales_count' => 120, 'gender' => 'male', 'volume' => '100ml',
             'desc' => 'A raw, noble, and wild fragrance with a fresh and powerfully woody trail.',
             'scent' => 'Bergamot, Ambroxan, Vetiver, Patchouli'],
            ['name' => 'Miss Dior', 'price' => 6200, 'stock' => 22, 'sales_count' => 60, 'gender' => 'female', 'volume' => '100ml',
             'desc' => 'A floral and chypre fragrance that embodies couture femininity.',
             'scent' => 'Peony, Rose, Mandarin, Musk'],
            // Versace
            ['name' => 'Versace Eros', 'price' => 4500, 'stock' => 35, 'sales_count' => 95, 'gender' => 'male', 'volume' => '100ml',
             'desc' => 'A powerful, modern and sensual fragrance inspired by Greek mythology.',
             'scent' => 'Mint, Green Apple, Vanilla, Tonka Bean'],
            ['name' => 'Versace Bright Crystal', 'price' => 4200, 'stock' => 28, 'sales_count' => 68, 'gender' => 'female', 'volume' => '90ml',
             'desc' => 'A luscious blend of refreshing chilly yuzu and pomegranate.',
             'scent' => 'Yuzu, Pomegranate, Peony, Magnolia'],
            // Calvin Klein
            ['name' => 'CK One', 'price' => 2800, 'stock' => 50, 'sales_count' => 150, 'gender' => 'unisex', 'volume' => '100ml',
             'desc' => 'The original shared fragrance, fresh, clean and minimalist.',
             'scent' => 'Pineapple, Bergamot, Musk, Amber'],
            ['name' => 'CK Eternity', 'price' => 3200, 'stock' => 20, 'sales_count' => 45, 'gender' => 'unisex', 'volume' => '100ml',
             'desc' => 'A classic fragrance celebrating the joy of enduring love.',
             'scent' => 'Freesia, Lily of the Valley, Musk, Sandalwood'],
            // Armani
            ['name' => 'Armani Code', 'price' => 5500, 'stock' => 18, 'sales_count' => 80, 'gender' => 'male', 'volume' => '75ml',
             'desc' => 'The seductive power of ultimate sophistication.',
             'scent' => 'Bergamot, Guaiac Wood, Olive Blossom, Tonka Bean'],
            ['name' => 'Si by Giorgio Armani', 'price' => 5800, 'stock' => 15, 'sales_count' => 55, 'gender' => 'female', 'volume' => '100ml',
             'desc' => 'A modern fragrance for a modern, generous woman.',
             'scent' => 'Blackcurrant Nectar, Rose, Patchouli, Vanilla'],
            // Tom Ford
            ['name' => 'Tom Ford Black Orchid', 'price' => 9500, 'stock' => 12, 'sales_count' => 30, 'gender' => 'unisex', 'volume' => '50ml',
             'desc' => 'A luxurious and sensual fragrance of rare black truffle and orchid.',
             'scent' => 'Black Truffle, Ylang-ylang, Orchid, Sandalwood'],
            ['name' => 'Tom Ford Oud Wood', 'price' => 12000, 'stock' => 8, 'sales_count' => 18, 'gender' => 'unisex', 'volume' => '50ml',
             'desc' => 'The rare oud wood tree creates an air of pure exoticism.',
             'scent' => 'Oud, Sandalwood, Tonka Bean, Amber'],
            // Gucci
            ['name' => 'Gucci Bloom', 'price' => 5200, 'stock' => 22, 'sales_count' => 62, 'gender' => 'female', 'volume' => '100ml',
             'desc' => 'A rich floral fragrance full of vitality.',
             'scent' => 'Tuberose, Jasmine, Rangoon Creeper, Musk'],
            // Hugo Boss
            ['name' => 'Hugo Boss Bottled', 'price' => 3800, 'stock' => 33, 'sales_count' => 88, 'gender' => 'male', 'volume' => '100ml',
             'desc' => 'An iconic masculine fragrance for the man of today.',
             'scent' => 'Apple, Plum, Geranium, Cinnamon, Sandalwood'],
            // YSL
            ['name' => 'YSL Black Opium', 'price' => 5600, 'stock' => 20, 'sales_count' => 75, 'gender' => 'female', 'volume' => '90ml',
             'desc' => 'The rock \'n\' roll perfume for women. Addictive coffee and floral notes.',
             'scent' => 'Coffee, Vanilla, White Flowers, Pink Pepper'],
            // Burberry
            ['name' => 'Burberry Her', 'price' => 5400, 'stock' => 25, 'sales_count' => 60, 'gender' => 'female', 'volume' => '100ml',
             'desc' => 'A vibrant fruity gourmand capturing the spirit of London.',
             'scent' => 'Red Berries, Jasmine, Musk, Amber', 'seller_email' => 'luxe@perfumehub.com'],
            ['name' => 'Mr. Burberry', 'price' => 4800, 'stock' => 20, 'sales_count' => 40, 'gender' => 'male', 'volume' => '100ml',
             'desc' => 'A classic yet contemporary British fragrance for men.',
             'scent' => 'Grapefruit, Tarragon, Vetiver, Sandalwood', 'seller_email' => 'luxe@perfumehub.com'],
        ];

        // Category map by scent keywords
        $categoryMap = [
            'floral' => $categories->firstWhere('name', 'Floral'),
            'woody'  => $categories->firstWhere('name', 'Woody'),
            'fresh'  => $categories->firstWhere('name', 'Fresh'),
            'oriental' => $categories->firstWhere('name', 'Oriental'),
            'fruity' => $categories->firstWhere('name', 'Fruity'),
        ];

        $brandMap = [
            'Chanel' => $brands->firstWhere('name', 'Chanel'),
            'Dior'   => $brands->firstWhere('name', 'Dior'),
            'Versace' => $brands->firstWhere('name', 'Versace'),
            'Calvin Klein' => $brands->firstWhere('name', 'Calvin Klein'),
            'Giorgio Armani' => $brands->firstWhere('name', 'Giorgio Armani'),
            'Tom Ford' => $brands->firstWhere('name', 'Tom Ford'),
            'Gucci' => $brands->firstWhere('name', 'Gucci'),
            'Hugo Boss' => $brands->firstWhere('name', 'Hugo Boss'),
            'Yves Saint Laurent' => $brands->firstWhere('name', 'Yves Saint Laurent'),
            'Burberry' => $brands->firstWhere('name', 'Burberry'),
        ];

        $productBrandAssoc = [
            'Chanel N°5' => 'Chanel', 'Chanel Bleu de Chanel' => 'Chanel',
            'Dior Sauvage' => 'Dior', 'Miss Dior' => 'Dior',
            'Versace Eros' => 'Versace', 'Versace Bright Crystal' => 'Versace',
            'CK One' => 'Calvin Klein', 'CK Eternity' => 'Calvin Klein',
            'Armani Code' => 'Giorgio Armani', 'Si by Giorgio Armani' => 'Giorgio Armani',
            'Tom Ford Black Orchid' => 'Tom Ford', 'Tom Ford Oud Wood' => 'Tom Ford',
            'Gucci Bloom' => 'Gucci',
            'Hugo Boss Bottled' => 'Hugo Boss',
            'YSL Black Opium' => 'Yves Saint Laurent',
            'Burberry Her' => 'Burberry', 'Mr. Burberry' => 'Burberry',
        ];

        $productCategoryAssoc = [
            'Chanel N°5' => 'floral', 'Chanel Bleu de Chanel' => 'woody',
            'Dior Sauvage' => 'fresh', 'Miss Dior' => 'floral',
            'Versace Eros' => 'oriental', 'Versace Bright Crystal' => 'floral',
            'CK One' => 'fresh', 'CK Eternity' => 'floral',
            'Armani Code' => 'oriental', 'Si by Giorgio Armani' => 'floral',
            'Tom Ford Black Orchid' => 'woody', 'Tom Ford Oud Wood' => 'woody',
            'Gucci Bloom' => 'floral',
            'Hugo Boss Bottled' => 'woody',
            'YSL Black Opium' => 'oriental',
            'Burberry Her' => 'fruity', 'Mr. Burberry' => 'woody',
        ];

        $sampleImages = [
            'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&q=80',
            'https://images.unsplash.com/photo-1594035910387-fea081ac6bd0?w=400&q=80',
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80',
            'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&q=80',
            'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&q=80',
            'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&q=80',
            'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400&q=80',
            'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=400&q=80',
            'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80',
            'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80',
            'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&q=80',
            'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&q=80',
            'https://images.unsplash.com/photo-1619994403073-2cec844b8c63?w=400&q=80',
            'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&q=80',
            'https://images.unsplash.com/photo-1608528577891-eb055944f2e7?w=400&q=80',
        ];

        foreach ($products as $idx => $p) {
            $brandName = $productBrandAssoc[$p['name']] ?? 'Chanel';
            $catKey    = $productCategoryAssoc[$p['name']] ?? 'floral';
            $brand     = $brandMap[$brandName] ?? $brands->first();
            $category  = $categoryMap[$catKey] ?? $categories->first();
            
            $sellerEmail = $p['seller_email'] ?? null;
            if ($sellerEmail) {
                $seller = $sellers->firstWhere('email', $sellerEmail) ?? $sellers[$idx % $sellers->count()];
            } else {
                $seller = $sellers[$idx % $sellers->count()];
            }

            $product = Product::create([
                'seller_id'    => $seller->id,
                'brand_id'     => $brand->id,
                'category_id'  => $category->id,
                'name'         => $p['name'],
                'slug'         => Str::slug($p['name']) . '-' . ($idx + 1),
                'description'  => $p['desc'],
                'scent_notes'  => $p['scent'],
                'gender'       => $p['gender'],
                'volume_ml'    => $p['volume'],
                'price'        => $p['price'],
                'stock'        => $p['stock'],
                'sales_count'  => $p['sales_count'],
                'rating'       => round(3.8 + ($idx % 3) * 0.2, 1),
                'review_count' => rand(10, 60),
                'is_active'    => true,
                'is_featured'  => $idx < 4,
            ]);

            // Add a sample image URL (stored as external URL for seeding)
            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $sampleImages[$idx % count($sampleImages)],
                'is_primary' => true,
                'sort_order' => 0,
            ]);
        }
    }
}
