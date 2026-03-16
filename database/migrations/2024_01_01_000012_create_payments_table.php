<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentsTable extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('paymongo_payment_id')->nullable();
            $table->string('paymongo_payment_intent_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('PHP');
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->enum('method', ['gcash', 'card'])->default('card');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
}
