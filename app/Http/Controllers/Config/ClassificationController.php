<?php

namespace App\Http\Controllers\Config;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Config\Classification;

class ClassificationController extends Controller
{
    /**
     * Tampilkan halaman klasifikasi dengan statistik.
     */
    public function index()
    {
        $totalClassifications = Classification::count();
        $barangClassifications = Classification::where('type', 'barang')->count();
        $jasaClassifications = Classification::where('type', 'jasa')->count();
        $recentClassifications = Classification::where('created_at', '>=', now()->subDays(30))->count();

        return view('menu.config.classification.index', compact(
            'totalClassifications',
            'barangClassifications',
            'jasaClassifications',
            'recentClassifications'
        ));
    }

    /**
     * Ambil data klasifikasi untuk tabel.
     */
    public function getData()
    {
        $classifications = Classification::withCount(['purchaseRequestItems'])->latest()->get();

        $classificationsJson = $classifications->map(function ($classification, $index) {
            // Badge untuk tipe
            $typeIcon = $classification->type === 'barang' ? 'mgc_box_3_line' : 'mgc_service_line';
            $typeColor = $classification->type === 'barang'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';

            return [
                'number' => $index + 1,
                'type' => '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ' . $typeColor . '">
                            <i class="' . $typeIcon . '"></i>
                            ' . ucfirst($classification->type) . '
                          </span>',
                'name' => '<span class="font-medium text-gray-900 dark:text-white">' . e($classification->name) . '</span>',
                'purchase_request_items_count' => '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                                    <i class="mgc_file_line"></i>
                                                    ' . $classification->purchase_request_items_count . ' Items
                                                   </span>',
                'created_at' => '<span class="text-sm text-gray-600 dark:text-gray-400">' . $classification->created_at->format('d M Y') . '</span>',
                'actions' => '
                    <div class="flex gap-2">
                        <button class="btn-edit-classification inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" 
                            data-id="' . $classification->id . '"
                            data-plugin="tippy" 
                            data-tippy-content="Edit Klasifikasi">
                            <i class="mgc_edit_line text-base"></i>
                        </button>
                        <button class="btn-delete-classification inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" 
                            data-id="' . $classification->id . '"
                            data-name="' . e($classification->name) . '"
                            data-plugin="tippy" 
                            data-tippy-content="Hapus Klasifikasi">
                            <i class="mgc_delete_2_line text-base"></i>
                        </button>
                    </div>
                ',
                'checkbox' => '<div class="form-check">
                                <input type="checkbox" 
                                    class="form-checkbox rounded text-primary" 
                                    value="' . $classification->id . '">
                               </div>',
            ];
        });

        return response()->json($classificationsJson);
    }

    /**
     * Simpan klasifikasi baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
            'type' => 'required|in:barang,jasa',
        ]);

        DB::beginTransaction();
        try {
            $classification = Classification::create($validated);

            activity()
                ->causedBy($request->user())
                ->performedOn($classification)
                ->withProperties(['attributes' => $classification->toArray()])
                ->log('Menambahkan klasifikasi: ' . $classification->name);

            DB::commit();
            return response()->json(['message' => 'Klasifikasi berhasil dibuat', 'data' => $classification], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat klasifikasi', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Detail klasifikasi.
     */
    public function show(Classification $klasifikasi)
    {
        return response()->json($klasifikasi);
    }

    /**
     * Update klasifikasi.
     */
    public function update(Request $request, Classification $klasifikasi)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
            'type' => 'required|in:barang,jasa',
        ]);

        DB::beginTransaction();
        try {
            $oldData = $klasifikasi->toArray();
            $klasifikasi->update($validated);
            $newData = $klasifikasi->fresh()->toArray();

            activity()
                ->causedBy($request->user())
                ->performedOn($klasifikasi)
                ->withProperties([
                    'old' => $oldData,
                    'new' => $newData
                ])
                ->log('Mengupdate klasifikasi: ' . $klasifikasi->name);

            DB::commit();
            return response()->json(['message' => 'Klasifikasi berhasil diupdate', 'data' => $klasifikasi]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengupdate klasifikasi', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Hapus klasifikasi (soft delete).
     */
    public function destroy(Classification $klasifikasi)
    {
        $classificationName = $klasifikasi->name;
        $klasifikasi->delete();

        activity()
            ->causedBy(auth()->user())
            ->withProperties(['deleted_classification' => $classificationName])
            ->log('Menghapus klasifikasi: ' . $classificationName);

        return response()->json(['message' => 'Klasifikasi berhasil dihapus']);
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

        $classifications = Classification::whereIn('id', $ids)->get();
        $classificationNames = $classifications->pluck('name')->toArray();
        
        Classification::whereIn('id', $ids)->delete();

        activity()
            ->causedBy($request->user())
            ->withProperties([
                'deleted_classifications' => $classificationNames,
                'count' => count($classificationNames)
            ])
            ->log('Menghapus ' . count($classificationNames) . ' klasifikasi secara bulk');

        return response()->json(['message' => 'Klasifikasi berhasil dihapus']);
    }
}
