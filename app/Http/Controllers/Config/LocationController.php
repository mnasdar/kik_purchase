<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Models\Config\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class LocationController extends Controller
{
    /**
     * Tampilkan halaman unit kerja dengan statistik.
     */
    public function index()
    {
        $this->authorize('locations.view');

        $totalLocations = Location::count();
        $withUsers = Location::whereHas('users')->count();
        $withPurchaseRequests = Location::whereHas('purchaseRequests')->count();
        $recentLocations = Location::where('created_at', '>=', now()->subDays(30))->count();

        return view('menu.config.location.index', compact(
            'totalLocations',
            'withUsers',
            'withPurchaseRequests',
            'recentLocations'
        ));
    }

    /**
     * Ambil data unit kerja untuk tabel.
     */
    public function getData()
    {
        $locations = Cache::remember('locations.data', 3600, function () {
            return Location::withCount(['users', 'purchaseRequests'])->latest()->get();
        });

        $locationsJson = $locations->map(function ($location, $index) {
            $user = auth()->user();
            $canEdit = $user && $user->hasPermissionTo('locations.edit');
            $canDelete = $user && $user->hasPermissionTo('locations.delete');

            $actions = '<div class="flex gap-2">';
            
            if ($canEdit) {
                $actions .= '<button class="btn-edit-location inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" 
                    data-id="' . $location->id . '"
                    data-plugin="tippy" 
                    data-tippy-content="Edit Unit Kerja">
                    <i class="mgc_edit_line text-base"></i>
                </button>';
            }
            
            if ($canDelete) {
                $actions .= '<button class="btn-delete-location inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" 
                    data-id="' . $location->id . '"
                    data-name="' . e($location->name) . '"
                    data-plugin="tippy" 
                    data-tippy-content="Hapus Unit Kerja">
                    <i class="mgc_delete_2_line text-base"></i>
                </button>';
            }
            
            $actions .= '</div>';

            return [
                'number' => $index + 1,
                'name' => '<span class="font-medium text-gray-900 dark:text-white">' . e($location->name) . '</span>',
                'users_count' => '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                    <i class="mgc_user_3_line"></i>
                                    ' . $location->users_count . ' Users
                                  </span>',
                'purchase_requests_count' => '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                <i class="mgc_file_line"></i>
                                                ' . $location->purchase_requests_count . ' PR
                                              </span>',
                'created_at' => '<span class="text-sm text-gray-600 dark:text-gray-400">' . $location->created_at->format('d M Y') . '</span>',
                'actions' => $actions,
                'checkbox' => '<div class="form-check">
                                <input type="checkbox" 
                                    class="form-checkbox rounded text-primary" 
                                    value="' . $location->id . '">
                               </div>',
            ];
        });

        return response()->json($locationsJson);
    }

    /**
     * Simpan lokasi baru.
     */
    public function store(Request $request)
    {
        $this->authorize('locations.create');

        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
        ]);

        DB::beginTransaction();
        try {
            $existing = Location::withTrashed()
                ->whereRaw('LOWER(name) = ?', [strtolower($validated['name'])])
                ->first();

            // Reactivate soft-deleted data when user confirms
            if ($request->boolean('reactivate') && $request->filled('reactivate_id')) {
                $toRestore = Location::withTrashed()->find($request->input('reactivate_id'));

                if ($toRestore && $toRestore->trashed()) {
                    $oldData = $toRestore->toArray();
                    $toRestore->restore();
                    $toRestore->update($validated);
                    $newData = $toRestore->fresh()->toArray();

                    activity()
                        ->causedBy($request->user())
                        ->performedOn($toRestore)
                        ->withProperties([
                            'old' => $oldData,
                            'new' => $newData,
                            'action' => 'reactivate'
                        ])
                        ->log('Mengaktifkan kembali unit kerja: ' . $toRestore->name);

                    Cache::forget('locations.data');
                    DB::commit();
                    return response()->json([
                        'message' => 'Unit kerja diaktifkan kembali dan diperbarui',
                        'data' => $toRestore,
                        'reactivated' => true,
                    ]);
                }

                return response()->json([
                    'message' => 'Data yang akan diaktifkan tidak ditemukan',
                ], 404);
            }

            // If there is a soft-deleted match and user has not chosen force_create, ask for confirmation
            if ($existing && $existing->trashed() && !$request->boolean('force_create')) {
                DB::rollBack();
                return response()->json([
                    'status' => 'soft-deleted',
                    'message' => 'Data ini sudah pernah ditambahkan. Aktifkan kembali?',
                    'id' => $existing->id,
                ], 409);
            }

            // If active duplicate exists (case-insensitive), block creation
            if ($existing && !$existing->trashed()) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Nama unit kerja sudah digunakan.',
                    'errors' => ['name' => ['Nama unit kerja sudah digunakan.']]
                ], 422);
            }

            $location = Location::create($validated);

            activity()
                ->causedBy($request->user())
                ->performedOn($location)
                ->withProperties(['attributes' => $location->toArray()])
                ->log('Menambahkan unit kerja: ' . $location->name);

            Cache::forget('locations.data');
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
        $this->authorize('locations.edit');

        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
        ]);

        DB::beginTransaction();
        try {
            $oldData = $unit_kerja->toArray();
            $unit_kerja->update($validated);
            $newData = $unit_kerja->fresh()->toArray();

            activity()
                ->causedBy($request->user())
                ->performedOn($unit_kerja)
                ->withProperties([
                    'old' => $oldData,
                    'new' => $newData
                ])
                ->log('Mengupdate unit kerja: ' . $unit_kerja->name);

            Cache::forget('locations.data');
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
        $this->authorize('locations.delete');

        $locationName = $unit_kerja->name;
        $unit_kerja->delete();

        activity()
            ->causedBy(auth()->user())
            ->withProperties(['deleted_location' => $locationName])
            ->log('Menghapus unit kerja: ' . $locationName);

        Cache::forget('locations.data');
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

        $locations = Location::whereIn('id', $ids)->get();
        $locationNames = $locations->pluck('name')->toArray();
        
        Location::whereIn('id', $ids)->delete();

        activity()
            ->causedBy($request->user())
            ->withProperties([
                'deleted_locations' => $locationNames,
                'count' => count($locationNames)
            ])
            ->log('Menghapus ' . count($locationNames) . ' unit kerja secara bulk');

        Cache::forget('locations.data');
        return response()->json(['message' => 'Lokasi berhasil dihapus']);
    }
}
