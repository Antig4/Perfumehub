<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRiderProfilesTable extends Migration
{
    public function up()
    {
        Schema::create('rider_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('vehicle_type', 50)->nullable();
            $table->string('vehicle_plate', 20)->nullable();
            $table->boolean('is_available')->default(true);
            $table->integer('total_deliveries')->default(0);
            $table->decimal('rating', 2, 1)->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('rider_profiles');
    }
}
