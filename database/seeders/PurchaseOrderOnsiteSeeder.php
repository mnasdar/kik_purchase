<?php

namespace Database\Seeders;

use App\Models\Purchase\PurchaseOrderOnsite;
use App\Models\Purchase\PurchaseOrderItem;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Class PurchaseOrderOnsiteSeeder
 * Seeder untuk membuat data onsite dari item purchase order
 * 
 * @package Database\Seeders
 */
class PurchaseOrderOnsiteSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data purchase order onsite
     * 
     * @return void
     */
    public function run(): void
    {
        $user = User::first();
        $purchaseOrderItems = PurchaseOrderItem::all();

        foreach ($purchaseOrderItems as $item) {
            // Setiap item purchase order memiliki 1-2 onsite record
            $onsiteCount = rand(1, 2);
            
            for ($i = 0; $i < $onsiteCount; $i++) {
                $slaTaget = rand(3, 7);
                $slaRealization = rand(2, 8);

                PurchaseOrderOnsite::create([
                    'purchase_order_items_id' => $item->id,
                    'onsite_date' => now()->addDays(rand(1, 10))->toDateString(),
                    'sla_target' => $slaTaget,
                    'sla_realization' => $slaRealization,
                    'created_by' => $user?->id,
                ]);
            }
        }
    }
}
