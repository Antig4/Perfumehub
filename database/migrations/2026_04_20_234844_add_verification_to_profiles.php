<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Seller: Business Permit verification
        Schema::table('seller_profiles', function (Blueprint $table) {
            $table->string('verification_document')->nullable()->after('status');   // file path
            $table->string('verification_document_url')->nullable()->after('verification_document'); // full URL accessor stored here
            $table->enum('verification_status', ['unverified', 'pending', 'verified', 'rejected'])
                  ->default('unverified')->after('verification_document_url');
            $table->text('verification_rejection_reason')->nullable()->after('verification_status');
            $table->timestamp('verified_at')->nullable()->after('verification_rejection_reason');
        });

        // Rider: Driving License verification
        Schema::table('rider_profiles', function (Blueprint $table) {
            $table->string('license_document')->nullable()->after('rating');
            $table->enum('verification_status', ['unverified', 'pending', 'verified', 'rejected'])
                  ->default('unverified')->after('license_document');
            $table->text('verification_rejection_reason')->nullable()->after('verification_status');
            $table->timestamp('verified_at')->nullable()->after('verification_rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('seller_profiles', function (Blueprint $table) {
            $table->dropColumn(['verification_document', 'verification_document_url', 'verification_status', 'verification_rejection_reason', 'verified_at']);
        });
        Schema::table('rider_profiles', function (Blueprint $table) {
            $table->dropColumn(['license_document', 'verification_status', 'verification_rejection_reason', 'verified_at']);
        });
    }
};
