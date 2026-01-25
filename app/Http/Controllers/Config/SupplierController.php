<?php

namespace App\Http\Controllers\Config;

use Illuminate\Http\Request;
use App\Models\Config\Supplier;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\Controller;

class SupplierController extends Controller
{
    /**
     * Tampilkan halaman supplier dengan statistik.
     */
    public function index()
    {
        $this->authorize('suppliers.view');

        $totalSuppliers = Supplier::count();
        $companySuppliers = Supplier::where('supplier_type', 'Company')->count();
        $individualSuppliers = Supplier::where('supplier_type', 'Individual')->count();
        $recentSuppliers = Supplier::where('created_at', '>=', now()->subDays(30))->count();

        return view('menu.config.supplier.index', compact(
            'totalSuppliers',
            'companySuppliers',
            'individualSuppliers',
            'recentSuppliers'
        ));
    }

    /**
     * Ambil data supplier untuk tabel.
     */
    public function getData()
    {
        $suppliers = Cache::remember('suppliers.data', 3600, function () {
            return Supplier::with('creator')->latest()->get();
        });

        $suppliersJson = $suppliers->map(function ($supplier, $index) {
            $user = auth()->user();
            $canEdit = $user && $user->hasPermissionTo('suppliers.edit');
            $canDelete = $user && $user->hasPermissionTo('suppliers.delete');

            // Badge untuk tipe supplier
            $typeIcon = $supplier->supplier_type === 'Company' ? 'mgc_building_2_line' : 'mgc_user_3_line';
            $typeColor = $supplier->supplier_type === 'Company'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';

            $actions = '<div class="flex gap-2">';
            
            if ($canEdit) {
                $actions .= '<button class="btn-edit-supplier inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" 
                    data-id="' . $supplier->id . '"
                    data-plugin="tippy" 
                    data-tippy-content="Edit Supplier">
                    <i class="mgc_edit_line text-base"></i>
                </button>';
            }
            
            if ($canDelete) {
                $actions .= '<button class="btn-delete-supplier inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" 
                    data-id="' . $supplier->id . '"
                    data-name="' . e($supplier->name) . '"
                    data-plugin="tippy" 
                    data-tippy-content="Hapus Supplier">
                    <i class="mgc_delete_2_line text-base"></i>
                </button>';
            }
            
            $actions .= '</div>';

            return [
                'number' => $index + 1,
                'supplier_type' => '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ' . $typeColor . '">
                                        <i class="' . $typeIcon . '"></i>
                                        ' . $supplier->supplier_type . '
                                    </span>',
                'name' => '<span class="font-medium text-gray-900 dark:text-white">' . e($supplier->name) . '</span>',
                'contact_person' => $supplier->contact_person 
                    ? '<span class="text-gray-700 dark:text-gray-300">' . e($supplier->contact_person) . '</span>'
                    : '<span class="text-gray-400">-</span>',
                'phone' => $supplier->phone 
                    ? '<span class="text-gray-700 dark:text-gray-300"><i class="mgc_phone_line text-gray-400 mr-1"></i>' . e($supplier->phone) . '</span>'
                    : '<span class="text-gray-400">-</span>',
                'email' => $supplier->email 
                    ? '<span class="text-gray-700 dark:text-gray-300"><i class="mgc_mail_line text-gray-400 mr-1"></i>' . e($supplier->email) . '</span>'
                    : '<span class="text-gray-400">-</span>',
                'created_by' => $supplier->creator 
                    ? '<span class="text-sm text-gray-600 dark:text-gray-400">' . e($supplier->creator->name) . '</span>'
                    : '<span class="text-gray-400">System</span>',
                'npwp' => $supplier->tax_id 
                    ? '<span class="text-sm text-gray-600 dark:text-gray-400">' . e($supplier->tax_id) . '</span>'
                    : '<span class="text-gray-400">-</span>',
                'actions' => $actions,
                'checkbox' => '<div class="form-check">
                                <input type="checkbox" 
                                    class="form-checkbox rounded text-primary" 
                                    value="' . $supplier->id . '">
                               </div>',
            ];
        });

        return response()->json($suppliersJson);
    }

    /**
     * Simpan supplier baru.
     */
    public function store(Request $request)
    {
        $this->authorize('suppliers.create');

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
            $existing = Supplier::withTrashed()
                ->whereRaw('LOWER(name) = ?', [strtolower($validated['name'])])
                ->first();

            // Reactivate soft-deleted data when user confirms
            if ($request->boolean('reactivate') && $request->filled('reactivate_id')) {
                $toRestore = Supplier::withTrashed()->find($request->input('reactivate_id'));

                if ($toRestore && $toRestore->trashed()) {
                    $oldData = $toRestore->toArray();
                    $toRestore->restore();
                    $toRestore->update(array_merge($validated, [
                        'created_by' => $request->user()?->id,
                    ]));
                    $newData = $toRestore->fresh()->toArray();

                    activity()
                        ->causedBy($request->user())
                        ->performedOn($toRestore)
                        ->withProperties([
                            'old' => $oldData,
                            'new' => $newData,
                            'action' => 'reactivate'
                        ])
                        ->log('Mengaktifkan kembali supplier: ' . $toRestore->name);

                    Cache::forget('suppliers.data');
                    DB::commit();
                    return response()->json([
                        'message' => 'Supplier diaktifkan kembali dan diperbarui',
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
                    'message' => 'Nama supplier sudah digunakan.',
                    'errors' => ['name' => ['Nama supplier sudah digunakan.']]
                ], 422);
            }

            $supplier = Supplier::create(array_merge($validated, [
                'created_by' => $request->user()?->id,
            ]));

            activity()
                ->causedBy($request->user())
                ->performedOn($supplier)
                ->withProperties(['attributes' => $supplier->toArray()])
                ->log('Menambahkan supplier: ' . $supplier->name);

            Cache::forget('suppliers.data');
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
        $this->authorize('suppliers.edit');

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
            $oldData = $supplier->toArray();
            $supplier->update($validated);
            $newData = $supplier->fresh()->toArray();

            activity()
                ->causedBy($request->user())
                ->performedOn($supplier)
                ->withProperties([
                    'old' => $oldData,
                    'new' => $newData
                ])
                ->log('Mengupdate supplier: ' . $supplier->name);

            Cache::forget('suppliers.data');
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
        $this->authorize('suppliers.delete');

        $supplierName = $supplier->name;
        $supplier->delete();

        activity()
            ->causedBy(auth()->user())
            ->withProperties(['deleted_supplier' => $supplierName])
            ->log('Menghapus supplier: ' . $supplierName);

        Cache::forget('suppliers.data');
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

        $suppliers = Supplier::whereIn('id', $ids)->get();
        $supplierNames = $suppliers->pluck('name')->toArray();
        
        Supplier::whereIn('id', $ids)->delete();

        activity()
            ->causedBy($request->user())
            ->withProperties([
                'deleted_suppliers' => $supplierNames,
                'count' => count($supplierNames)
            ])
            ->log('Menghapus ' . count($supplierNames) . ' supplier secara bulk');

        Cache::forget('suppliers.data');
        return response()->json(['message' => 'Supplier berhasil dihapus']);
    }
}
