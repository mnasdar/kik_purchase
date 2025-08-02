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
            $table->string('onsite_number')->index();
            $table->foreignId('purchase_order_id')->nullable()->constrained()->onDelete('no action');
            $table->date('tgl_terima');
            $table->timestamps();
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
