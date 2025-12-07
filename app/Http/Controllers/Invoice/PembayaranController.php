<?php

namespace App\Http\Controllers\Invoice;

use App\Http\Controllers\Controller;
use App\Models\Invoice\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controller pembayaran invoice oleh finance.
 */
class PembayaranController extends Controller
{
    public function index()
    {
        $payments = Payment::with('invoice')->latest()->paginate(15);
        return response()->json($payments);
    }

    public function search(string $keyword)
    {
        $payments = Payment::with('invoice')
            ->where('payment_number', 'like', "%{$keyword}%")
            ->orWhereHas('invoice', fn($q) => $q->where('invoice_number', 'like', "%{$keyword}%"))
            ->paginate(15);
        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'payment_number' => 'nullable|string|max:100',
            'payment_date' => 'required|date',
            'payment_sla_target' => 'nullable|integer',
            'payment_sla_realization' => 'nullable|integer',
        ]);

        $data = array_merge($validated, [
            'created_by' => $request->user()?->id,
        ]);

        DB::beginTransaction();
        try {
            $payment = Payment::create($data);
            DB::commit();
            return response()->json(['message' => 'Pembayaran berhasil dicatat', 'data' => $payment], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mencatat pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    public function edit(Payment $pembayaran)
    {
        return response()->json($pembayaran->load('invoice'));
    }

    public function update(Request $request, Payment $pembayaran)
    {
        $validated = $request->validate([
            'payment_number' => 'nullable|string|max:100',
            'payment_date' => 'required|date',
            'payment_sla_target' => 'nullable|integer',
            'payment_sla_realization' => 'nullable|integer',
        ]);

        $pembayaran->update($validated);
        return response()->json(['message' => 'Pembayaran berhasil diupdate', 'data' => $pembayaran]);
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        Payment::whereIn('id', $ids)->delete();
        return response()->json(['message' => 'Pembayaran dihapus']);
    }
}