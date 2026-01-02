<?php

namespace Database\Seeders;

use App\Models\Purchase\PurchaseRequest;
use App\Models\Config\Location;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Class PurchaseRequestSeeder
 * Seeder untuk membuat data purchase request
 * 
 * @package Database\Seeders
 */
class PurchaseRequestSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data purchase request
     * 
     * @return void
     */
    public function run(): void
    {
        $user = User::first();
        $location = Location::first();

        $purchaseRequests = [
            [
                'request_type' => 'barang',
                'pr_number' => 'PR-2025-001',
                'location_id' => $location?->id,
                'approved_date' => now()->subDays(10)->toDateString(),
                'notes' => 'Pembelian office supplies untuk kantor pusat',
                'created_by' => $user?->id,
                'current_stage' => 1,
            ],
            [
                'request_type' => 'jasa',
                'pr_number' => 'PR-2025-002',
                'location_id' => $location?->id,
                'approved_date' => now()->subDays(7)->toDateString(),
                'notes' => 'Layanan konsultasi dan audit',
                'created_by' => $user?->id,
                'current_stage' => 2,
            ],
            [
                'request_type' => 'barang',
                'pr_number' => 'PR-2025-003',
                'location_id' => $location?->id,
                'approved_date' => now()->subDays(3)->toDateString(),
                'notes' => 'Pembelian peralatan kantor dan furniture',
                'created_by' => $user?->id,
                'current_stage' => 3,
            ],
        ];

        foreach ($purchaseRequests as $pr) {
            PurchaseRequest::create($pr);
        }
    }
}
