<?php

namespace App\Http\Controllers\Invoice;

use Illuminate\Http\Request;
use App\Models\Invoice\Submission;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseOrder;

class PengajuanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $submission = Submission::with('purchase_orders')
            ->whereNotNull('request_date')
            ->orderby('updated_at', 'desc') // urutkan dari yang terakhir diinput
            ->cursor(); // Menghasilkan LazyCollection

        $dataJson = $submission->values()->map(function ($item, $index) {
            // Badge tambahan (misal: 'New', 'Update')
            $badge = '';
            if ($item->is_new) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-success rounded-full">New</span>';
            } elseif ($item->is_update) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-warning rounded-full">Update</span>';
            }

            return [
                'checkbox' => '<div class="form-check">
                                <input type="checkbox" class="form-checkbox rounded text-primary" value="' . $item->id . '">
                            </div>',
                'number' => ($index + 1),
                'request_date' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800">' . $item->request_date . $badge . '</span>',
                'invoice_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">' . $item->invoice_number . '</span>',
                'received_at' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-800">' . $item->received_at . '</span>',
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
            ];
        });
        return view('invoice.pengajuan.pengajuan', compact(['dataJson']));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('invoice.pengajuan.pengajuan-create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validasi request
        $validated = $request->validate([
            'request_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.invoice_number' => 'required|string|exists:submissions,invoice_number',
        ]);

        try {
            DB::beginTransaction();

            // Loop setiap item untuk update PO
            foreach ($validated['items'] as $item) {
                $submission = Submission::where('invoice_number', $item['invoice_number'])->first();

                if ($submission) {
                    $submission->update([
                        'request_date' => $validated['request_date'],
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Data Invoice berhasil disimpan.',
                'redirect' => route('pengajuan.index'),
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
    public function show(Submission $pengajuan)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Submission $pengajuan)
    {
       return response()->json($pengajuan);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Submission $pengajuan)
    {
        $validated = $request->validate([
            'request_date' => 'required|date',
        ]);

        $pengajuan->update($validated);

        return response()->json([
            'message' => 'Data berhasil diperbarui.',
            'data' => $pengajuan
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Submission $pengajuan)
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

            Submission::whereIn('id', $ids)->each(function ($data) {
                $data->update([
                    'request_date' => null,
                ]);
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
            ->whereNull('request_date')
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
                'invoice_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">' . $item->invoice_number . '</span>',
                'received_at' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800">' . $item->received_at . '</span>',
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
