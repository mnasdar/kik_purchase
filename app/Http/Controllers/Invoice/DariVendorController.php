<?php

namespace App\Http\Controllers\Invoice;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\Invoice\Submission;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseOrder;

class DariVendorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $purchase_order = Submission::with('purchase_orders')
            ->orderby('updated_at', 'desc') // urutkan dari yang terakhir diinput
            ->cursor(); // Menghasilkan LazyCollection

        $dataJson = $purchase_order->values()->map(function ($item, $index) {
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
                'received_at' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800">' . $item->received_at . $badge . '</span>',
                'invoice_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">' . $item->invoice_number . '</span>',
                'invoice_date' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-800">' . $item->invoice_date . '</span>',
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
        return view('invoice.terima.dari-vendor', compact(['dataJson']));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('invoice.terima.dari-vendor-create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validasi request
        $validated = $request->validate([
            'invoice_number' => 'required|string',
            'invoice_date' => 'required|date',
            'received_at' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.po_number' => 'required|string|exists:purchase_orders,po_number',
        ]);

        try {
            DB::beginTransaction();

            // Buat submission hanya sekali (1 invoice = 1 submission)
            $submission = Submission::create([
                'invoice_number' => $validated['invoice_number'],
                'invoice_date' => $validated['invoice_date'],
                'received_at' => $validated['received_at'],
            ]);

            // Loop setiap item untuk update PO
            foreach ($validated['items'] as $item) {
                $purchase_order = PurchaseOrder::where('po_number', $item['po_number'])->first();

                if ($purchase_order) {
                    $purchase_order->update([
                        'submission_id' => $submission->id,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Data Invoice berhasil disimpan.',
                'redirect' => route('dari-vendor.index'),
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
    public function show(Submission $dari_vendor)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Submission $dari_vendor)
    {
        return response()->json($dari_vendor);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Submission $dari_vendor)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string',
            'invoice_date' => 'required|date',
            'received_at' => 'required|date',
        ]);

        $dari_vendor->update($validated);

        return response()->json([
            'message' => 'Data berhasil diperbarui.',
            'data' => $dari_vendor
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Submission $dari_vendor)
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

            Submission::whereIn('id', $ids)->each(function ($submission) {
                $submission->delete();
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

        $purchase_order = PurchaseOrder::with('status')
            ->whereNotNull('received_at') // hanya PO yang belum punya data Onsite
            ->where(function ($query) use ($keyword) {
                $query->where('po_number', 'like', $keyword)
                    ->orWhere('supplier_name', 'like', $keyword)
                    ->orWhere('amount', 'like', $keyword);
            })
            ->orderBy('updated_at', 'desc')
            ->cursor(); // Lazy loading untuk efisiensi memori

        // Format hasil dalam struktur untuk Grid.js / Frontend Table
        $dataJson = $purchase_order->values()->map(function ($item, $index) {
            // Badge status berdasarkan relasi status
            $statusName = strtolower($item->status->name ?? '');
            $statusClass = match ($statusName) {
                'finish' => 'bg-green-500',
                'on proses' => 'bg-yellow-500',
                default => 'bg-gray-500',
            };

            $statusBadge = '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-white '
                . $statusClass . '">' . ucwords($item->status->name ?? '-') . '</span>';

            // Badge untuk SLA (gunakan warna dari properti `sla_badge` atau default)
            $slaBadge = '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-white '
                . ($item->sla_badge ?? 'bg-gray-400') . '">' . ($item->working_days ?? '-') . '</span>';

            return [
                // Untuk Tampil di Tabel Modal
                'number' => $index + 1,
                'status' => $statusBadge,
                'po_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-purple-100 text-purple-800">'
                    . e($item->po_number) . '</span>',
                'approved_date' => e($item->approved_date ?? '-'),
                'supplier_name' => e($item->supplier_name ?? '-'),
                'qty' => '<div class="text-center">' . number_format($item->quantity ?? 0) . '</div>',
                'unit_price' => '<div class="flex justify-between text-red-600"><span>Rp.</span><span>'
                    . number_format($item->unit_price ?? 0, 0) . '</span></div>',
                'amount' => '<div class="flex justify-between text-red-600"><span>Rp.</span><span>'
                    . number_format($item->amount ?? 0, 0) . '</span></div>',
                'sla' => $slaBadge,

                // untuk tampil di saat data di pilih
                'nomor_po' => $item->po_number,
                'harga' => $item->unit_price,
                'jumlah' => $item->quantity,
                'total' => $item->amount,
            ];
        });

        return response()->json($dataJson);
    }
}
