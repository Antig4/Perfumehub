<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLatLngToDeliveriesTable extends Migration
{
    public function up()
    {
        Schema::table('deliveries', function (Blueprint $table) {
            // Use nullable decimals for latitude/longitude (sufficient precision for UI links)
            $table->decimal('lat', 10, 7)->nullable()->after('delivery_address');
            $table->decimal('lng', 10, 7)->nullable()->after('lat');
        });
    }

    public function down()
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng']);
        });
    }
}
