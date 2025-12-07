<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseOrderOnsite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Mengelola PO Onsite.
 */
class OnsiteController extends Controller
{
    /**
     * Daftar onsite.
     */
    public function index(Request $request, string $prefix)
    {
        $query = PurchaseOrderOnsite::with(['purchaseOrderItem.purchaseOrder.supplier'])
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    /**
     * Cari onsite berdasarkan keyword nomor PO atau ID item.
     */
    public function search(string $prefix, string $keyword)
    {
        $results = PurchaseOrderOnsite::with(['purchaseOrderItem.purchaseOrder'])
            ->whereHas('purchaseOrderItem.purchaseOrder', function ($q) use ($keyword) {
                $q->where('po_number', 'like', "%{$keyword}%");
            })
            ->orWhere('purchase_order_items_id', $keyword)
            ->latest()
            ->get();

        return response()->json($results);
    }

    /**
     * Simpan onsite.
     */
    public function store(Request $request, string $prefix)
    {
        $validated = $request->validate([
            'purchase_order_items_id' => 'required|exists:purchase_order_items,id',
            'onsite_date' => 'required|date',
            'sla_target' => 'nullable|integer',
            'sla_realization' => 'nullable|integer',
        ]);

        $data = array_merge($validated, [
            'created_by' => $request->user()?->id,
        ]);

        DB::beginTransaction();
        try {
            $onsite = PurchaseOrderOnsite::create($data);
            DB::commit();
            return response()->json(['message' => 'Onsite berhasil dibuat', 'data' => $onsite], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat onsite', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Detail onsite.
     */
    public function edit(string $prefix, PurchaseOrderOnsite $po_onsite)
    {
        return response()->json($po_onsite->load(['purchaseOrderItem.purchaseOrder']));
    }

    /**
     * Update onsite.
     */
    public function update(Request $request, string $prefix, PurchaseOrderOnsite $po_onsite)
    {
        $validated = $request->validate([
            'onsite_date' => 'required|date',
            'sla_target' => 'nullable|integer',
            'sla_realization' => 'nullable|integer',
        ]);

        DB::beginTransaction();
        try {
            $po_onsite->update($validated);
            DB::commit();
            return response()->json(['message' => 'Onsite berhasil diupdate', 'data' => $po_onsite]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengupdate onsite', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Hapus banyak onsite.
     */
    public function bulkDestroy(Request $request, string $prefix)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        PurchaseOrderOnsite::whereIn('id', $ids)->delete();
        return response()->json(['message' => 'Onsite berhasil dihapus']);
    }
}
