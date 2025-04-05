<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('pr_number')->index(); // Pastikan ini string
            $table->foreign('pr_number')->references('pr_number')->on('purchase_trackings')->onDelete('cascade');
            $table->foreignId('status_id')->references('id')->on('statuses')->onDelete('set null');
            $table->foreignId('classification_id')->references('id')->on('classifications')->onDelete('set null');
            $table->string('location');
            $table->string('item_desc');
            $table->string('uom');
            $table->date('approved_date');
            $table->decimal('unit_price', 15, 2);
            $table->integer('quantity');
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
