<?php

namespace Database\Seeders;

use App\Models\Purchase\PurchaseTracking;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PurchaseTrackingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            [
                'purchase_request_id' => 1,
                'purchase_order_id' => 1
            ],
            [
                'purchase_request_id' => 2,
                'purchase_order_id' => 1
            ],
            [
                'purchase_request_id' => 3,
                'purchase_order_id' => 2
            ],
            [
                'purchase_request_id' => 4,
                'purchase_order_id' => 2
            ],
            // Tambahkan baris lainnya dari tabel Excel yang kamu upload
        ];
        foreach ($data as $row) {
            PurchaseTracking::create([
                'purchase_request_id' => $row['purchase_request_id'],
                'purchase_order_id' => $row['purchase_order_id'],
            ]);
        }
    }
}
