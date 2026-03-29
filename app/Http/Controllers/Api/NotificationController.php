<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Notification::where('user_id', $user->id)->orderByDesc('created_at');
        return response()->json($query->paginate(20));
    }

    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Marked read.', 'data' => $notification]);
    }

    // Mark all notifications for the authenticated user as read
    public function markAllRead(Request $request)
    {
        $user = $request->user();
        try {
            \App\Models\Notification::where('user_id', $user->id)->whereNull('read_at')->update(['read_at' => now()]);
            return response()->json(['message' => 'All notifications marked as read.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to mark all as read.'], 500);
        }
    }
}
