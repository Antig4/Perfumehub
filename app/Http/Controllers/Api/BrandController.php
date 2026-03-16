<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Brand::where('is_active', true)->get()]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|unique:brands',
            'description' => 'nullable|string',
            'logo'        => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $data = ['name' => $request->name, 'slug' => Str::slug($request->name), 'description' => $request->description];
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('brands', 'public');
        }

        $brand = Brand::create($data);
        return response()->json(['data' => $brand, 'message' => 'Brand created.'], 201);
    }

    public function update(Request $request, Brand $brand)
    {
        $brand->update($request->only(['name', 'description', 'country_of_origin', 'is_active']));
        if ($request->hasFile('logo')) {
            $brand->update(['logo' => $request->file('logo')->store('brands', 'public')]);
        }
        return response()->json(['data' => $brand, 'message' => 'Brand updated.']);
    }

    public function destroy(Brand $brand)
    {
        $brand->update(['is_active' => false]);
        return response()->json(['message' => 'Brand disabled.']);
    }
}
