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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->index();
            $table->foreignId('status_id')->nullable()->constrained()->nullOnDelete();
            $table->date('approved_date');
            $table->string('supplier_name');
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('amount', 15, 2);
            $table->date('received_at')->nullable();
            $table->foreignId('submission_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
