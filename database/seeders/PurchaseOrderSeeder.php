<?php

namespace Database\Seeders;

use App\Models\Goods\Status;
use Illuminate\Database\Seeder;
use App\Models\Goods\PurchaseOrder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class PurchaseOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statusIds = Status::pluck('id')->toArray();

        $data = [
            [
                'po_number' => 'KIK3600002066',
                'location' => 'HEAD OFFICE KIK.',
                'item_desc' => 'IC POWER LAPTOP HP',
                'uom' => 'EA',
                'approved_date' => '2022-01-24',
                'unit_price' => 1250000,
                'quantity' => 1,
                'amount' => 1250000,
            ],
            [
                'po_number' => 'KIK3600002077',
                'location' => 'HEAD OFFICE KIK.',
                'item_desc' => 'POWER SUPPLY (PA-LGA-450W)',
                'uom' => 'EA',
                'approved_date' => '2022-01-27',
                'unit_price' => 590909,
                'quantity' => 1,
                'amount' => 590909,
            ],
            // Tambahkan baris lainnya dari tabel Excel yang kamu upload
        ];

        foreach ($data as $row) {
            PurchaseOrder::create([
                'po_number' => $row['po_number'],
                'location' => $row['location'],
                'item_desc' => $row['item_desc'],
                'uom' => $row['uom'],
                'approved_date' => $row['approved_date'],
                'unit_price' => $row['unit_price'],
                'quantity' => $row['quantity'],
                'amount' => $row['amount'],
                'status_id' => fake()->randomElement($statusIds),
            ]);
        }
    }
}
