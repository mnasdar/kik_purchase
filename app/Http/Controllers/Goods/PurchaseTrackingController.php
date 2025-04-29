<?php

namespace App\Http\Controllers\Goods;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Goods\PurchaseTracking;

class PurchaseTrackingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // 🔍 Validasi input
        $validated = $request->validate([
            'purchase_request_id' => 'required|integer',
            'purchase_order_id' => 'required|integer',
        ]);
        DB::beginTransaction();

        try {
            // 📝 Create Purchase Tracking pakai $validated
            $purchaseOrder = PurchaseTracking::create([
                'purchase_request_id' => $validated['purchase_request_id'],
                'purchase_order_id' => $validated['purchase_order_id'],
            ]);

            DB::commit();

            // 🔁 Response
            return response()->json([
                'success' => true,
                'message' => 'Status berhasil ditambahkan',
                'data' => $purchaseOrder,
                'id' => $purchaseOrder->id,
                'purchase_request_id' => $purchaseOrder->purchase_request_id,
                'purchase_order_id' => $purchaseOrder->purchase_order_id,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan data: ' . $e->getMessage(),
            ], 500);
        }
        
        
    }

    /**
     * Display the specified resource.
     */
    public function show(PurchaseTracking $purchaseTracking)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PurchaseTracking $purchaseTracking)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PurchaseTracking $purchaseTracking)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchaseTracking $purchaseTracking)
    {
        //
    }
}
