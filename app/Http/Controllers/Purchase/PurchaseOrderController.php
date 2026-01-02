<?php

namespace App\Http\Controllers\Purchase;

use Carbon\Carbon;
use App\Models\Purchase\PurchaseRequestItem;
use Illuminate\Http\Request;
use App\Models\Config\Supplier;
use App\Models\Config\Location;
use App\Models\Config\Classification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseRequest;

/**
 * Mengelola Purchase Order.
 */
class PurchaseOrderController extends Controller
{
    /**
     * Daftar PO.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user?->hasRole('Super Admin');
        $userLocationId = $user?->location_id;

        // Base query for location filtering
        $baseQuery = PurchaseOrder::query();

        // Filter by user location (via PR items relationship) unless super admin
        if (!$isSuperAdmin && $userLocationId) {
            $baseQuery->whereHas('items.purchaseRequestItem.purchaseRequest', function ($q) use ($userLocationId) {
                $q->where('location_id', $userLocationId);
            });
        }

        $totalPO = (clone $baseQuery)->count();
        $approvedLast30 = (clone $baseQuery)->whereDate('approved_date', '>=', now()->subDays(30))->count();
        $withSupplier = (clone $baseQuery)->whereNotNull('supplier_id')->count();
        $recentPOs = (clone $baseQuery)->latest()->take(5)->get(['id', 'po_number', 'approved_date']);

        // Resources for filters
        $suppliers = Supplier::orderBy('name')->get(['id', 'name']);
        $locations = $isSuperAdmin ? Location::orderBy('name')->get(['id', 'name']) : Location::where('id', $userLocationId)->get(['id', 'name']);
        $classifications = Classification::orderBy('name')->get(['id', 'name']);
        return view('menu.purchase.purchase-order.index', compact('totalPO', 'approvedLast30', 'withSupplier', 'recentPOs', 'suppliers', 'locations', 'classifications'));
    }

    /**
     * Data PO untuk tabel.
     */
    public function getData(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user?->hasRole('Super Admin');
        $userLocationId = $user?->location_id;

        $query = PurchaseOrder::with(['supplier', 'creator', 'items.purchaseRequestItem.purchaseRequest']);

        // Batasi data berdasarkan lokasi user kecuali super admin
        // Filter via PR location relationship
        if (!$isSuperAdmin && $userLocationId) {
            $query->whereHas('items.purchaseRequestItem.purchaseRequest', function ($q) use ($userLocationId) {
                $q->where('location_id', $userLocationId);
            });
        }

        // Check if any filters are applied
        $hasActiveFilter = $request->filled('po_number')
            || $request->filled('item_desc')
            || $request->filled('pr_number')
            || $request->filled('supplier_id')
            || $request->filled('request_type')
            || $request->filled('location_id')
            || $request->filled('current_stage')
            || $request->filled('classification_id')
            || $request->filled('date_from')
            || $request->filled('date_to');

        // Hanya tampilkan PO yang masih punya item belum PO Onsite jika tidak ada filter
        // Jika ada filter aktif, tampilkan semua PO (termasuk yang sudah PO Onsite)
        if (!$hasActiveFilter) {
            $query->whereHas('items.purchaseRequestItem', function ($q) {
                $q->where('purchase_request_items.current_stage', '<', 3);
            });
        }

        // Filter by PO Number
        if ($request->filled('po_number')) {
            $po = $request->input('po_number');
            $query->where('po_number', 'like', "%{$po}%");
        }

        // Filter by Item Description through PR Item
        if ($request->filled('item_desc')) {
            $desc = $request->input('item_desc');
            $query->whereHas('items.purchaseRequestItem', function ($iq) use ($desc) {
                $iq->where('item_desc', 'like', "%{$desc}%");
            });
        }

        // Filter by PR Number through PR Item relation
        if ($request->filled('pr_number')) {
            $prNum = $request->input('pr_number');
            $query->whereHas('items.purchaseRequestItem.purchaseRequest', function ($q) use ($prNum) {
                $q->where('pr_number', 'like', "%{$prNum}%");
            });
        }

        // Filter by Supplier
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        // Filter by Request Type via related PR
        if ($request->filled('request_type')) {
            $type = $request->input('request_type');
            $query->whereHas('items.purchaseRequestItem.purchaseRequest', function ($q) use ($type) {
                $q->where('request_type', $type);
            });
        }

        // Filter by PR Location
        if ($request->filled('location_id')) {
            $loc = $request->input('location_id');
            $query->whereHas('items.purchaseRequestItem.purchaseRequest', function ($q) use ($loc) {
                $q->where('location_id', $loc);
            });
        }

        // Filter by PR current_stage
        if ($request->filled('current_stage')) {
            $stage = $request->input('current_stage');
            $query->whereHas('items.purchaseRequestItem.purchaseRequest', function ($q) use ($stage) {
                $q->where('current_stage', $stage);
            });
        }

        // Filter by Classification via PR Item
        if ($request->filled('classification_id')) {
            $classId = $request->input('classification_id');
            $query->whereHas('items.purchaseRequestItem', function ($q) use ($classId) {
                $q->where('classification_id', $classId);
            });
        }

        // Filter by PO approved_date range
        if ($request->filled('date_from')) {
            $query->whereDate('approved_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('approved_date', '<=', $request->input('date_to'));
        }

        // Caching with filter-sensitive key
        $filterHash = md5(json_encode($request->all()));
        $latestUpdate = $query->max('updated_at');
        $totalCount = $query->count();
        $stamp = $latestUpdate ? (is_string($latestUpdate) ? Carbon::parse($latestUpdate)->format('YmdHis') : $latestUpdate->format('YmdHis')) : 'none';
        $cacheKey = "purchase_orders.data.{$totalCount}.{$stamp}.{$filterHash}";

        $orders = Cache::remember($cacheKey, 600, function () use ($query) {
            return $query->latest()->get();
        });

        $ordersJson = $orders->map(function ($po, $index) {
            // Collect unique PRs with their stages and request types
            $prStages = [];
            $requestTypes = [];
            foreach ($po->items as $item) {
                if ($item->purchaseRequestItem && $item->purchaseRequestItem->purchaseRequest) {
                    $pr = $item->purchaseRequestItem->purchaseRequest;
                    if (!isset($prStages[$pr->id])) {
                        $prStages[$pr->id] = [
                            'pr_number' => $pr->pr_number,
                            'stage_badge' => $pr->stage_badge,
                        ];
                    }
                    // Collect request types
                    if ($pr->request_type && !in_array($pr->request_type, $requestTypes)) {
                        $requestTypes[] = $pr->request_type;
                    }
                }
            }

            // Generate PR stages HTML (only show badges)
            $prStagesHtml = '<div class="flex flex-wrap gap-1">';
            if (empty($prStages)) {
                $prStagesHtml .= '<span class="text-xs text-gray-400">-</span>';
            } else {
                // Check if all badges are the same
                $allBadges = array_column($prStages, 'stage_badge');
                $uniqueBadges = array_unique($allBadges);

                if (count($uniqueBadges) === 1) {
                    // All badges are the same, show only one
                    $prStagesHtml .= reset($allBadges);
                } else {
                    // Badges are different, show all
                    foreach ($prStages as $prData) {
                        $prStagesHtml .= $prData['stage_badge'];
                    }
                }
            }
            $prStagesHtml .= '</div>';

            // Generate request type HTML
            $requestTypeHtml = '<div class="flex flex-wrap gap-1">';
            if (empty($requestTypes)) {
                $requestTypeHtml .= '<span class="text-xs text-gray-400">-</span>';
            } else {
                // If all request types are the same, show only one badge
                if (count(array_unique($requestTypes)) === 1) {
                    $type = $requestTypes[0];
                    $requestTypeHtml .= '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' . ($type === 'barang' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400') . '">' . ucfirst($type) . '</span>';
                } else {
                    // Multiple different types, show all
                    foreach (array_unique($requestTypes) as $type) {
                        $requestTypeHtml .= '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' . ($type === 'barang' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400') . '">' . ucfirst($type) . '</span> ';
                    }
                }
            }
            $requestTypeHtml .= '</div>';

            // Calculate total amount and total cost saving
            $totalPRAmount = $po->items->sum('purchaseRequestItem.amount');
            $totalAmount = $po->items->sum('amount');
            $totalCostSaving = $po->items->sum('cost_saving');

            return [
                'number' => $index + 1,
                'request_type' => $requestTypeHtml,
                'po_number' => '<span class="font-medium text-gray-900 dark:text-white">' . e($po->po_number) . '</span>',
                'supplier' => $po->supplier
                    ? '<span class="text-gray-700 dark:text-gray-300">' . e($po->supplier->name ?? $po->supplier->company_name ?? 'Supplier') . '</span>'
                    : '<span class="text-gray-400">-</span>',
                'pr_stages' => $prStagesHtml,
                'items_count' => '<span class="po-items-count inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" data-po-id="' . $po->id . '" title="Klik untuk melihat detail items">'
                    . '<i class="mgc_shopping_bag_3_line"></i>'
                    . ' ' . $po->items->count() . ' Items'
                    . '</span>',
                'total_pr_amount' => '<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">Rp ' . number_format($totalPRAmount, 0, ',', '.') . '</span>',
                'total_amount' => '<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">Rp ' . number_format($totalAmount, 0, ',', '.') . '</span>',
                'total_cost_saving' => '<span class="text-sm font-semibold ' . ($totalCostSaving >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') . '">Rp ' . number_format($totalCostSaving, 0, ',', '.') . '</span>',
                'approved_date' => '<span class="text-sm text-gray-600 dark:text-gray-400">' . ($po->approved_date ? Carbon::parse($po->approved_date)->format('d M Y') : '-') . '</span>',
                'created_by' => $po->creator
                    ? '<span class="text-sm text-gray-600 dark:text-gray-400">' . e($po->creator->name) . '</span>'
                    : '<span class="text-gray-400">System</span>',
                'actions' => '
                    <div class="flex gap-2">
                        <button class="btn-edit-po inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" 
                            data-id="' . $po->id . '"
                            data-plugin="tippy" 
                            data-tippy-content="Edit PO">
                            <i class="mgc_edit_line text-base"></i>
                        </button>
                        <button class="btn-delete-po inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" 
                            data-id="' . $po->id . '"
                            data-number="' . e($po->po_number) . '"
                            data-plugin="tippy" 
                            data-tippy-content="Hapus PO">
                            <i class="mgc_delete_2_line text-base"></i>
                        </button>
                    </div>
                ',
                'checkbox' => '<div class="form-check">
                                <input type="checkbox" 
                                    class="form-checkbox rounded text-primary" 
                                    value="' . $po->id . '">
                               </div>',
            ];
        });

        return response()->json($ordersJson);
    }
    /**
     * Tampilkan form create PO (menyamakan pola PR)
     */
    public function create(Request $request)
    {
        $supplier = Supplier::latest()->get(['id', 'name']);

        return view('menu.purchase.purchase-order.create', compact('supplier'));
    }
    /**
     * List PR dengan items untuk pemilihan pada form PO.
     * Hanya tampilkan PR yang memiliki item belum terhubung dengan PO.
     * Support pagination via page & per_page query params
     */
    public function prList(Request $request)
    {
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 100); // Default ke 100 (semua untuk client-side pagination)
        $search = $request->input('search', ''); // Optional search filter

        $query = PurchaseRequest::with([
            'location',
            'items' => function ($q) {
                // Hanya ambil items yang belum terhubung dengan PO (belum ada di purchase_order_items)
                $q->select('id', 'purchase_request_id', 'item_desc', 'uom', 'unit_price', 'quantity', 'amount')
                    ->whereDoesntHave('purchaseOrderItems');
            }
        ])
            // Hanya PR yang punya item belum terhubung
            ->whereHas('items', function ($q) {
                $q->whereDoesntHave('purchaseOrderItems');
            });

        // Apply search filter if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('pr_number', 'like', "%{$search}%")
                    ->orWhereHas('location', function ($locQuery) use ($search) {
                        $locQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Get total count before pagination
        $totalCount = $query->count();

        // Apply pagination
        $prs = $query->latest()
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get(['id', 'pr_number', 'request_type', 'approved_date', 'location_id']);

        // Map dan format response
        $prs = $prs->map(function ($pr) {
            $pr->unlinked_items_count = $pr->items->count();
            $pr->available_items_count = $pr->items->count();
            // Use approved_date instead of created_at
            $pr->formatted_approved_date = $pr->approved_date ? Carbon::parse($pr->approved_date)->format('d-M-Y') : '-';
            // Include raw approved_date in Y-m-d format for SLA calculation
            $pr->approved_date_raw = $pr->approved_date ? Carbon::parse($pr->approved_date)->format('Y-m-d') : null;
            $pr->location_name = $pr->location ? $pr->location->name : '-';
            return $pr;
        });

        return response()->json([
            'data' => $prs,
            'pagination' => [
                'total' => $totalCount,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => ceil($totalCount / $perPage),
                'from' => ($page - 1) * $perPage + 1,
                'to' => min($page * $perPage, $totalCount),
            ]
        ]);
    }

    /**
     * Simpan PO baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'po_number' => 'required|string|max:100|unique:purchase_orders,po_number',
            'approved_date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'notes' => 'nullable|string',
            'items' => 'nullable', // JSON string array of items (optional)
        ]);

        // Decode dan validasi items
        $itemsJson = $request->input('items');
        $items = [];

        if ($itemsJson) {
            $items = json_decode($itemsJson, true) ?? [];
            if (!is_array($items)) {
                return response()->json([
                    'message' => 'Validasi gagal',
                    'errors' => ['items' => ['Items harus berupa array']]
                ], 422);
            }
        }

        if (empty($items)) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => ['items' => ['Minimal harus ada 1 item dari PR']]
            ], 422);
        }

        // Validasi setiap item
        foreach ($items as $index => $item) {
            if (empty($item['unit_price']) || $item['unit_price'] <= 0) {
                return response()->json([
                    'message' => 'Validasi gagal',
                    'errors' => ['items' => ["Item " . ($index + 1) . ": Harga satuan harus lebih dari 0"]]
                ], 422);
            }

            if (empty($item['quantity']) || $item['quantity'] <= 0) {
                return response()->json([
                    'message' => 'Validasi gagal',
                    'errors' => ['items' => ["Item " . ($index + 1) . ": Quantity harus lebih dari 0"]]
                ], 422);
            }
        }

        $data = array_merge($validated, [
            'created_by' => $request->user()?->id,
        ]);

        DB::beginTransaction();
        try {
            $po = PurchaseOrder::create($data);

            // Simpan items dan kumpulkan PR IDs untuk update stage
            $affectedPRIds = [];
            foreach ($items as $item) {
                $prAmount = $item['pr_amount'] ?? 0;
                $poAmount = $item['amount'] ?? 0;
                // cost_saving = PR amount - PO amount
                // Positive: saved money (PO < PR)
                // Negative: overspent (PO > PR)
                $costSaving = $prAmount - $poAmount;

                $po->items()->create([
                    'purchase_request_item_id' => $item['purchase_request_item_id'] ?? null,
                    'unit_price' => $item['unit_price'] ?? 0,
                    'quantity' => $item['quantity'] ?? 0,
                    'amount' => $poAmount,
                    'cost_saving' => $costSaving,
                    'sla_po_to_onsite_target' => $item['sla_po_to_onsite_target'] ?? null,
                    'sla_pr_to_po_realization' => $item['sla_pr_to_po_realization'] ?? null,
                ]);

                // Track PR ID jika ada
                if (!empty($item['purchase_request_item_id'])) {
                    $prItem = PurchaseRequestItem::find($item['purchase_request_item_id']);
                    if ($prItem && $prItem->purchase_request_id) {
                        $affectedPRIds[] = $prItem->purchase_request_id;
                    }
                }
            }

            // Update current_stage untuk PR yang terkait menjadi 2 (PO Linked)
            if (!empty($affectedPRIds)) {
                PurchaseRequest::whereIn('id', array_unique($affectedPRIds))
                    ->update(['current_stage' => 2]);
            }

            activity()
                ->causedBy($request->user())
                ->performedOn($po)
                ->event('created')
                ->withProperties(['po_number' => $po->po_number])
                ->log('Membuat Purchase Order baru');

            Cache::forget("purchase_orders.data");
            DB::commit();
            return response()->json(['message' => 'PO berhasil dibuat', 'data' => $po], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('PO Store Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal membuat PO', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Detail PO.
     */
    public function edit(PurchaseOrder $purchase_order)
    {
        $supplier = Supplier::latest()->get(['id', 'name']);

        $purchase_order->load(['items', 'supplier', 'creator']);
        return view('menu.purchase.purchase-order.edit', compact('purchase_order', 'supplier'));
    }

    /**
     * Update PO.
     */
    public function update(Request $request, PurchaseOrder $purchase_order)
    {
        $validated = $request->validate([
            'po_number' => 'required|string|max:100|unique:purchase_orders,po_number,' . $purchase_order->id,
            'approved_date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'notes' => 'nullable|string',
            'items' => 'nullable', // JSON string array of items untuk sinkronisasi (optional)
        ]);

        // Decode dan validasi items
        $itemsJson = $request->input('items');
        $items = [];

        if ($itemsJson) {
            $items = json_decode($itemsJson, true) ?? [];
            if (!is_array($items)) {
                return response()->json([
                    'message' => 'Validasi gagal',
                    'errors' => ['items' => ['Items harus berupa array']]
                ], 422);
            }
        }

        if (empty($items)) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => ['items' => ['Minimal harus ada 1 item dari PR']]
            ], 422);
        }

        // Validasi setiap item
        foreach ($items as $index => $item) {
            if (empty($item['unit_price']) || $item['unit_price'] <= 0) {
                return response()->json([
                    'message' => 'Validasi gagal',
                    'errors' => ['items' => ["Item " . ($index + 1) . ": Harga satuan harus lebih dari 0"]]
                ], 422);
            }

            if (empty($item['quantity']) || $item['quantity'] <= 0) {
                return response()->json([
                    'message' => 'Validasi gagal',
                    'errors' => ['items' => ["Item " . ($index + 1) . ": Quantity harus lebih dari 0"]]
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $oldData = $purchase_order->toArray();
            $purchase_order->update($validated);

            // Sinkronisasi items: update/create berdasarkan id, hapus yang tidak ada
            if ($itemsJson !== null) {
                $incoming = collect(json_decode($itemsJson, true) ?? []);
                $existing = $purchase_order->items()->get();

                // Update or create
                foreach ($incoming as $item) {
                    $id = $item['id'] ?? null;
                    $prAmount = $item['pr_amount'] ?? 0;
                    $poAmount = $item['amount'] ?? 0;
                    // cost_saving = PR amount - PO amount
                    $costSaving = $prAmount - $poAmount;

                    if ($id) {
                        $purchase_order->items()->where('id', $id)->update([
                            'purchase_request_item_id' => $item['purchase_request_item_id'] ?? null,
                            'unit_price' => $item['unit_price'] ?? 0,
                            'quantity' => $item['quantity'] ?? 0,
                            'amount' => $poAmount,
                            'cost_saving' => $costSaving,
                            'sla_po_to_onsite_target' => $item['sla_po_to_onsite_target'] ?? null,
                            'sla_pr_to_po_realization' => $item['sla_pr_to_po_realization'] ?? null,
                        ]);
                    } else {
                        $purchase_order->items()->create([
                            'purchase_request_item_id' => $item['purchase_request_item_id'] ?? null,
                            'unit_price' => $item['unit_price'] ?? 0,
                            'quantity' => $item['quantity'] ?? 0,
                            'amount' => $poAmount,
                            'cost_saving' => $costSaving,
                            'sla_po_to_onsite_target' => $item['sla_po_to_onsite_target'] ?? null,
                            'sla_pr_to_po_realization' => $item['sla_pr_to_po_realization'] ?? null,
                        ]);
                    }
                }

                // Hapus yang tidak ada di incoming (soft delete)
                $incomingIds = $incoming->pluck('id')->filter()->all();
                $purchase_order->items()
                    ->whereNotIn('id', $incomingIds)
                    ->delete();
            }

            $newData = $purchase_order->fresh()->toArray();

            activity()
                ->causedBy($request->user())
                ->performedOn($purchase_order)
                ->event('updated')
                ->withProperties([
                    'old' => $oldData,
                    'new' => $newData,
                    'po_number' => $purchase_order->po_number
                ])
                ->log('Mengupdate Purchase Order');

            Cache::forget("purchase_orders.data");
            DB::commit();
            return response()->json([
                'message' => 'PO berhasil diupdate',
                'data' => $purchase_order,
                'redirect' => route('purchase-order.index')
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('PO Update Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal mengupdate PO', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Soft delete banyak PO.
     */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        // Kumpulkan PR IDs yang terkait dengan PO yang akan dihapus untuk reset stage
        $affectedPRIds = [];
        $pos = PurchaseOrder::with('items.purchaseRequestItem')->whereIn('id', $ids)->get();

        foreach ($pos as $po) {
            foreach ($po->items as $item) {
                if ($item->purchaseRequestItem && $item->purchaseRequestItem->purchase_request_id) {
                    $affectedPRIds[] = $item->purchaseRequestItem->purchase_request_id;
                }
            }
        }

        // Soft delete PO
        PurchaseOrder::whereIn('id', $ids)->delete();

        // Reset current_stage PR yang terkait kembali ke 1 (PR Created)
        if (!empty($affectedPRIds)) {
            PurchaseRequest::whereIn('id', array_unique($affectedPRIds))
                ->update(['current_stage' => 1]);
        }

        Cache::forget("purchase_orders.data");
        return response()->json(['message' => 'PO berhasil dihapus']);
    }

    /**
     * Check apakah PO Number sudah pernah diinput (termasuk yang sudah dihapus)
     */
    public function checkDeletedItem(Request $request)
    {
        $poNumber = $request->input('po_number');

        if (!$poNumber) {
            return response()->json([
                'has_deleted_item' => false,
                'deleted_item' => null,
            ]);
        }

        // Cek PO yang sudah dihapus (soft deleted) dengan PO number yang sama
        $deletedPO = PurchaseOrder::onlyTrashed()
            ->with(['items.purchaseRequestItem.purchaseRequest', 'supplier'])
            ->where('po_number', $poNumber)
            ->first();

        if (!$deletedPO) {
            return response()->json([
                'has_deleted_item' => false,
                'deleted_item' => null,
            ]);
        }

        // Format data PO dan items untuk response
        $poData = [
            'id' => $deletedPO->id,
            'po_number' => $deletedPO->po_number,
            'approved_date' => $deletedPO->approved_date ? Carbon::parse($deletedPO->approved_date)->format('Y-m-d') : null,
            'supplier_id' => $deletedPO->supplier_id,
            'supplier_name' => $deletedPO->supplier ? $deletedPO->supplier->name : null,
            'notes' => $deletedPO->notes,
            'items' => $deletedPO->items->map(function ($item) {
                $prItem = $item->purchaseRequestItem;
                $pr = $prItem?->purchaseRequest;

                return [
                    'id' => $item->id,
                    'purchase_request_item_id' => $item->purchase_request_item_id,
                    'pr_number' => $pr?->pr_number,
                    'item_desc' => $prItem?->item_desc,
                    'uom' => $prItem?->uom,
                    'unit_price' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'amount' => $item->amount,
                    'pr_amount' => $prItem?->amount,
                    'pr_unit_price' => $prItem?->unit_price,
                    'pr_quantity' => $prItem?->quantity,
                    'sla_po_to_onsite_target' => $item->sla_po_to_onsite_target,
                    'sla_pr_to_po_realization' => $item->sla_pr_to_po_realization,
                    'approved_date' => $pr?->approved_date ? Carbon::parse($pr->approved_date)->format('Y-m-d') : null,
                ];
            })->toArray(),
        ];

        return response()->json([
            'has_deleted_item' => true,
            'deleted_item' => $poData,
        ]);
    }

    /**
     * Restore PO yang sudah dihapus beserta items-nya
     */
    public function restore(Request $request, $id)
    {
        try {
            // Find deleted PO
            $po = PurchaseOrder::onlyTrashed()->with('items')->findOrFail($id);

            // Restore PO
            $po->restore();

            // Restore all items
            $po->items()->onlyTrashed()->restore();

            activity()
                ->causedBy($request->user())
                ->performedOn($po)
                ->event('restored')
                ->withProperties(['po_number' => $po->po_number])
                ->log('Mengaktifkan kembali Purchase Order');

            Cache::forget("purchase_orders.data");

            return response()->json([
                'message' => 'PO berhasil diaktifkan kembali',
                'data' => $po->load(['items.purchaseRequestItem.purchaseRequest', 'supplier'])
            ]);
        } catch (\Throwable $e) {
            Log::error('PO Restore Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal mengaktifkan PO', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get detail PO dengan items lengkap untuk modal
     */
    public function detail(PurchaseOrder $purchase_order)
    {
        $purchase_order->load(['supplier', 'items.purchaseRequestItem.purchaseRequest.location', 'creator']);

        return response()->json([
            'po' => [
                'id' => $purchase_order->id,
                'po_number' => $purchase_order->po_number,
                'approved_date' => $purchase_order->approved_date ? Carbon::parse($purchase_order->approved_date)->format('d-M-Y') : '-',
                'approved_date_raw' => $purchase_order->approved_date,
                'supplier' => $purchase_order->supplier ? $purchase_order->supplier->name : '-',
                'notes' => $purchase_order->notes ?: '-',
                'created_by' => $purchase_order->creator ? $purchase_order->creator->name : '-',
                'created_at' => $purchase_order->created_at ? $purchase_order->created_at->format('d-M-Y H:i') : '-',
            ],
            'items' => $purchase_order->items->map(function ($item) {
                $prItem = $item->purchaseRequestItem;
                $pr = $prItem && $prItem->purchaseRequest ? $prItem->purchaseRequest : null;

                // PR Data
                $prNumber = $pr ? $pr->pr_number : '-';
                $prLocation = $pr && $pr->location ? $pr->location->name : '-';
                $prItemDesc = $prItem ? $prItem->item_desc : '-';
                $prUom = $prItem ? $prItem->uom : '-';
                $prApprovedDate = $pr && $pr->approved_date ? Carbon::parse($pr->approved_date)->format('d-M-Y') : '-';
                $prApprovedDateRaw = $pr && $pr->approved_date ? Carbon::parse($pr->approved_date)->format('Y-m-d') : null;
                $prUnitPrice = $prItem ? $prItem->unit_price : 0;
                $prQty = $prItem ? $prItem->quantity : 0;
                $prAmount = $prItem ? $prItem->amount : 0;

                // PO Data (from PO Item)
                $poUnitPrice = $item->unit_price;
                $poQty = $item->quantity;
                $poAmount = $item->amount;

                // Cost Saving Calculation
                $costSaving = $prAmount - $poAmount;
                $percentCostSaving = $prAmount > 0 ? (($costSaving / $prAmount) * 100) : 0;

                // SLA Calculation
                $targetPrToPo = $prItem->sla_pr_to_po_target; // Target days
                $slaPrToPo = $item->sla_pr_to_po_realization; // Actual days taken
                $percentSla = null;
                if ($targetPrToPo && $slaPrToPo) {
                    // % SLA: 100% jika selesai tepat waktu (slaPrToPo <= targetPrToPo), 0% jika terlampaui
                    $percentSla = $slaPrToPo <= $targetPrToPo ? 100 : 0;
                }

                return [
                    'pr_number' => $prNumber,
                    'pr_location' => $prLocation,
                    'pr_item_desc' => $prItemDesc,
                    'pr_uom' => $prUom,
                    'pr_approved_date' => $prApprovedDate,
                    'pr_approved_date_raw' => $prApprovedDateRaw,
                    'pr_unit_price' => number_format($prUnitPrice, 0, ',', '.'),
                    'pr_unit_price_raw' => $prUnitPrice,
                    'pr_qty' => $prQty,
                    'pr_amount' => number_format($prAmount, 0, ',', '.'),
                    'pr_amount_raw' => $prAmount,
                    'po_unit_price' => number_format($poUnitPrice, 0, ',', '.'),
                    'po_unit_price_raw' => $poUnitPrice,
                    'po_qty' => $poQty,
                    'po_amount' => number_format($poAmount, 0, ',', '.'),
                    'po_amount_raw' => $poAmount,
                    'cost_saving' => number_format($costSaving, 0, ',', '.'),
                    'cost_saving_raw' => $costSaving,
                    'percent_cost_saving' => $percentCostSaving ? number_format($percentCostSaving, 0, ',', '.') . '%' : '-',
                    'percent_cost_saving_raw' => $percentCostSaving,
                    'target_pr_to_po' => $targetPrToPo ? $targetPrToPo . ' hari' : '-',
                    'target_pr_to_po_raw' => $targetPrToPo,
                    'sla_pr_to_po' => $slaPrToPo ? $slaPrToPo . ' hari' : '-',
                    'sla_pr_to_po_raw' => $slaPrToPo,
                    'percent_sla' => $percentSla !== null ? number_format($percentSla, 0, ',', '.') . '%' : '-',
                    'percent_sla_raw' => $percentSla,
                ];
            }),
        ]);
    }
}
