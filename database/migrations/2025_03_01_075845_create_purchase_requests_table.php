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
            $table->enum('request_type', ['barang', 'jasa']);
            $table->string('pr_number')->unique();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->date('approved_date');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('current_stage')->default(1)->comment('1=PR Created, 2=PO Created, 3=PO Linked to PR, 4=PO Onsite, 5=Invoice Received, 7=Invoice Submitted, 8=Payment, 9=Completed');
            $table->timestamps();
            $table->softDeletes();
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
