<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Goods\PurchaseTracking;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class PurchaseTrackingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $trackings = [
            ['pr_number' => 'KIK0000004013', 'po_number' => 'KIK3600002066'],
            ['pr_number' => 'KIK0000004055', 'po_number' => 'KIK3600002077'],
            ['pr_number' => 'KIK0000004113', 'po_number' => 'KIK3600002103'],
            ['pr_number' => 'KIK0000004437', 'po_number' => 'KIK3600002240'],
        ];

        foreach ($trackings as $data) {
            PurchaseTracking::firstOrCreate([
                'pr_number' => $data['pr_number'],
                'po_number' => $data['po_number'],
                'receipt_number' => null
            ]);
        }
    }
}
