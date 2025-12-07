<?php

namespace Database\Seeders;

use App\Models\Purchase\PurchaseTracking;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Purchase\PurchaseOrder;
use Illuminate\Database\Seeder;

/**
 * Class PurchaseTrackingSeeder
 * Seeder untuk membuat data tracking/relasi antara purchase request dan purchase order
 * 
 * @package Database\Seeders
 */
class PurchaseTrackingSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data purchase tracking
     * 
     * @return void
     */
    public function run(): void
    {
        $purchaseRequests = PurchaseRequest::all();
        $purchaseOrders = PurchaseOrder::all();

        foreach ($purchaseRequests as $index => $pr) {
            // Link purchase request dengan purchase order
            $po = $purchaseOrders->get($index);
            
            if ($po) {
                PurchaseTracking::create([
                    'purchase_request_id' => $pr->id,
                    'purchase_order_id' => $po->id,
                ]);
            }
        }
    }
}
