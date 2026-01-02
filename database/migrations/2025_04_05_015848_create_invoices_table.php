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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_onsite_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_number')->nullable();
            $table->date('invoice_received_at')->nullable()->comment('Tanggal invoice diterima dari vendor');
            $table->integer('sla_invoice_to_finance_target')->default(5)->comment('Target hari pengajuan invoice');
            $table->date('invoice_submitted_at')->nullable()->comment('Tanggal invoice pengajuan ke finance');
            $table->integer('sla_invoice_to_finance_realization')->nullable();
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
        Schema::dropIfExists('invoices');
    }
};
