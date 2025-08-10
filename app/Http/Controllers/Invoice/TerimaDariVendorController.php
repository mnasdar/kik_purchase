<?php

namespace App\Http\Controllers\Invoice;

use Illuminate\Http\Request;
use App\Models\Invoice\Submission;
use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseOrder;

class TerimaDariVendorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $po = Submission::with('purchase_order')
            ->orderby('updated_at', 'desc') // urutkan dari yang terakhir diinput
            ->cursor(); // Menghasilkan LazyCollection

        // return $po;

        $dataJson = $po->values()->map(function ($item, $index) {
            // Badge tambahan (misal: 'New', 'Update')
            $badge = '';
            if ($item->is_new) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-success rounded-full">New</span>';
            } elseif ($item->is_update) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-warning rounded-full">Update</span>';
            }

            return [
                'checkbox' => '<div class="form-check">
                                <input type="checkbox" class="form-checkbox rounded text-primary" value="' . $item->onsite->id . '">
                            </div>',
                'number' => ($index + 1),
                'received_at' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800">' . $item->onsite->tgl_terima . $badge . '</span>',
                // kamu bisa menambahkan 'stok' => $badge_stok jika ingin ditampilkan juga
                'invoice_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-sky-100 text-sky-800">' . $item->po_number . '</span>',
                'po_number' => '',
                'supplier_name' => $item->supplier_name,
                'amount' => '<div class="my-1 flex md:flex-row flex-col justify-between items-start md:items-center text-red-600">
                        <span>Rp.</span><span class="text-right">' . number_format($item->amount, 0) . '</span>
                    </div>',
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
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Submission $submission)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Submission $submission)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Submission $submission)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Submission $submission)
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

            Submission::whereIn('id', $ids)->each(function ($po) {
                // Misal: hapus relasi manual
                // $po->items()->delete();
                $po->delete();
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

        $po = PurchaseOrder::with('status')
            ->whereHas('onsite') // hanya PO yang belum punya data Onsite
            ->where(function ($query) use ($keyword) {
                $query->where('po_number', 'like', $keyword)
                    ->orWhere('supplier_name', 'like', $keyword)
                    ->orWhere('amount', 'like', $keyword);
            })
            ->orderBy('updated_at', 'desc')
            ->cursor(); // Lazy loading untuk efisiensi memori

        // Format hasil dalam struktur untuk Grid.js / Frontend Table
        $dataJson = $po->values()->map(function ($item, $index) {
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
