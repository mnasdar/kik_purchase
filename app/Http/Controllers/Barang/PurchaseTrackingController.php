<?php

namespace App\Http\Controllers\Barang;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Barang\PurchaseTracking;

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
        $request->validate([
            'po_id' => 'required|exists:purchase_orders,id',
            'ids' => 'required|array',
            'ids.*' => 'exists:purchase_requests,id'
        ]);

        $poId = $request->input('po_id');
        $prIds = $request->input('ids');

        DB::beginTransaction();

        try {
            // 📝 Create Purchase Tracking pakai $validated
            // Contoh: simpan relasi PR ke PO
            foreach ($prIds as $prId) {
                PurchaseTracking::create([
                    'purchase_request_id' => $prId,
                    'purchase_order_id' => $poId,
                ]);
            }

            DB::commit();

            // 🔁 Response
            return response()->json(['message' => 'Data berhasil dikaitkan.']);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
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
    public function bulkDestroy(Request $request)
    {
        // Validasi data yang dikirim
        $validated = $request->validate([
            'po_id' => 'required|exists:purchase_orders,id',
            'pr_id' => 'required|array|min:1',
            'pr_id.*' => 'integer|exists:purchase_requests,id'
        ]);

        try {   
            // Hapus berdasarkan kombinasi PO dan daftar PR
            PurchaseTracking::where('purchase_order_id', $validated['po_id'])
                ->whereIn('purchase_request_id', $validated['pr_id'])
                ->delete();

            return response()->json(['message' => 'Relasi berhasil dihapus.']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat menghapus data: ' . $e->getMessage(),
            ], 500);
        }
    }
}
