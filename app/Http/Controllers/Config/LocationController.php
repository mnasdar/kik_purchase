<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Models\Config\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LocationController extends Controller
{
    /**
     * Tampilkan daftar lokasi.
     */
    public function index()
    {
        $locations = Location::latest()->get();
        return response()->json($locations);
    }

    /**
     * Simpan lokasi baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
        ]);

        DB::beginTransaction();
        try {
            $location = Location::create($validated);
            DB::commit();
            return response()->json(['message' => 'Lokasi berhasil dibuat', 'data' => $location], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat lokasi', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Detail lokasi.
     */
    public function show(Location $unit_kerja)
    {
        return response()->json($unit_kerja);
    }

    /**
     * Update lokasi.
     */
    public function update(Request $request, Location $unit_kerja)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
        ]);

        DB::beginTransaction();
        try {
            $unit_kerja->update($validated);
            DB::commit();
            return response()->json(['message' => 'Lokasi berhasil diupdate', 'data' => $unit_kerja]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengupdate lokasi', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Hapus lokasi (soft delete).
     */
    public function destroy(Location $unit_kerja)
    {
        $unit_kerja->delete();
        return response()->json(['message' => 'Lokasi berhasil dihapus']);
    }

    /**
     * Hapus banyak data.
     */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        Location::whereIn('id', $ids)->delete();
        return response()->json(['message' => 'Lokasi berhasil dihapus']);
    }
}
