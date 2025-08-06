<?php

namespace App\Http\Controllers\Purchase;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseOrderOnsite;

class OnsiteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(string $prefix)
    {
        $po = PurchaseOrder::with('status', 'onsite')
            ->whereHas('onsite') // hanya yang punya relasi onsite
            ->whereHas('status', function ($query) use ($prefix) {
                $query->where('type', $prefix);
            })
            ->orderby('updated_at', 'desc') // urutkan dari yang terakhir diinput
            ->cursor(); // Menghasilkan LazyCollection

        $dataJson = $po->values()->map(function ($item, $index) {
            // Badge tambahan (misal: 'New', 'Update')
            $badge = '';
            if ($item->onsite->is_new) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-success rounded-full">New</span>';
            } elseif ($item->onsite->is_update) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-warning rounded-full">Update</span>';
            }

            // Badge stok (jika diperlukan)
            if ($item->stok < $item->min_stok) {
                $badge_stok = '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-red-100 text-red-800">';
            } elseif ($item->stok >= $item->min_stok) {
                $badge_stok = '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800">';
            }

            // Status badge berdasarkan status->name
            $statusName = strtolower($item->status->name);
            if ($statusName === 'finish') {
                $statusClass = 'bg-green-500';
            } elseif ($statusName === 'on proses') {
                $statusClass = 'bg-yellow-500';
            } else {
                $statusClass = 'bg-gray-500';
            }
            $statusBadge = '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-white ' . $statusClass . '">'
                . ucwords($item->status->name) .
                '</span>';

            return [
                'checkbox' => '<div class="form-check">
                                <input type="checkbox" class="form-checkbox rounded text-primary" value="' . $item->onsite->id . '">
                            </div>',
                'number' => ($index + 1),
                'tgl_terima' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800">' . $item->onsite->tgl_terima . $badge . '</span>',
                'status' => $statusBadge, // gabungkan badge status dan badge tambahan jika perlu
                // kamu bisa menambahkan 'stok' => $badge_stok jika ingin ditampilkan juga
                'po_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-purple-100 text-purple-800">' . $item->po_number . '</span>',
                'approved_date' => $item->approved_date,
                'supplier_name' => $item->supplier_name,
                'qty' => '<div class="text-center">' . $item->quantity . '</div>',
                'unit_price' =>
                    '<div class="my-1 flex md:flex-row flex-col justify-between items-start md:items-center text-red-600">
                        <span>Rp.</span><span class="text-right">' . number_format($item->unit_price, 0) . '</span>
                    </div>',
                'amount' => '<div class="my-1 flex md:flex-row flex-col justify-between items-start md:items-center text-red-600">
                        <span>Rp.</span><span class="text-right">' . number_format($item->amount, 0) . '</span>
                    </div>',
                'sla' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-white ' . $item->sla_badge . '">'
                    . ($item->working_days ?? '-') .
                    '</span>',
            ];
        });
        return view('barang.po.onsite', compact(['prefix', 'dataJson']));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(string $prefix)
    {
        return view('barang.po.onsite-create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(string $prefix, Request $request)
    {
        // Validasi request
        $validated = $request->validate([
            'tgl_terima' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.po_number' => 'required|string|exists:purchase_orders,po_number',
        ]);

        try {
            DB::beginTransaction();

            // Generate unique onsite number (contoh: ONSITE-20250726-XXX)
            $onsiteNumber = 'ONSITE-' . now()->format('Ymd') . '-' . strtoupper(Str::random(5));

            foreach ($validated['items'] as $item) {
                $po = PurchaseOrder::where('po_number', $item['po_number'])->first();

                // Cek apakah PO sudah punya relasi onsite
                $existing = PurchaseOrderOnsite::where('purchase_order_id', $po->id)->first();
                if ($existing) {
                    continue; // Lewati jika sudah ada
                }
                // Simpan data onsite baru
                PurchaseOrderOnsite::create([
                    'onsite_number' => $onsiteNumber,
                    'purchase_order_id' => $po->id,
                    'tgl_terima' => $validated['tgl_terima'],
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'PO Onsite berhasil disimpan.',
                'redirect' => route('po-onsite.index', $prefix),
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
    public function show(PurchaseOrderOnsite $po_onsite)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $prefix, PurchaseOrderOnsite $po_onsite)
    {
        return response()->json($po_onsite);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(string $prefix, Request $request, PurchaseOrderOnsite $po_onsite)
    {
        $validated = $request->validate([
            'tgl_terima' => 'required|string|min:3|max:255',
        ]);

        $po_onsite->update($validated);

        return response()->json([
            'message' => 'Data berhasil diperbarui.',
            'data' => $po_onsite
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request)
    {
        //    
    }

    public function bulkDestroy(string $prefix, Request $request)
    {
        try {
            $ids = $request->input('ids');

            if (!is_array($ids) || empty($ids)) {
                return response()->json(['message' => 'Tidak ada data yang dikirim.'], 400);
            }

            PurchaseOrderOnsite::whereIn('id', $ids)->each(function ($po) {
                // Misal: hapus relasi manual
                // $po->items()->delete();
                $po->delete();
            });

            return response()->json(['message' => 'Data berhasil dihapus.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan saat menghapus data.', 'error' => $e->getMessage()], 500);
        }
    }
    public function search(string $prefix, $keyword)
    {
        // Format keyword untuk pencarian LIKE
        $keyword = '%' . $keyword . '%';

        // Ambil PO yang BELUM memiliki relasi Onsite
        $po = PurchaseOrder::with('status')
            ->whereHas('status', function ($query) use ($prefix) {
                $query->where('type', $prefix);
            })
            ->whereDoesntHave('onsite') // hanya PO yang belum punya data Onsite
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
