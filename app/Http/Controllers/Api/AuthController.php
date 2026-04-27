<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cart;
use App\Models\SellerProfile;
use App\Models\RiderProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role'     => ['required', Rule::in(['customer', 'seller', 'rider'])],
            'phone'    => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
            'phone'    => $request->phone,
        ]);

        // Auto-create cart for customers
        if ($user->role === 'customer') {
            Cart::create(['user_id' => $user->id]);
        }

        // Create seller/rider profile placeholder
        if ($user->role === 'seller') {
            SellerProfile::create([
                'user_id'    => $user->id,
                'store_name' => $request->store_name ?? $user->name . "'s Store",
                'store_slug' => \Str::slug(($request->store_name ?? $user->name . 's-store') . '-' . $user->id),
                'status'     => 'pending',
            ]);
        }

        if ($user->role === 'rider') {
            RiderProfile::create([
                'user_id'       => $user->id,
                'vehicle_type'  => $request->vehicle_type ?? 'Motorcycle',
                'vehicle_plate' => $request->vehicle_plate,
                'is_available'  => true,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'         => $this->formatUser($user),
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been suspended.'], 403);
        }

        $user->tokens()->delete(); // revoke old tokens
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'         => $this->formatUser($user),
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $this->formatUser($request->user())]);
    }

    private function formatUser(User $user): array
    {
        $data = $user->toArray();
        $data['avatar_url'] = $user->avatar_url;
        if ($user->role === 'seller') {
            $data['seller_profile'] = $user->sellerProfile;
        }
        if ($user->role === 'rider') {
            $data['rider_profile'] = $user->riderProfile;
        }
        return $data;
    }
}
