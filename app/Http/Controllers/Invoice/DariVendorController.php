<?php

namespace App\Http\Controllers\Invoice;

use App\Http\Controllers\Controller;
use App\Models\Invoice\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Mencatat invoice yang diterima dari vendor.
 */
class DariVendorController extends Controller
{
    public function index()
    {
        $invoices = Invoice::with(['purchaseOrder', 'creator'])->latest()->paginate(15);
        return response()->json($invoices);
    }

    public function search(string $keyword)
    {
        $invoices = Invoice::with('purchaseOrder')
            ->where('invoice_number', 'like', "%{$keyword}%")
            ->orWhereHas('purchaseOrder', fn($q) => $q->where('po_number', 'like', "%{$keyword}%"))
            ->paginate(15);
        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'invoice_number' => 'nullable|string|max:100',
            'invoice_received_at' => 'nullable|date',
            'submission_sla_target' => 'nullable|integer',
        ]);

        $data = array_merge($validated, [
            'created_by' => $request->user()?->id,
        ]);

        DB::beginTransaction();
        try {
            $invoice = Invoice::create($data);
            DB::commit();
            return response()->json(['message' => 'Invoice berhasil dicatat', 'data' => $invoice], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal menyimpan invoice', 'error' => $e->getMessage()], 500);
        }
    }

    public function edit(Invoice $dari_vendor)
    {
        return response()->json($dari_vendor->load('purchaseOrder'));
    }

    public function update(Request $request, Invoice $dari_vendor)
    {
        $validated = $request->validate([
            'invoice_number' => 'nullable|string|max:100',
            'invoice_received_at' => 'nullable|date',
            'submission_sla_target' => 'nullable|integer',
        ]);

        $dari_vendor->update($validated);
        return response()->json(['message' => 'Invoice berhasil diupdate', 'data' => $dari_vendor]);
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        Invoice::whereIn('id', $ids)->delete();
        return response()->json(['message' => 'Invoice berhasil dihapus']);
    }
}
