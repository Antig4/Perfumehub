<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingSeeder extends Seeder
{
    public function run()
    {
        $settings = [
            // General
            ['key' => 'site_name',     'value' => 'PerfumeHub',        'group' => 'general'],
            ['key' => 'site_tagline',  'value' => 'Your Fragrance Destination', 'group' => 'general'],
            ['key' => 'support_email', 'value' => 'support@perfumehub.com', 'group' => 'general'],
            // Payment
            ['key' => 'shipping_fee',  'value' => '100',               'group' => 'payment'],
            ['key' => 'currency',      'value' => 'PHP',               'group' => 'payment'],
            ['key' => 'min_order',     'value' => '500',               'group' => 'payment'],
            // Delivery
            ['key' => 'delivery_days', 'value' => '3-5',               'group' => 'delivery'],
            ['key' => 'cutoff_time',   'value' => '16:00',             'group' => 'delivery'],
        ];

        foreach ($settings as $s) {
            Setting::set($s['key'], $s['value'], $s['group']);
        }
    }
}
