<?php

namespace App\Http\Controllers\Invoice;

use App\Http\Controllers\Controller;
use App\Models\Invoice\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Mengelola pengajuan invoice ke finance.
 */
class PengajuanController extends Controller
{
    public function index()
    {
        $invoices = Invoice::whereNotNull('invoice_received_at')
            ->latest()
            ->paginate(15);
        return response()->json($invoices);
    }

    public function search(string $keyword)
    {
        $invoices = Invoice::where('invoice_number', 'like', "%{$keyword}%")
            ->latest()
            ->paginate(15);
        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'invoice_submitted_at' => 'required|date',
        ]);

        DB::beginTransaction();
        try {
            $invoice = Invoice::findOrFail($validated['invoice_id']);
            $invoice->update([
                'invoice_submitted_at' => $validated['invoice_submitted_at'],
                'submission_sla_realization' => $invoice->invoice_received_at
                    ? now()->parse($validated['invoice_submitted_at'])->diffInDays($invoice->invoice_received_at)
                    : null,
            ]);
            DB::commit();
            return response()->json(['message' => 'Pengajuan invoice berhasil dicatat', 'data' => $invoice]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mencatat pengajuan', 'error' => $e->getMessage()], 500);
        }
    }

    public function edit(Invoice $pengajuan)
    {
        return response()->json($pengajuan);
    }

    public function update(Request $request, Invoice $pengajuan)
    {
        $validated = $request->validate([
            'invoice_submitted_at' => 'required|date',
        ]);

        $pengajuan->update(['invoice_submitted_at' => $validated['invoice_submitted_at']]);
        return response()->json(['message' => 'Data pengajuan diperbarui', 'data' => $pengajuan]);
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        Invoice::whereIn('id', $ids)->delete();
        return response()->json(['message' => 'Data pengajuan dihapus']);
    }
}
