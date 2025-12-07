<?php

namespace Database\Seeders;

use App\Models\Purchase\PurchaseOrder;
use App\Models\Config\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Class PurchaseOrderSeeder
 * Seeder untuk membuat data purchase order
 * 
 * @package Database\Seeders
 */
class PurchaseOrderSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data purchase order
     * 
     * @return void
     */
    public function run(): void
    {
        $user = User::first();
        $suppliers = Supplier::all();

        $purchaseOrders = [
            [
                'po_number' => 'PO-2025-001',
                'approved_date' => now()->subDays(8)->toDateString(),
                'supplier_id' => $suppliers->random()->id,
                'notes' => 'Purchase order untuk office supplies',
                'created_by' => $user?->id,
            ],
            [
                'po_number' => 'PO-2025-002',
                'approved_date' => now()->subDays(3)->toDateString(),
                'supplier_id' => $suppliers->random()->id,
                'notes' => 'Purchase order untuk peralatan kantor',
                'created_by' => $user?->id,
            ],
            [
                'po_number' => 'PO-2025-003',
                'approved_date' => now()->subDays(1)->toDateString(),
                'supplier_id' => $suppliers->random()->id,
                'notes' => 'Purchase order untuk konsultasi',
                'created_by' => $user?->id,
            ],
            [
                'po_number' => 'PO-2025-004',
                'approved_date' => now()->subHours(12)->toDateString(),
                'supplier_id' => $suppliers->random()->id,
                'notes' => 'Purchase order untuk hardware',
                'created_by' => $user?->id,
            ],
        ];

        foreach ($purchaseOrders as $po) {
            PurchaseOrder::create($po);
        }
    }
}
