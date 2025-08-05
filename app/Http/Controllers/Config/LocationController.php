<?php

namespace App\Http\Controllers\Config;

use Illuminate\Http\Request;
use App\Models\Config\Location;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class LocationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = Location::orderby('updated_at', 'desc') // urutkan dari yang terakhir diinput
            ->cursor(); // Menghasilkan LazyCollection

        $dataJson = $data->values()->map(function ($item, $index) {
            // Hindari undefined variable
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
                'name' => $item->name . ' ' . $badge,
            ];
        });
        return view('config.location', compact(['dataJson']));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
        ]);
        try {

            DB::beginTransaction();

            $status = Location::create([
                'name' => $validated['name'],
            ]);
            DB::commit();

            // 🧠 AJAX Response vs Non-AJAX
            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Produk berhasil disimpan.',
                    'redirect' => route('location.index'),
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();

            // 🔁 Response
            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Gagal menyimpan data.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Location $location)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Location $location)
    {
        return response()->json($location);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
        ]);
        try {
            DB::beginTransaction();

            // 🔄 Update data
            $location->update($validated);

            DB::commit();

            // 🧠 AJAX Response
            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Produk berhasil disimpan.',
                    'redirect' => route('location.index'),
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();

            // 🔁 Response
            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Gagal menyimpan data.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Location $location)
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

            Location::whereIn('id', $ids)->each(function ($location) {
                // Misal: hapus relasi manual
                // $location->items()->delete();
                $location->delete();
            });

            return response()->json(['message' => 'Data berhasil dihapus.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan saat menghapus data.', 'error' => $e->getMessage()], 500);
        }
    }
}
