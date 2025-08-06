<?php

namespace App\Http\Controllers\Purchase;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\Config\Status;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Config\Classification;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Config\Location;

class PurchaseRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(string $prefix)
    {
        $pr = PurchaseRequest::with('status', 'classification','location')
            ->whereHas('classification', function ($query) use ($prefix) {
                $query->where('type', $prefix);
            })
            ->orderby('updated_at', 'desc') // urutkan dari yang terakhir diinput
            ->cursor(); // Menghasilkan LazyCollection

        $dataJson = $pr->values()->map(function ($item, $index) {
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
                'status' => $statusBadge,
                'classification' => $item->classification->name,
                'pr_number' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-primary/25 text-sky-800">' . $item->pr_number . $badge . '</span>',
                'location' => $item->location->name,
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

        return view('barang.purchase_request.pr', compact(['prefix', 'dataJson']));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(string $prefix)
    {
        $status = Status::where('type', $prefix)->get();
        $classification = Classification::where('type', $prefix)->get();
        $location = Location::all();
        return view('barang.purchase_request.pr-create', compact(['prefix', 'status', 'classification', 'location']));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(string $prefix, Request $request)
    {
        // 🔍 Validasi input
        $validated = $request->validate([
            'pr_number' => 'required|string',
            'status_id' => 'required|integer',
            'classification_id' => 'required|integer',
            'location_id' => 'required|integer',
            'approved_date' => 'required|date|before_or_equal:today',
            'item_desc' => 'required|string|max:255',
            'uom' => 'required|string|max:20',
            'unit_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'amount' => 'required|numeric|min:0',
        ]);

        // ✅ Konversi id
        $validated['status_id'] = (int) $validated['status_id'];
        $validated['classification_id'] = (int) $validated['classification_id'];
        $validated['location_id'] = (int) $validated['location_id'];

        // dd($validated);

        try {

            DB::beginTransaction();

            // 📝 Create pakai $validated
            PurchaseRequest::create([
                'pr_number' => $validated['pr_number'],
                'status_id' => $validated['status_id'],
                'classification_id' => $validated['classification_id'],
                'location_id' => $validated['location_id'],
                'approved_date' => $validated['approved_date'],
                'item_desc' => $validated['item_desc'],
                'uom' => $validated['uom'],
                'unit_price' => $validated['unit_price'],
                'quantity' => $validated['quantity'],
                'amount' => $validated['amount'],
            ]);

            DB::commit();

            // 🧠 AJAX Response vs Non-AJAX
            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Produk berhasil disimpan.',
                    'redirect' => route('purchase-request.index', $prefix),
                ]);
            }

            return redirect()->route('purchase-request.index', $prefix)->with('success', 'Data telah berhasil disimpan.');

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
    public function show(PurchaseRequest $purchaseRequest)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $prefix, PurchaseRequest $purchaseRequest)
    {
        $data = $purchaseRequest;
        $data->approved_date_formatted = Carbon::parse($data->approved_date)->format('Y-m-d');
        $status = Status::where('type', $prefix)->get();
        $classification = Classification::where('type', $prefix)->get();
        $location = Location::all();
        return view('barang.purchase_request.pr-edit', compact(['prefix', 'data', 'status', 'classification', 'location']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(string $prefix, Request $request, PurchaseRequest $purchaseRequest)
    {
        // 🔍 Validasi input
        $validated = $request->validate([
            'pr_number' => 'required|string',
            'status_id' => 'required',
            'classification_id' => 'required',
            'location' => 'required|string|max:255',
            'item_desc' => 'required|string|max:255',
            'uom' => 'required|string|max:20',
            'approved_date' => 'required|date|before_or_equal:today',
            'unit_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'amount' => 'required|numeric|min:0',
        ]);

        // ✅ Konversi id
        $validated['status_id'] = (int) $validated['status_id'];
        $validated['classification_id'] = (int) $validated['classification_id'];

        try {
            DB::beginTransaction();

            // 🔄 Update data produk
            $purchaseRequest->update($validated);

            DB::commit();

            return $request->ajax()
                ? response()->json([
                    'message' => 'Produk berhasil diperbarui.',
                    'redirect' => route('purchase-request.index', $prefix),
                ])
                : redirect()->route('purchase-request.index', $prefix)->with('success', 'Data berhasil diperbarui.');
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
    public function destroy(PurchaseRequest $purchaseRequest)
    {
        //
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim.'], 400);
        }

        // Hapus relasi unit terlebih dahulu
        PurchaseRequest::whereIn('id', $ids)->each(function ($satuan) {
            $satuan->delete();
        });

        return response()->json(['message' => 'Data berhasil dihapus.']);
    }
}
