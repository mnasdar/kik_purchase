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
        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classification_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('purchase_request_id')->nullable()->constrained()->nullOnDelete();
            $table->string('item_desc');
            $table->string('uom');
            $table->decimal('unit_price', 15, 2);
            $table->integer('quantity');
            $table->decimal('amount', 15, 2);
            $table->integer('sla_pr_to_po_target')->nullable();
            $table->integer('current_stage')->default(1)->comment('1=PR Created, 2=PO Linked to PR, 3=PO Onsite, 4=Invoice Received, 5=Invoice Submitted, 6=Payment, 7=Completed');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
    }
};
