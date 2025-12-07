<?php

namespace Database\Seeders;

use App\Models\Purchase\PurchaseRequestItem;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Config\Classification;
use Illuminate\Database\Seeder;

/**
 * Class PurchaseRequestItemSeeder
 * Seeder untuk membuat data item/detail purchase request
 * 
 * @package Database\Seeders
 */
class PurchaseRequestItemSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data item purchase request
     * 
     * @return void
     */
    public function run(): void
    {
        $purchaseRequests = PurchaseRequest::all();
        $classifications = Classification::all();

        foreach ($purchaseRequests as $pr) {
            // Buat 2-3 item untuk setiap purchase request
            $itemCount = rand(2, 3);
            
            for ($i = 0; $i < $itemCount; $i++) {
                $unitPrice = rand(50000, 500000);
                $quantity = rand(1, 20);
                $amount = $unitPrice * $quantity;

                PurchaseRequestItem::create([
                    'classification_id' => $classifications->random()->id,
                    'purchase_request_id' => $pr->id,
                    'item_desc' => 'Item ' . ($i + 1) . ' dari PR ' . $pr->pr_number,
                    'uom' => 'Unit',
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'amount' => $amount,
                ]);
            }
        }
    }
}
