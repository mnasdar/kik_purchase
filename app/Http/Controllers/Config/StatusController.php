<?php

namespace App\Http\Controllers\Config;

use Illuminate\Http\Request;
use App\Models\Config\Status;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class StatusController extends Controller
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
        $data = Status::orderby('updated_at', 'desc') // urutkan dari yang terakhir diinput
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
            ];
        });
        return view('config.status', compact(['type','dataJson']));
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
        ]);
        try {

            DB::beginTransaction();

            $status = Status::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
            ]);
            DB::commit();

            // 🧠 AJAX Response vs Non-AJAX
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
     * Display the specified resource.
     */
    public function show(Status $status)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Status $status)
    {
        return response()->json($status);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Status $status)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
            'type' => 'required|string',
        ]);
        try {
            DB::beginTransaction();

            // 🔄 Update data
            $status->update($validated);

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
    public function destroy(Status $status)
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

            Status::whereIn('id', $ids)->each(function ($po) {
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
