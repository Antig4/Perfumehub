<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDeliveriesTable extends Migration
{
    public function up()
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('rider_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['pending', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed'])->default('pending');
            $table->text('delivery_address');
            $table->string('recipient_name')->nullable();
            $table->string('recipient_phone', 20)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('deliveries');
    }
}
