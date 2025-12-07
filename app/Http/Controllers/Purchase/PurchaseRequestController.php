<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Mengelola Purchase Request (PR) untuk barang/jasa.
 */
class PurchaseRequestController extends Controller
{
    /**
     * Daftar PR berdasarkan prefix tipe (barang/jasa).
     */
    public function index(Request $request, string $prefix)
    {
        $query = PurchaseRequest::with(['location', 'creator'])
            ->when(in_array($prefix, ['barang', 'jasa']), fn($q) => $q->where('request_type', $prefix))
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    /**
     * Data PR untuk kebutuhan tabel.
     */
    public function getData(Request $request, string $prefix)
    {
        $query = PurchaseRequest::with(['location', 'creator'])
            ->when(in_array($prefix, ['barang', 'jasa']), fn($q) => $q->where('request_type', $prefix));

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    /**
     * Simpan PR baru.
     */
    public function store(Request $request, string $prefix)
    {
        $validated = $request->validate([
            'pr_number' => 'required|string|max:100|unique:purchase_requests,pr_number',
            'location_id' => 'nullable|exists:locations,id',
            'approved_date' => 'required|date',
            'notes' => 'nullable|string',
            'current_stage' => 'nullable|integer',
        ]);

        $data = array_merge($validated, [
            'request_type' => $prefix,
            'created_by' => $request->user()?->id,
        ]);

        DB::beginTransaction();
        try {
            $pr = PurchaseRequest::create($data);
            DB::commit();
            return response()->json(['message' => 'PR berhasil dibuat', 'data' => $pr], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat PR', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Detail PR.
     */
    public function edit(string $prefix, PurchaseRequest $purchase_request)
    {
        return response()->json($purchase_request->load(['items', 'location', 'creator']));
    }

    /**
     * Update PR.
     */
    public function update(Request $request, string $prefix, PurchaseRequest $purchase_request)
    {
        $validated = $request->validate([
            'pr_number' => 'required|string|max:100|unique:purchase_requests,pr_number,' . $purchase_request->id,
            'location_id' => 'nullable|exists:locations,id',
            'approved_date' => 'required|date',
            'notes' => 'nullable|string',
            'current_stage' => 'nullable|integer',
        ]);

        DB::beginTransaction();
        try {
            $purchase_request->update($validated);
            DB::commit();
            return response()->json(['message' => 'PR berhasil diupdate', 'data' => $purchase_request]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengupdate PR', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Soft delete banyak PR.
     */
    public function bulkDestroy(Request $request, string $prefix)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        PurchaseRequest::whereIn('id', $ids)->delete();
        return response()->json(['message' => 'PR berhasil dihapus']);
    }
}
