<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_order_onsites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_items_id')->constrained()->cascadeOnDelete();
            $table->date('onsite_date');
            $table->integer('sla_po_to_onsite_realization')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_order_onsites');
    }
};
