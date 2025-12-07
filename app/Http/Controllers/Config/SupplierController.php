<?php

namespace App\Http\Controllers\Config;

use Illuminate\Http\Request;
use App\Models\Config\Supplier;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class SupplierController extends Controller
{
   /**
     * Tampilkan daftar supplier.
     */
    public function index()
    {
        $suppliers = Supplier::with('creator')->latest()->get(); {
            $suppliers = Supplier::with('creator')->latest()->get();
            return response()->json($suppliers);
        }
    }

    /**
     * Simpan supplier baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_type' => 'required|in:Company,Individual',
            'name' => 'required|string|min:3|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:100',
        ]);

        DB::beginTransaction();
        try {
            $supplier = Supplier::create(array_merge($validated, [
                'created_by' => $request->user()?->id,
            ]));
            DB::commit();
            return response()->json(['message' => 'Supplier berhasil dibuat', 'data' => $supplier], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat supplier', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Detail supplier.
     */
    public function show(Supplier $supplier)
    {
        return response()->json($supplier->load('creator'));
    }

    /**
     * Update supplier.
     */
    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'supplier_type' => 'required|in:Company,Individual',
            'name' => 'required|string|min:3|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:100',
        ]);

        DB::beginTransaction();
        try {
            $supplier->update($validated);
            DB::commit();
            return response()->json(['message' => 'Supplier berhasil diupdate', 'data' => $supplier]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengupdate supplier', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Hapus supplier (soft delete).
     */
    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return response()->json(['message' => 'Supplier berhasil dihapus']);
    }

    /**
     * Hapus banyak supplier sekaligus.
     */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        Supplier::whereIn('id', $ids)->delete();
        return response()->json(['message' => 'Supplier berhasil dihapus']);
    }
}
