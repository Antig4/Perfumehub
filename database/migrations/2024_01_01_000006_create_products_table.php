<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductsTable extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('brand_id')->constrained('brands')->onDelete('restrict');
            $table->foreignId('category_id')->constrained('categories')->onDelete('restrict');
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('scent_notes')->nullable();
            $table->string('gender', 20)->default('unisex'); // male, female, unisex
            $table->string('volume_ml', 20)->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('original_price', 10, 2)->nullable();
            $table->integer('stock')->default(0);
            $table->integer('low_stock_threshold')->default(5);
            $table->integer('sales_count')->default(0);
            $table->integer('view_count')->default(0);
            $table->decimal('rating', 2, 1)->default(0);
            $table->integer('review_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
}
