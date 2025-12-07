<?php

namespace Database\Seeders;

use App\Models\Purchase\PurchaseOrderItem;
use App\Models\Purchase\PurchaseOrder;
use Illuminate\Database\Seeder;

/**
 * Class PurchaseOrderItemSeeder
 * Seeder untuk membuat data item/detail purchase order
 * 
 * @package Database\Seeders
 */
class PurchaseOrderItemSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data item purchase order
     * 
     * @return void
     */
    public function run(): void
    {
        $purchaseOrders = PurchaseOrder::all();

        foreach ($purchaseOrders as $po) {
            // Buat 2-3 item untuk setiap purchase order
            $itemCount = rand(2, 3);
            
            for ($i = 0; $i < $itemCount; $i++) {
                $unitPrice = rand(40000, 400000);
                $quantity = rand(1, 25);
                $amount = $unitPrice * $quantity;
                $prAmount = $amount + rand(50000, 200000);
                $costSaving = $prAmount - $amount;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'amount' => $amount,
                    'cost_saving' => $costSaving,
                    'sla_target' => 5,
                    'sla_realization' => rand(3, 7),
                ]);
            }
        }
    }
}
