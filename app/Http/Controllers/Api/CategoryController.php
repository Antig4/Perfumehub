<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Category::where('is_active', true)->get()]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:categories', 'description' => 'nullable|string']);
        $category = Category::create([
            'name'        => $request->name,
            'slug'        => Str::slug($request->name),
            'description' => $request->description,
            'icon'        => $request->icon,
        ]);
        return response()->json(['data' => $category, 'message' => 'Category created.'], 201);
    }

    public function update(Request $request, Category $category)
    {
        $category->update($request->only(['name', 'description', 'icon', 'is_active']));
        return response()->json(['data' => $category, 'message' => 'Category updated.']);
    }

    public function destroy(Category $category)
    {
        $category->update(['is_active' => false]);
        return response()->json(['message' => 'Category disabled.']);
    }
}
