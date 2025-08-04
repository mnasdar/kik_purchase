<?php

namespace Database\Seeders;

use App\Models\Config\Status;
use Illuminate\Database\Seeder;
use App\Models\Config\Classification;
use App\Models\Barang\PurchaseRequest;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class PurchaseRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statusIds = Status::where('type','barang')->pluck('id')->toArray();
        $classification = Classification::where('name', 'Pengadaan Perlengkapan Kantor')->first();

        $data = [
            [
                'pr_number' => 'KIK0000004013',
                'location' => 'Head Office',
                'item_desc' => 'IC POWER LAPTOP HP',
                'uom' => 'EA',
                'approved_date' => '2025-07-12',
                'unit_price' => 1300000,
                'quantity' => 1,
                'amount' => 1300000,
            ],
            [
                'pr_number' => 'KIK0000004055',
                'location' => 'Head Office',
                'item_desc' => 'POWER SUPPLY (PA-LGA-450W)',
                'uom' => 'EA',
                'approved_date' => '2025-07-22',
                'unit_price' => 927273,
                'quantity' => 1,
                'amount' => 927273,
            ],
            [
                'pr_number' => 'KIK0000004055',
                'location' => 'Head Office',
                'item_desc' => 'MEMORY RAM 4GB DDR3 MERK COSAIR',
                'uom' => 'EA',
                'approved_date' => '2025-07-23',
                'unit_price' => 363636,
                'quantity' => 1,
                'amount' => 363636,
            ],
            [
                'pr_number' => 'KIK0000004113',
                'location' => 'Head Office',
                'item_desc' => 'Charger Laptop Merk HP14s-cf2',
                'uom' => 'Unit',
                'approved_date' => '2025-07-20',
                'unit_price' => 850000,
                'quantity' => 1,
                'amount' => 850000,
            ],
            // Tambahkan baris lainnya sesuai file
        ];

        foreach ($data as $row) {
            PurchaseRequest::create([
                'pr_number' => $row['pr_number'],
                'location' => $row['location'],
                'item_desc' => $row['item_desc'],
                'uom' => $row['uom'],
                'approved_date' => $row['approved_date'],
                'unit_price' => $row['unit_price'],
                'quantity' => $row['quantity'],
                'amount' => $row['amount'],
                'status_id' => fake()->randomElement($statusIds),
                'classification_id' => $classification->id,
            ]);
        }
    }
}
