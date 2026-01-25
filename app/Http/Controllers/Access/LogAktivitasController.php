<?php

namespace App\Http\Controllers\Access;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\Models\Activity;

class LogAktivitasController extends Controller
{
     /**
     * Tampilkan halaman log aktivitas beserta statistik ringkas.
     */
    public function index()
    {
        $this->authorize('activity-log.view');

        $totalLogs = Activity::count();

        $createLogs = Activity::where(function ($query) {
            $query->where('description', 'like', '%Menambahkan%')
                ->orWhere('description', 'like', '%Membuat%')
                ->orWhere('description', 'like', '%create%');
        })->count();

        $updateLogs = Activity::where(function ($query) {
            $query->where('description', 'like', '%Mengedit%')
                ->orWhere('description', 'like', '%Mengupdate%')
                ->orWhere('description', 'like', '%Update%')
                ->orWhere('description', 'like', '%Memperbarui%');
        })->count();

        $deleteLogs = Activity::where(function ($query) {
            $query->where('description', 'like', '%menghapus%')
                ->orWhere('description', 'like', '%delete%');
        })->count();

        return view('menu.access.log-aktivitas.index', compact(
            'totalLogs',
            'createLogs',
            'updateLogs',
            'deleteLogs'
        ));
    }

    /**
     * Ambil data log aktivitas untuk tabel frontend.
     */
    public function data()
    {
        $logs = Cache::remember('activity_logs.data', 3600, function () {
            return Activity::with('causer')->orderBy('created_at', 'desc')->get();
        });

        $logsJson = $logs->map(function ($log, $index) {
            $badge = '';
            $descLower = strtolower($log->description);

            if (str_contains($descLower, 'menghapus') || str_contains($descLower, 'delete')) {
                $badge = '<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-full">
                            <i class="mgc_delete_2_line"></i>
                            Delete
                         </span>';
            } elseif (str_contains($descLower, 'mengedit') || str_contains($descLower, 'mengupdate') || str_contains($descLower, 'update') || str_contains($descLower, 'memperbarui')) {
                $badge = '<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-full">
                            <i class="mgc_edit_2_line"></i>
                            Update
                         </span>';
            } elseif (str_contains($descLower, 'menambahkan') || str_contains($descLower, 'membuat') || str_contains($descLower, 'create')) {
                $badge = '<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-full">
                            <i class="mgc_add_circle_line"></i>
                            Create
                         </span>';
            } else {
                $badge = '<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
                            <i class="mgc_information_line"></i>
                            Info
                         </span>';
            }

            $left = '<div class="flex items-start gap-2">
                        <div class="flex-1">
                            <p class="text-sm text-gray-800 dark:text-white font-medium">' . e($log->description) . '</p>
                        </div>
                        ' . $badge . '
                     </div>';

            $right = '';
            $properties = $log->properties ?? [];
            $detailData = null;

            if (isset($properties['old']) && isset($properties['new'])) {
                $detailData = [
                    'old' => $properties['old'],
                    'new' => $properties['new'],
                ];
            } elseif (isset($properties['deleted_suppliers'])) {
                $detailData = [
                    'deleted_suppliers' => $properties['deleted_suppliers'],
                    'count' => $properties['count'] ?? count($properties['deleted_suppliers']),
                ];
            } elseif (isset($properties['deleted_locations'])) {
                $detailData = [
                    'deleted_locations' => $properties['deleted_locations'],
                    'count' => $properties['count'] ?? count($properties['deleted_locations']),
                ];
            } elseif (isset($properties['deleted_classifications'])) {
                $detailData = [
                    'deleted_classifications' => $properties['deleted_classifications'],
                    'count' => $properties['count'] ?? count($properties['deleted_classifications']),
                ];
            } elseif (isset($properties['deleted_supplier'])) {
                $detailData = [
                    'deleted_supplier' => $properties['deleted_supplier'],
                ];
            } elseif (isset($properties['deleted_location'])) {
                $detailData = [
                    'deleted_location' => $properties['deleted_location'],
                ];
            } elseif (isset($properties['deleted_classification'])) {
                $detailData = [
                    'deleted_classification' => $properties['deleted_classification'],
                ];
            } elseif (isset($properties['attributes'])) {
                $detailData = $properties['attributes'];
            } elseif (isset($properties['cleared_products'])) {
                $detailData = [
                    'cleared_products' => $properties['cleared_products'],
                ];
            } elseif (isset($properties['deleted_categories'])) {
                $detailData = $properties['deleted_categories'];
            } elseif (isset($properties['produk']) && isset($properties['changes'])) {
                $detailData = [[
                    'produk' => $properties['produk'],
                    'changes' => $properties['changes'],
                ]];
            } elseif (isset($properties['produk_ids'])) {
                $detailData = [
                    'produk_ids' => $properties['produk_ids'],
                    'count' => $properties['count'] ?? count($properties['produk_ids']),
                ];
            } elseif (isset($properties['produk_id']) && isset($properties['produk_name'])) {
                $detailData = [
                    'produk_id' => $properties['produk_id'],
                    'produk_name' => $properties['produk_name'],
                ];
            } elseif (!empty($properties)) {
                $filteredProperties = [];
                foreach ($properties as $key => $value) {
                    if (!in_array($key, ['attributes', 'old', 'new']) && is_array($value)) {
                        $filteredProperties = $value;
                        break;
                    }
                }
                if (!empty($filteredProperties)) {
                    $detailData = $filteredProperties;
                }
            }

            if ($detailData !== null) {
                $jsonData = htmlspecialchars(json_encode($detailData), ENT_QUOTES, 'UTF-8');
                $right = '<button 
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 hover:shadow-md transition-all duration-200 btn-log-detail"
                    data-detail="' . $jsonData . '">
                    <i class="mgc_eye_line"></i>
                    Detail
                </button>';
            }

            $description = '
                <div class="flex justify-between items-center gap-3">
                    ' . $left . '
                    ' . $right . '
                </div>
            ';

            return [
                'number' => $index + 1,
                'causer' => $log->causer?->name ?? '-',
                'description' => $description,
                'created_at' => $log->created_at->format('d M Y H:i:s'),
            ];
        });

        return response()->json($logsJson);
    }
}
