<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function profile(Request $request)
    {
        $user = $request->user()->load(['sellerProfile', 'riderProfile']);
        $data = $user->toArray();
        $data['avatar_url'] = $user->avatar_url;
        return response()->json(['user' => $data]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'name'    => 'sometimes|string|max:255',
            'phone'   => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['name', 'phone', 'address']));

        return response()->json(['user' => $user->fresh(), 'message' => 'Profile updated.']);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048']);
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'avatar_url' => $user->avatar_url,
            'message'    => 'Avatar updated.',
        ]);
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 400);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    // Admin: list all users
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->role) $query->where('role', $request->role);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $users = $query->with(['sellerProfile', 'riderProfile'])->paginate(15);
        return response()->json($users);
    }

    // Admin: toggle user active status
    public function toggleStatus(User $user)
    {
        $user->update(['is_active' => !$user->is_active]);
        return response()->json(['message' => 'Status updated.', 'is_active' => $user->is_active]);
    }

    // Admin: reset password
    public function resetPassword(Request $request, User $user)
    {
        $request->validate(['password' => 'required|string|min:8|confirmed']);
        $user->update(['password' => Hash::make($request->password)]);
        return response()->json(['message' => 'Password reset successfully.']);
    }
}
