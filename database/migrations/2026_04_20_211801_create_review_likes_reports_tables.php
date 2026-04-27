<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReviewLikesReportsTables extends Migration
{
    public function up()
    {
        // Track which users liked which review
        Schema::create('review_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->unique(['review_id', 'user_id']);
        });

        // Track review reports
        Schema::create('review_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('reason'); // scam, spam, hate_speech, bullying, pornography, illegal, other
            $table->text('description')->nullable();
            $table->string('status')->default('pending'); // pending, reviewed, dismissed
            $table->timestamps();
            $table->unique(['review_id', 'user_id']); // one report per user per review
        });
    }

    public function down()
    {
        Schema::dropIfExists('review_reports');
        Schema::dropIfExists('review_likes');
    }
}
