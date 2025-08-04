<?php

namespace App\Http\Controllers\Barang;

use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\Config\Status;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Barang\PurchaseOrder;
use App\Models\Barang\PurchaseRequest;
use App\Models\Barang\PurchaseOrderOnsite;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(string $prefix)
    {
        $po = PurchaseOrder::with('status', 'trackings')
            ->whereHas('status', function ($query) use ($prefix) {
                $query->where('type', $prefix);
            })
            ->orderby('updated_at', 'desc') // urutkan dari yang terakhir diinput
            ->cursor(); // Menghasilkan LazyCollection

        $dataJson = $po->values()->map(function ($item, $index) {
            // Badge tambahan (misal: 'New', 'Update')
            $badge = '';
            if ($item->is_new) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-success rounded-full">New</span>';
            } elseif ($item->is_update) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-warning rounded-full">Update</span>';
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
                                <input type="checkbox" class="form-checkbox rounded text-primary" value="' . $item->id . '">
                            </div>',
                'number' => ($index + 1),
                'pr_number' => (function () use ($item) {
                    $trackingCount = $item->trackings->count();

                    $trackingBadge = '';
                    if ($trackingCount > 0) {
                        $trackingBadge = '<span class="absolute top-0 end-0 inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-1/2 bg-rose-500 text-white">'
                            . $trackingCount .
                            '</span>';
                    }

                    return '<div class="text-center">
                        <button
                            class="btn-showpr cursor-pointer relative inline-flex flex-shrink-0 justify-center items-center h-[2rem] w-[2rem] rounded-md border font-medium bg-yellow-100 text-yellow-800 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-yellow-300 transition-all text-sm dark:hover:bg-slate-800 dark:border-gray-700 dark:hover:text-white dark:focus:bg-slate-800 dark:focus:text-white dark:focus:ring-offset-gray-800 dark:focus:ring-yellow-200"
                            data-fc-target="showprModal"
                            data-fc-type="modal"
                            data-id="' . $item->id . '"
                            type="button">
                            <i class="mgc_eye_2_fill text-2xl"></i>'
                        . $trackingBadge .
                        '</button>
                    </div>';
                })(),
                'status' => $statusBadge, // gabungkan badge status dan badge tambahan jika perlu
                // kamu bisa menambahkan 'stok' => $badge_stok jika ingin ditampilkan juga
                'po_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-purple-100 text-purple-800">' . $item->po_number . $badge . '</span>',
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

        return view('barang.purchase_order.po', compact(['prefix', 'dataJson']));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(string $prefix)
    {
        $status = Status::where('type', $prefix)->get();
        return view('barang.purchase_order.po-create', compact(['prefix', 'status']));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(string $prefix, Request $request)
    {
        // 🔍 Validasi input
        $validated = $request->validate([
            'status_id' => 'required',
            'po_number' => 'required|string',
            'approved_date' => 'required|date|before_or_equal:today',
            'supplier_name' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'amount' => 'required|numeric|min:0',
        ]);

        // ✅ Konversi id
        $validated['status_id'] = (int) $validated['status_id'];

        // dd($validated);

        try {

            DB::beginTransaction();

            // 📝 Create pakai $validated
            PurchaseOrder::create([
                'status_id' => $validated['status_id'],
                'po_number' => $validated['po_number'],
                'approved_date' => $validated['approved_date'],
                'supplier_name' => $validated['supplier_name'],
                'quantity' => $validated['quantity'],
                'unit_price' => $validated['unit_price'],
                'amount' => $validated['amount'],
            ]);

            DB::commit();

            // 🧠 AJAX Response vs Non-AJAX
            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Produk berhasil disimpan.',
                    'redirect' => route('purchase-order.index', $prefix),
                ]);
            }

            return redirect()->route('purchase-order.index', $prefix)->with('success', 'Data telah berhasil disimpan.');

        } catch (\Exception $e) {
            DB::rollBack();

            // 🔁 Response
            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Gagal menyimpan data.',
                    'error' => $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'Data gagal disimpan.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $prefix, PurchaseOrder $purchaseOrder)
    {
        $pr = PurchaseRequest::with(['status', 'classification'])
            ->whereHas('tracking', function ($query) use ($purchaseOrder) {
                $query->where('purchase_order_id', $purchaseOrder->id);
            })
            ->orderByDesc('updated_at') // Lebih singkat untuk descending
            ->cursor(); // Mengembalikan LazyCollection

        // return $pr;

        $data = $pr->values()->map(function ($item, $index) {
            // Badge tambahan (misal: 'New', 'Update')
            $badge = '';
            if ($item->is_new) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-success rounded-full">New</span>';
            } elseif ($item->is_update) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-warning rounded-full">Update</span>';
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
                                <input type="checkbox" class="form-checkbox rounded text-primary" value="' . $item->id . '">
                            </div>',
                'number' => ($index + 1),
                'status' => $statusBadge, // gabungkan badge status dan badge tambahan jika perlu
                // kamu bisa menambahkan 'stok' => $badge_stok jika ingin ditampilkan juga

                'classification' => $item->classification->name,
                'pr_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-primary/25 text-sky-800">' . $item->pr_number . $badge . '</span>',
                'location' => $item->location,
                'item_desc' => $item->item_desc,
                'uom' => $item->uom,
                'approved_date' => $item->approved_date,
                'unit_price' =>
                    '<div class="my-1 flex md:flex-row flex-col justify-between items-start md:items-center text-red-600">
                        <span>Rp.</span><span class="text-right">' . number_format($item->unit_price, 0) . '</span>
                    </div>',
                'qty' => '<div class="text-center">' . $item->quantity . '</div>',
                'amount' => '<div class="my-1 flex md:flex-row flex-col justify-between items-start md:items-center text-red-600">
                        <span>Rp.</span><span class="text-right">' . number_format($item->amount, 0) . '</span>
                    </div>',
                'sla' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-white ' . $item->sla_badge . '">'
                    . ($item->working_days ?? '-') .
                    '</span>',
            ];
        });

        return response()->json($data);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $prefix, PurchaseOrder $purchaseOrder)
    {
        $data = $purchaseOrder;
        $data->approved_date_formatted = Carbon::parse($data->approved_date)->format('Y-m-d');
        // return $data;
        $status = Status::where('type', $prefix)->get();
        return view('barang.purchase_order.po-edit', compact(['prefix', 'data', 'status']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(string $prefix, Request $request, PurchaseOrder $purchaseOrder)
    {
        // 🔍 Validasi input
        $validated = $request->validate([
            'status_id' => 'required',
            'po_number' => 'required|string',
            'supplier_name' => 'required|string|max:255',
            'approved_date' => 'required|date|before_or_equal:today',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'amount' => 'required|numeric|min:0',
        ]);

        // ✅ Konversi id
        $validated['status_id'] = (int) $validated['status_id'];

        try {
            DB::beginTransaction();

            // 🔄 Update data produk
            $purchaseOrder->update($validated);

            DB::commit();

            return $request->ajax()
                ? response()->json([
                    'message' => 'Produk berhasil diperbarui.',
                    'redirect' => route('purchase-order.index', $prefix),
                ])
                : redirect()->route('purchase-order.index', $prefix)->with('success', 'Data berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();

            return $request->ajax()
                ? response()->json([
                    'message' => 'Gagal memperbarui data.',
                    'error' => $e->getMessage()
                ], 500)
                : back()->with('error', 'Data gagal diperbarui.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchaseOrder $purchaseOrder)
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

            PurchaseOrder::whereIn('id', $ids)->each(function ($po) {
                // Misal: hapus relasi manual
                // $po->items()->delete();
                $po->delete();
            });

            return response()->json(['message' => 'Data berhasil dihapus.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan saat menghapus data.', 'error' => $e->getMessage()], 500);
        }
    }

    public function showpr(string $prefix)
    {
        $pr = PurchaseRequest::with(['status', 'classification']) // Eager load relasi
            ->whereHas('status', function ($query) use ($prefix) {
                $query->where('type', $prefix);
            })
            ->doesntHave('tracking') // Filter yang tidak memiliki relasi 'tracking'
            ->orderByDesc('updated_at') // Lebih singkat untuk descending
            ->cursor(); // Mengembalikan LazyCollection

        // return $pr;

        $showDataPRJson = $pr->values()->map(function ($item, $index) {
            // Badge tambahan (misal: 'New', 'Update')
            $badge = '';
            if ($item->is_new) {
                $badge = '<span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-success rounded-full">New</span>';
            } elseif ($item->is_update) {
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
                                <input type="checkbox" class="form-checkbox rounded text-primary" value="' . $item->id . '">
                            </div>',
                'number' => ($index + 1),
                'status' => $statusBadge, // gabungkan badge status dan badge tambahan jika perlu
                // kamu bisa menambahkan 'stok' => $badge_stok jika ingin ditampilkan juga

                'classification' => $item->classification->name,
                'pr_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-primary/25 text-sky-800">' . $item->pr_number . '</span>' . $badge,
                'location' => $item->location,
                'item_desc' => $item->item_desc,
                'uom' => $item->uom,
                'approved_date' => $item->approved_date,
                'unit_price' =>
                    '<div class="my-1 flex md:flex-row flex-col justify-between items-start md:items-center text-red-600">
                        <span>Rp.</span><span class="text-right">' . number_format($item->unit_price, 0) . '</span>
                    </div>',
                'qty' => '<div class="text-center">' . $item->quantity . '</div>',
                'amount' => '<div class="my-1 flex md:flex-row flex-col justify-between items-start md:items-center text-red-600">
                        <span>Rp.</span><span class="text-right">' . number_format($item->amount, 0) . '</span>
                    </div>',
                'sla' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-white ' . $item->sla_badge . '">'
                    . ($item->working_days ?? '-') .
                    '</span>',
            ];
        });

        return response()->json($showDataPRJson);
    }

    public function onsite(string $prefix, Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'tgl_terima' => 'required|date',
        ]);

        $ids = $request->input('ids');
        $tglTerima = $request->input('tgl_terima');

        // Generate unique onsite number (contoh: ONSITE-20250726-XXX)
        $onsiteNumber = 'ONSITE-' . now()->format('Ymd') . '-' . strtoupper(Str::random(5));

        foreach ($ids as $poId) {
            PurchaseOrderOnsite::create([
                'onsite_number' => $onsiteNumber,
                'purchase_order_id' => $poId,
                'tgl_terima' => $tglTerima,
            ]);
        }

        return response()->json(['message' => 'Data berhasil disimpan.']);
    }
}
