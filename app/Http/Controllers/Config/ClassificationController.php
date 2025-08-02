<?php

namespace App\Http\Controllers\Config;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Config\Classification;

class ClassificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $type = [
            'Barang',
            'Jasa',
        ];
        $data = Classification::orderby('updated_at', 'desc') // urutkan dari yang terakhir diinput
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
                'type' => $item->type,
                'name' => $item->name . ' ' . $badge,
                'sla' => $item->sla . ' Hari',
            ];
        });
        return view('config.classification', compact(['type','dataJson']));
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
            'type' => 'required|string',
            'sla' => 'required|integer',
        ]);
        try {

            DB::beginTransaction();

            $status = Classification::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'sla' => $validated['sla'],
            ]);
            DB::commit();

            // 🧠 AJAX Response vs Non-AJAX
            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Produk berhasil disimpan.',
                    'redirect' => route('classification.index'),
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
    public function show(Classification $classification)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Classification $classification)
    {
         return response()->json($classification);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Classification $classification)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
            'type' => 'required|string',
            'sla' => 'required|integer',
        ]);
        try {
            DB::beginTransaction();

            // 🔄 Update data
            $classification->update($validated);

            DB::commit();

            // 🧠 AJAX Response
            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Produk berhasil disimpan.',
                    'redirect' => route('status.index'),
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
    public function destroy(Classification $classification)
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

            Classification::whereIn('id', $ids)->each(function ($po) {
                // Misal: hapus relasi manual
                // $po->items()->delete();
                $po->delete();
            });

            return response()->json(['message' => 'Data berhasil dihapus.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan saat menghapus data.', 'error' => $e->getMessage()], 500);
        }
    }
}
