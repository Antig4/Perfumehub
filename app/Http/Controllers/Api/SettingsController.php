<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->groupBy('group');
        return response()->json(['data' => $settings]);
    }

    public function update(Request $request)
    {
        $request->validate(['settings' => 'required|array', 'settings.*.key' => 'required|string', 'settings.*.value' => 'nullable']);

        foreach ($request->settings as $setting) {
            Setting::set($setting['key'], $setting['value'], $setting['group'] ?? 'general');
        }

        return response()->json(['message' => 'Settings updated.']);
    }
}
