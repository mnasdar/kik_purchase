<?php

namespace Database\Seeders;

use App\Models\Invoice\Payment;
use App\Models\Invoice\Invoice;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Class PaymentSeeder
 * Seeder untuk membuat data pembayaran invoice
 * 
 * @package Database\Seeders
 */
class PaymentSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data pembayaran
     * 
     * @return void
     */
    public function run(): void
    {
        $user = User::first();
        $invoices = Invoice::all();

        foreach ($invoices as $invoice) {
            $paymentSlaTarget = 7;
            $paymentDate = now()->subDays(rand(0, 3))->toDateString();
            
            $slaRealization = null;
            if ($invoice->invoice_submitted_at && $paymentDate) {
                $slaRealization = \Carbon\Carbon::parse($paymentDate)
                    ->diffInDays(\Carbon\Carbon::parse($invoice->invoice_submitted_at));
            }

            Payment::create([
                'invoice_id' => $invoice->id,
                'payment_number' => 'PAY-' . date('Y') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
                'payment_date' => $paymentDate,
                'payment_sla_target' => $paymentSlaTarget,
                'payment_sla_realization' => $slaRealization,
                'created_by' => $user?->id,
            ]);
        }
    }
}
