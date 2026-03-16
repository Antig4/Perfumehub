<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
    private function paymongoHeaders(): array
    {
        $secretKey = config('services.paymongo.secret_key');
        return [
            'Authorization' => 'Basic ' . base64_encode($secretKey . ':'),
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ];
    }

    public function createIntent(Request $request)
    {
        $request->validate([
            'order_id'       => 'required|exists:orders,id',
            'payment_method' => 'required|in:gcash,card',
        ]);

        $order = Order::findOrFail($request->order_id);

        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $amountInCentavos = intval($order->total * 100);

        // Create Payment Intent
        $response = Http::withHeaders($this->paymongoHeaders())
            ->post('https://api.paymongo.com/v1/payment_intents', [
                'data' => [
                    'attributes' => [
                        'amount'               => $amountInCentavos,
                        'payment_method_allowed' => $request->payment_method === 'gcash' ? ['gcash'] : ['card'],
                        'currency'             => 'PHP',
                        'description'          => "PerfumeHub Order #{$order->order_number}",
                        'capture_type'         => 'automatic',
                    ],
                ],
            ]);

        if (!$response->successful()) {
            return response()->json(['message' => 'Failed to create payment intent.', 'error' => $response->json()], 422);
        }

        $intentData = $response->json()['data'];

        $order->update(['paymongo_payment_intent_id' => $intentData['id']]);

        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'paymongo_payment_intent_id' => $intentData['id'],
                'amount'  => $order->total,
                'method'  => $request->payment_method,
                'status'  => 'pending',
            ]
        );

        return response()->json([
            'client_key'       => $intentData['attributes']['client_key'],
            'payment_intent_id' => $intentData['id'],
        ]);
    }

    public function attachMethod(Request $request)
    {
        $request->validate([
            'payment_intent_id'  => 'required|string',
            'payment_method_id'  => 'required|string',
            'return_url'         => 'required|url',
        ]);

        $response = Http::withHeaders($this->paymongoHeaders())
            ->post("https://api.paymongo.com/v1/payment_intents/{$request->payment_intent_id}/attach", [
                'data' => [
                    'attributes' => [
                        'payment_method' => $request->payment_method_id,
                        'return_url'     => $request->return_url,
                    ],
                ],
            ]);

        if (!$response->successful()) {
            return response()->json(['message' => 'Payment attachment failed.', 'error' => $response->json()], 422);
        }

        $data = $response->json()['data'];
        $status = $data['attributes']['status'];

        // If payment is already paid
        if ($status === 'succeeded') {
            $this->handlePaymentSuccess($request->payment_intent_id);
        }

        return response()->json([
            'status'       => $status,
            'next_action'  => $data['attributes']['next_action'] ?? null,
        ]);
    }

    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Paymongo-Signature');

        // Verify webhook signature
        $webhookSecret = config('services.paymongo.webhook_secret');
        [$timestamp, $testSig, $liveSig] = array_pad(explode(',', $signature), 3, null);
        $ts = explode('=', $timestamp)[1] ?? '';
        $expectedSig = hash_hmac('sha256', $ts . '.' . $payload, $webhookSecret);

        $receivedSig = explode('=', $testSig ?? '')[1] ?? '';

        if (!hash_equals($expectedSig, $receivedSig)) {
            return response()->json(['message' => 'Invalid signature.'], 400);
        }

        $event = json_decode($payload, true);
        $eventType = $event['data']['attributes']['type'] ?? '';

        if ($eventType === 'payment.paid') {
            $paymentIntentId = $event['data']['attributes']['data']['attributes']['payment_intent_id'] ?? null;
            if ($paymentIntentId) {
                $this->handlePaymentSuccess($paymentIntentId);
            }
        }

        return response()->json(['received' => true]);
    }

    private function handlePaymentSuccess(string $paymentIntentId): void
    {
        $order = Order::where('paymongo_payment_intent_id', $paymentIntentId)->first();
        if ($order) {
            $order->update([
                'payment_status' => 'paid',
                'status'         => 'confirmed',
            ]);
            Payment::where('paymongo_payment_intent_id', $paymentIntentId)
                ->update(['status' => 'paid']);

            // Increment sales count for each product
            foreach ($order->items as $item) {
                if ($item->product) { $item->product->increment('sales_count', $item->quantity); }
                $seller = $item->seller;
                if ($seller && $seller->sellerProfile) {
                    $seller->sellerProfile->increment('total_sales', $item->quantity);
                }
            }
        }
    }
}
