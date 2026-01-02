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
                'supplier_id' => $suppliers->random()->id,
                'approved_date' => now()->subDays(12)->toDateString(),
                'notes' => 'Purchase order untuk office supplies',
                'created_by' => $user?->id,
            ],
            [
                'po_number' => 'PO-2025-002',
                'supplier_id' => $suppliers->random()->id,
                'approved_date' => now()->subDays(9)->toDateString(),
                'notes' => 'Purchase order untuk peralatan kantor',
                'created_by' => $user?->id,
            ],
            [
                'po_number' => 'PO-2025-003',
                'supplier_id' => $suppliers->random()->id,
                'approved_date' => now()->subDays(6)->toDateString(),
                'notes' => 'Purchase order untuk konsultasi',
                'created_by' => $user?->id,
            ],
            [
                'po_number' => 'PO-2025-004',
                'supplier_id' => $suppliers->random()->id,
                'approved_date' => now()->subDays(3)->toDateString(),
                'notes' => 'Purchase order untuk hardware',
                'created_by' => $user?->id,
            ],
        ];

        foreach ($purchaseOrders as $po) {
            PurchaseOrder::create($po);
        }
    }
}
