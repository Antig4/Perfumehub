<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSellerProfilesTable extends Migration
{
    public function up()
    {
        Schema::create('seller_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('store_name');
            $table->string('store_slug')->unique();
            $table->text('description')->nullable();
            $table->string('banner')->nullable();
            $table->string('logo')->nullable();
            $table->decimal('rating', 2, 1)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->integer('total_sales')->default(0);
            $table->enum('status', ['pending', 'approved', 'suspended'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->string('business_address')->nullable();
            $table->string('business_phone', 20)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('seller_profiles');
    }
}
