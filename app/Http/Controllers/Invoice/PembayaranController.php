<?php

namespace App\Http\Controllers\Invoice;

use Illuminate\Http\Request;
use App\Models\Invoice\Payment;
use App\Models\Invoice\Submission;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class PembayaranController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
{
    $pembayaran = Payment::with('submission.purchase_orders')
        ->orderBy('updated_at', 'desc')
        ->get();

    // 🔹 Grouping berdasarkan payment_number
    $grouped = $pembayaran->groupBy('payment_number');

    $dataJson = $grouped->values()->map(function ($group, $index) {
        // Ambil item pertama (untuk field single)
        $first = $group->first();

        // Badge tambahan
        $badge = '';
        if ($first->is_new) {
            $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-success rounded-full">New</span>';
        } elseif ($first->is_update) {
            $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-warning rounded-full">Update</span>';
        }

        // Gabungkan invoice numbers
        $invoiceNumbers = $group->map(function ($item) {
            return $item->submission
                ? '<div class="my-2 flex md:flex-row flex-col justify-start items-center md:items-center">
                    <span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-purple-100 text-purple-800">'
                    . e($item->submission->invoice_number) .
                    '</span>
                </div>'
                : '';
        })->join('');

        // Gabungkan PO numbers
        $poNumbers = $group->flatMap(function ($item) {
            return $item->submission
                ? $item->submission->purchase_orders->map(function ($po) {
                    return '<div class="my-2 flex md:flex-row flex-col justify-start items-center md:items-center">
                        <span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-purple-100 text-purple-800">'
                        . e($po->po_number) .
                        '</span>
                    </div>';
                })
                : collect();
        })->join('');

        // Gabungkan Supplier names
        $supplierNames = $group->flatMap(function ($item) {
            return $item->submission
                ? $item->submission->purchase_orders->map(function ($po) {
                    return '<div class="my-2 flex md:flex-row flex-col justify-start items-center md:items-center">
                        <span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-800">'
                        . e($po->supplier_name) .
                        '</span>
                    </div>';
                })
                : collect();
        })->join('');

        // Gabungkan Supplier names
        $amounts = $group->flatMap(function ($item) {
            return $item->submission
                ? $item->submission->purchase_orders->map(function ($po) {
                    return '<span class="my-2 inline-flex w-full justify-between items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-800">'
                . '<span>Rp.</span>'
                        . e(number_format($po->amount))
                        .'</span>';
                })
                : collect();
        })->join('');

        return [
            'checkbox' => '<div class="form-check">
                <input type="checkbox" class="form-checkbox rounded text-primary" value="' . $first->id . '">
            </div>',
            'number' => ($index + 1),
            'payment_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">' 
                . $first->payment_number . '</span>' . $badge,
            'type' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-800">' 
                . ucfirst($first->type) . '</span>',
            'payment_date' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-800">' 
                . $first->payment_date . '</span>',
            'invoice_numbers' => $invoiceNumbers,
            'po_numbers' => $poNumbers,
            'supplier_name' => $supplierNames,
            'amount' => $amounts,
            'total_paid' => '<span class="inline-flex w-full justify-between items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-red-100 text-red-800">'
                . '<span>Rp.</span>'
                . number_format($first->amount)
                . '</span>',
        ];
    });

    return view('invoice.pembayaran.pembayaran', compact('dataJson'));
}


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('invoice.pembayaran.pembayaran-create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validasi request
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.submission_id' => 'required|integer|exists:submissions,id',
            'payment_number' => 'required|string|max:50',
            'type' => 'required|in:full,partial',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // Loop setiap item untuk update PO
            foreach ($validated['items'] as $item) {
                Payment::create([
                    'submission_id' => $item['submission_id'],
                    'payment_number' => $validated['payment_number'],
                    'type' => $validated['type'],
                    'payment_date' => $validated['payment_date'],
                    'amount' => $validated['amount'],
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Data Pembayaran berhasil disimpan.',
                'redirect' => route('pembayaran.index'),
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Payment $pembayaran)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Payment $pembayaran)
    {
        return response()->json($pembayaran);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payment $pembayaran)
    {
        $validated = $request->validate([
            'payment_number' => 'required|string|max:50|unique:payments,payment_number',
            'type' => 'required|in:full,partial',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
        ]);

        $pembayaran->update($validated);

        return response()->json([
            'message' => 'Data berhasil diperbarui.',
            'data' => $pembayaran
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $pembayaran)
    {
        //
    }
    public function bulkDestroy(Request $request)
    {
        try {
            $ids = $request->input('ids');

            if (!is_array($ids) || empty($ids)) {
                return response()->json(['message' => 'Tidak ada data yang dikirim.'], 400);
            }

            Payment::whereIn('id', $ids)->each(function ($pembayaran) {
                $pembayaran->delete();
            });

            return response()->json(['message' => 'Data berhasil dihapus.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan saat menghapus data.', 'error' => $e->getMessage()], 500);
        }
    }
    public function search($keyword)
    {
        // Format keyword untuk pencarian LIKE
        $keyword = '%' . $keyword . '%';

        $submission = Submission::with('purchase_orders')
            // ->get();
            ->whereNotNull('request_date')
            ->where(function ($query) use ($keyword) {
                $query->where('invoice_number', 'like', $keyword);
            })
            ->orderBy('updated_at', 'desc')
            ->cursor(); // Lazy loading untuk efisiensi memori

        // Format hasil dalam struktur untuk Grid.js / Frontend Table
        $dataJson = $submission->values()->map(function ($item, $index) {

            return [
                // Untuk Tampil di Tabel Modal
                'number' => $index + 1,
                'submission_id' => $item->id,
                'invoice_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">' . $item->invoice_number . '</span>',
                'request_date' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800">' . $item->request_date . '</span>',
                'po_numbers' => $item->purchase_orders->map(
                    fn($po) =>
                    '<div class="my-2 flex md:flex-row flex-col justify-start items-center md:items-center"><span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-purple-100 text-purple-800">' . e($po->po_number) . '</span></div>'
                )->join(''),
                'supplier_name' => $item->purchase_orders->map(
                    fn($po) =>
                    '<div class="my-2 flex md:flex-row flex-col justify-start items-center md:items-center"><span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-800">' . e($po->supplier_name) . '</span></div>'
                )->join(''),
                'amount' => '<span class="inline-flex w-full justify-between items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-red-100 text-red-800">'
                    . '<span>Rp.</span>'
                    . number_format($item->purchase_orders->sum('amount'), 0) .
                    '</span>',
                'total' => $item->purchase_orders->sum('amount'),
                'nomor_invoice' => $item->invoice_number,
            ];
        });

        return response()->json($dataJson);
    }
}
