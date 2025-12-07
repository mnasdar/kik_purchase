<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseTracking;
use Illuminate\Http\Request;

class PurchaseTrackingController extends Controller
{
    /**
     * Simpan relasi PR-PO.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_request_id' => 'required|exists:purchase_requests,id',
            'purchase_order_id' => 'required|exists:purchase_orders,id',
        ]);

        $tracking = PurchaseTracking::create($validated);
        return response()->json(['message' => 'Tracking berhasil dibuat', 'data' => $tracking], 201);
    }

    /**
     * Hapus banyak tracking.
     */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        PurchaseTracking::whereIn('id', $ids)->delete();
        return response()->json(['message' => 'Tracking berhasil dihapus']);
    }
}
