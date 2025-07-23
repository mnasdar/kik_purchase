<?php

namespace App\Http\Controllers\Goods;

use DateTime;
use App\Models\Barang\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Barang\PurchaseOrder;
use App\Http\Controllers\Controller;
use App\Models\Barang\PurchaseRequest;
use App\Models\Barang\PurchaseTracking;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = PurchaseOrder::with('trackings')->orderByDesc('id') // urutkan dari yang terakhir diinput
            ->paginate(10);     // paginasi 10 data per halaman

        // Cek apakah status dibuat dalam 5 menit terakhir
        $data = $data->through(function ($status) {
            $status->is_new = Carbon::parse($status->created_at)->greaterThan(Carbon::now()->subMinutes(5));
            $status->is_update = Carbon::parse($status->updated_at)->greaterThan(Carbon::now()->subMinutes(5));
            return $status;
        });

        $status = Status::where('type', 'Barang')->get();

        $num = 1;

        $purchaseRequests = PurchaseRequest::doesntHave('tracking')->get();

        return view('goods.purchase-order', compact(['data', 'status', 'num', 'purchaseRequests']));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // 🔍 Validasi input
        $validated = $request->validate([
            'po_number' => 'required|string',
            'status_id' => 'required|integer', // pastikan integer
            'approved_date' => 'required|date|before_or_equal:today',
            'supplier_name' => 'required|string|max:255',
            'unit_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'amount' => 'required|numeric|min:0',
        ]);



        try {
            // ✅ Konversi id (kalau mau aman, walau sudah integer)
            $validated['status_id'] = (int) $validated['status_id'];

            DB::beginTransaction();

            // 📝 Create Purchase Order pakai $validated
            $purchaseOrder = PurchaseOrder::create([
                'po_number' => $validated['po_number'],
                'status_id' => $validated['status_id'],
                'approved_date' => $validated['approved_date'],
                'supplier_name' => $validated['supplier_name'],
                'unit_price' => $validated['unit_price'],
                'quantity' => $validated['quantity'],
                'amount' => $validated['amount'],
            ]);

            DB::commit();

            // 🔁 Response
            return response()->json([
                'success' => true,
                'message' => 'Status berhasil ditambahkan',
                'data' => $purchaseOrder,
                'id' => $purchaseOrder->id,
                'po_number' => $purchaseOrder->po_number,
                'status_id' => $purchaseOrder->status_id,
                'approved_date' => $purchaseOrder->approved_date,
                'supplier_name' => $purchaseOrder->supplier_name,
                'unit_price' => $purchaseOrder->unit_price,
                'quantity' => $purchaseOrder->quantity,
                'amount' => $purchaseOrder->amount,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PurchaseOrder $purchaseOrder)
    {
        return response()->json($purchaseOrder);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        // 🔍 Validasi input
        $validated = $request->validate([
            'po_number' => 'required|string',
            'status_id' => 'required|integer', // pastikan integer
            'approved_date' => 'required|date|before_or_equal:today',
            'supplier_name' => 'required|string|max:255',
            'unit_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'amount' => 'required|numeric|min:0',
        ]);

        // ✅ Konversi id
        $validated['status_id'] = (int) $validated['status_id'];

        // 🔧 Update data
        $purchaseOrder->update($validated);

        // 🔁 Response
        return response()->json([
            'message' => 'Data berhasil diperbarui.',
            'data' => $purchaseOrder
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchaseOrder $purchaseOrder)
    {
        DB::beginTransaction();
        try {
            // 🧹 Hapus semua Purchase Tracking terkait
            PurchaseTracking::where('purchase_order_id', $purchaseOrder->id)->delete();

            // 🗑️ Hapus Purchase Order
            $purchaseOrder->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data berhasil dihapus.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus data: ' . $e->getMessage(),
            ], 500);
        }
    }
    public function search(Request $request)
    {
        $query = $request->q;

        $data = PurchaseOrder::query();

        if ($query) {
            $data->where(function ($q) use ($query) {
                $q->whereRaw('LOWER(pr_number) LIKE ?', ['%' . strtolower($query) . '%'])
                    ->orWhereRaw('LOWER(location) LIKE ?', ['%' . strtolower($query) . '%'])
                    ->orWhereRaw('LOWER(item_desc) LIKE ?', ['%' . strtolower($query) . '%'])
                    ->orWhereRaw('LOWER(uom) LIKE ?', ['%' . strtolower($query) . '%']);

                // Cek jika query adalah tanggal valid (format YYYY-MM-DD)
                if (self::isValidDate($query)) {
                    $q->orWhereDate('approved_date', $query);
                }

                $q->orWhere(DB::raw("CAST(unit_price AS TEXT)"), 'like', '%' . $query . '%')
                    ->orWhere(DB::raw("CAST(quantity AS TEXT)"), 'like', '%' . $query . '%')
                    ->orWhere(DB::raw("CAST(amount AS TEXT)"), 'like', '%' . $query . '%')
                    ->orWhereHas('status', function ($s) use ($query) {
                        $s->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%']);
                    })
                    ->orWhereHas('classification', function ($c) use ($query) {
                        $c->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%']);
                    });

                if (is_numeric($query)) {
                    $q->orWhere('id', $query);
                }
            });
        }

        $data = $data->latest()->paginate(10);
        // AJAX Response
        if ($request->ajax()) {
            return response()->json([
                'table' => view('goods.partials.purchase-order_datatable', compact('data'))->render(),
                'pagination' => view('goods.partials.pagination', compact('data'))->render(),
            ]);
        }

        // Fallback View
        return view('goods.purchase-order', compact('data'));
    }
    private static function isValidDate($value, $format = 'Y-m-d')
    {
        $d = DateTime::createFromFormat($format, $value);
        return $d && $d->format($format) === $value;
    }

    public function showpr(PurchaseOrder $purchaseOrder)
    {
        // Cek apakah PurchaseOrder valid
        if (!$purchaseOrder) {
            return response()->json([
                'success' => false,
                'message' => 'PO Number tidak ditemukan.',
            ], 404);
        }

        // Ambil Purchase Request yang berhubungan dengan Purchase Order ini
        $purchaseRequests = PurchaseRequest::with(['status', 'classification'])
            ->whereHas('tracking', function ($query) use ($purchaseOrder) {
                $query->where('purchase_order_id', $purchaseOrder->id);
            })
            ->orderByDesc('id')
            ->get()
            ->map(function ($request) {
                $request->is_new = Carbon::parse($request->created_at)->greaterThan(Carbon::now()->subMinutes(5));
                $request->is_update = Carbon::parse($request->updated_at)->greaterThan(Carbon::now()->subMinutes(5));
                return $request;
            });

        // Render partial view
        $html = view('goods.partials.showpr_datatable', compact('purchaseRequests'))->render();

        return response()->json([
            'success' => true,
            'html' => $html,
        ]);
    }
}
