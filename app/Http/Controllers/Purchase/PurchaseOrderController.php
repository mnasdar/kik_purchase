<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Mengelola Purchase Order.
 */
class PurchaseOrderController extends Controller
{
    /**
     * Daftar PO.
     */
    public function index(Request $request, string $prefix)
    {
        $query = PurchaseOrder::with(['supplier', 'creator'])
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    /**
     * Data PO untuk tabel.
     */
    public function getData(Request $request, string $prefix)
    {
        $query = PurchaseOrder::with(['supplier', 'creator'])
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    /**
     * PR yang siap dikonversi menjadi PO.
     */
    public function showpr(string $prefix)
    {
        $prs = PurchaseRequest::where('request_type', $prefix)
            ->latest()
            ->get(['id', 'pr_number', 'request_type', 'approved_date']);

        return response()->json($prs);
    }

    /**
     * Simpan PO baru.
     */
    public function store(Request $request, string $prefix)
    {
        $validated = $request->validate([
            'po_number' => 'required|string|max:100|unique:purchase_orders,po_number',
            'approved_date' => 'required|date',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'notes' => 'nullable|string',
        ]);

        $data = array_merge($validated, [
            'created_by' => $request->user()?->id,
        ]);

        DB::beginTransaction();
        try {
            $po = PurchaseOrder::create($data);
            DB::commit();
            return response()->json(['message' => 'PO berhasil dibuat', 'data' => $po], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat PO', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Detail PO.
     */
    public function edit(string $prefix, PurchaseOrder $purchase_order)
    {
        return response()->json($purchase_order->load(['items', 'supplier', 'creator']));
    }

    /**
     * Update PO.
     */
    public function update(Request $request, string $prefix, PurchaseOrder $purchase_order)
    {
        $validated = $request->validate([
            'po_number' => 'required|string|max:100|unique:purchase_orders,po_number,' . $purchase_order->id,
            'approved_date' => 'required|date',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $purchase_order->update($validated);
            DB::commit();
            return response()->json(['message' => 'PO berhasil diupdate', 'data' => $purchase_order]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengupdate PO', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Soft delete banyak PO.
     */
    public function bulkDestroy(Request $request, string $prefix)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        PurchaseOrder::whereIn('id', $ids)->delete();
        return response()->json(['message' => 'PO berhasil dihapus']);
    }
}
