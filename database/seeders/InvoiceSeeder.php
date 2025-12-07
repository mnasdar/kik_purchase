<?php

namespace Database\Seeders;

use App\Models\Invoice\Invoice;
use App\Models\Purchase\PurchaseOrder;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Class InvoiceSeeder
 * Seeder untuk membuat data invoice dari supplier
 * 
 * @package Database\Seeders
 */
class InvoiceSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data invoice
     * 
     * @return void
     */
    public function run(): void
    {
        $user = User::first();
        $purchaseOrders = PurchaseOrder::all();

        foreach ($purchaseOrders->take(3) as $po) {
            $submissionSlaTarget = 5;
            $receivedDate = now()->subDays(rand(1, 5))->toDateString();
            $submittedDate = now()->subDays(rand(0, 4))->toDateString();
            
            $slaRealization = null;
            if ($submittedDate && $receivedDate) {
                $slaRealization = \Carbon\Carbon::parse($submittedDate)
                    ->diffInDays(\Carbon\Carbon::parse($receivedDate));
            }

            Invoice::create([
                'purchase_order_id' => $po->id,
                'invoice_number' => 'INV-' . date('Y') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
                'invoice_received_at' => $receivedDate,
                'invoice_submitted_at' => $submittedDate,
                'submission_sla_target' => $submissionSlaTarget,
                'submission_sla_realization' => $slaRealization,
                'created_by' => $user?->id,
            ]);
        }
    }
}
