<?php

namespace Database\Seeders;

use App\Models\Config\Status;
use Illuminate\Database\Seeder;
use App\Models\Barang\PurchaseOrder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class PurchaseOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statusIds = Status::where('type','Barang')->pluck('id')->toArray();

        $data = [
            [
                'po_number' => 'KIK3600002066',
                'approved_date' => '2022-01-24',
                'supplier_name' => 'PT.KAWAUSO TEKNOLOGI INDONESIA',
                'unit_price' => 1250000,
                'quantity' => 1,
                'amount' => 1250000,
            ],
            [
                'po_number' => 'KIK3600002077',
                'approved_date' => '2022-01-27',
                'supplier_name' => 'PT.KAWAUSO TEKNOLOGI INDONESIA',
                'unit_price' => 590909,
                'quantity' => 1,
                'amount' => 590909,
            ],
            // Tambahkan baris lainnya dari tabel Excel yang kamu upload
        ];

        foreach ($data as $row) {
            PurchaseOrder::create([
                'po_number' => $row['po_number'],
                'approved_date' => $row['approved_date'],
                'supplier_name' => $row['supplier_name'],
                'unit_price' => $row['unit_price'],
                'quantity' => $row['quantity'],
                'amount' => $row['amount'],
                'status_id' => fake()->randomElement($statusIds),
            ]);
        }
    }
}
