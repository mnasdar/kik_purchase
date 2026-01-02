<?php

namespace Database\Seeders;

use App\Models\Purchase\PurchaseOrderItem;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseRequestItem;
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
        
        // Ambil semua PR items yang tersedia untuk di-link (opsional)
        $prItems = PurchaseRequestItem::all();

        foreach ($purchaseOrders as $po) {
            // Buat 2-3 item untuk setiap purchase order
            $itemCount = rand(2, 3);
            
            for ($i = 0; $i < $itemCount; $i++) {
                $unitPrice = rand(40000, 400000);
                $quantity = rand(1, 25);
                $amount = $unitPrice * $quantity;

                // Ambil random PR item jika ada, atau null (70% chance ada relasi)
                $prItemId = null;
                $prAmount = null;
                if ($prItems->isNotEmpty() && rand(1, 100) <= 70) {
                    $pickedPrItem = $prItems->random();
                    $prItemId = $pickedPrItem->id;
                    $prAmount = $pickedPrItem->amount;
                }

                // Jika tidak ada PR reference, gunakan angka random untuk simulasi saving
                $prAmount = $prAmount ?? ($amount + rand(50000, 200000));
                $costSaving = $prAmount - $amount;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'purchase_request_item_id' => $prItemId,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'amount' => $amount,
                    'cost_saving' => $costSaving,
                    'sla_po_to_onsite_target' => 5,
                    'sla_pr_to_po_realization' => rand(3, 7),
                ]);
            }
        }
    }
}
