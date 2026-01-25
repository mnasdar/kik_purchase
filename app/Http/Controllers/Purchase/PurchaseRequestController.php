<?php

namespace App\Http\Controllers\Purchase;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\Config\Location;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Config\Classification;
use Illuminate\Support\Facades\Cache;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Purchase\PurchaseRequestItem;

/**
 * Mengelola Purchase Request (PR).
 */
class PurchaseRequestController extends Controller
{
    /**
     * Tampilkan halaman PR dengan statistik.
     */
    public function index(Request $request)
    {
        // Check permission
        $this->authorize('purchase-requests.view');

        $user = $request->user();
        $isSuperAdmin = $user?->hasRole('Super Admin');
        $userLocationId = $user?->location_id;

        // Batasi data berdasarkan lokasi user kecuali super admin
        $baseQuery = PurchaseRequest::query();
        if (!$isSuperAdmin && $userLocationId) {
            $baseQuery->where('location_id', $userLocationId);
        }

        // 1. Total PR
        $totalPRs = (clone $baseQuery)->count();

        // 2. Total Item PR (total purchase request items)
        $totalItems = PurchaseRequestItem::whereIn(
            'purchase_request_id',
            (clone $baseQuery)->pluck('id')
        )->count();

        // 3. Total Item PR yang sudah dibuatkan PO (items yang memiliki purchase order)
        $totalItemsWithoutPO = PurchaseRequestItem::whereIn(
            'purchase_request_id',
            (clone $baseQuery)->pluck('id')
        )->whereDoesntHave('purchaseOrderItems')
            ->count();

        // 4. Total PR yang dibuat dalam 30 hari terakhir
        $recentPRs = (clone $baseQuery)->where('created_at', '>=', now()->subDays(30))->count();

        $locations = $isSuperAdmin ? Location::all() : Location::where('id', $userLocationId)->get();
        $classifications = Classification::all();

        return view('menu.purchase.purchase-request.index', compact(
            'totalPRs',
            'totalItems',
            'totalItemsWithoutPO',
            'recentPRs',
            'locations',
            'classifications'
        ));
    }

    /**
     * Data PR untuk kebutuhan tabel.
     */
    public function getData(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user?->hasRole('Super Admin');
        $userLocationId = $user?->location_id;

        // Build query based on filters
        $query = PurchaseRequest::with(['location', 'creator', 'items.classification']);

        // Batasi data berdasarkan lokasi user kecuali super admin
        // Tetap berlaku bahkan saat ada filter aktif
        if (!$isSuperAdmin && $userLocationId) {
            $query->where('location_id', $userLocationId);
        }

        // Check if any filters are applied
        $hasActiveFilter = $request->filled('pr_number')
            || $request->filled('item_desc')
            || $request->filled('request_type')
            || $request->filled('location_id')
            || $request->filled('current_stage')
            || $request->filled('classification_id')
            || $request->filled('date_from')
            || $request->filled('date_to')
            || $request->filled('stat_filter');

        // Handle statistic card filters
        if ($request->filled('stat_filter')) {
            $statFilter = $request->stat_filter;
            
            switch ($statFilter) {
                case 'total_prs':
                    // Show all PRs - no additional filter
                    break;
                    
                case 'total_items':
                    // Show all PRs with items - no additional filter since all PR have items
                    break;
                    
                case 'items_without_po':
                    // Show PRs that have items without PO
                    $query->whereHas('items', function ($iq) {
                        $iq->whereDoesntHave('purchaseOrderItems');
                    });
                    break;
                    
                case 'recent_prs':
                    // Show PRs created in last 30 days
                    $query->where('created_at', '>=', now()->subDays(30));
                    break;
            }
        } else if (!$hasActiveFilter) {
            // Default (tanpa filter aktif): tampilkan hanya PR yang itemnya belum memiliki PO
            $query->whereHas('items', function ($iq) {
                $iq->whereDoesntHave('purchaseOrderItems');
            });
        }

        // Filter PR Number (exact or partial)
        if ($request->filled('pr_number')) {
            $qNum = $request->input('pr_number');
            $query->where('pr_number', 'like', "%{$qNum}%");
        }

        // Filter Item Description via items relation
        if ($request->filled('item_desc')) {
            $qItem = $request->input('item_desc');
            $query->whereHas('items', function ($q) use ($qItem) {
                $q->where('item_desc', 'like', "%{$qItem}%");
            });
        }

        // Filter by request_type
        if ($request->filled('request_type')) {
            $query->where('request_type', $request->request_type);
        }

        // Filter by location
        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        // Filter by current_stage (item-level)
        if ($request->filled('current_stage')) {
            $query->whereHas('items', function ($q) use ($request) {
                $q->where('purchase_request_items.current_stage', (int) $request->current_stage);
            });
        }

        // Filter by classification (through items relationship)
        if ($request->filled('classification_id')) {
            $query->whereHas('items', function ($q) use ($request) {
                $q->where('classification_id', $request->classification_id);
            });
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Use cache with filters in key
        $filterHash = md5(json_encode($request->all()));
        $latestUpdate = $query->max('updated_at');
        $totalCount = $query->count();
        $stamp = $latestUpdate ? (is_string($latestUpdate) ? Carbon::parse($latestUpdate)->format('YmdHis') : $latestUpdate->format('YmdHis')) : 'none';
        $cacheKey = "purchase_requests.data.{$totalCount}.{$stamp}.{$filterHash}";

        $prs = Cache::remember($cacheKey, 600, function () use ($query) {
            return $query->latest()->get();
        });

        $prsJson = $prs->map(function ($pr, $index) {
            $user = auth()->user();
            $canEdit = $user && $user->hasPermissionTo('purchase-requests.edit');
            $canDelete = $user && $user->hasPermissionTo('purchase-requests.delete');

            // Lock PR if stage is not 1 (PR Created)
            $isLocked = $pr->isLocked();
            $lockIcon = $isLocked ? '<i class="mgc_lock_line text-xs ml-1"></i>' : '';
            $disabledClass = $isLocked ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
            $disabledAttr = $isLocked ? 'disabled' : '';

            // Derive status badge from the highest item stage
            $maxStage = (int) ($pr->items->max('current_stage') ?? 1);
            $labels = PurchaseRequestItem::getStageLabels();
            $colors = PurchaseRequestItem::getStageColors();
            $stageLabel = $labels[$maxStage] ?? 'Unknown';
            $stageColor = $colors[$maxStage] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
            $stageBadge = '<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ' . $stageColor . '"><i class="mgc_box_3_line"></i>' . $stageLabel . '</span>';

            // Calculate total amount from all items
            $totalAmount = $pr->items->sum('amount');
            $formattedAmount = 'Rp ' . number_format($totalAmount, 0, ',', '.');

            // Build actions based on permissions
            $actions = '<div class="flex gap-2">';
            
            if ($canEdit) {
                $actions .= '<button class="btn-edit-pr inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors ' . $disabledClass . '" 
                    data-id="' . $pr->id . '"
                    data-plugin="tippy" 
                    data-tippy-content="' . ($isLocked ? 'PR sudah terkunci' : 'Edit PR') . '"
                    ' . $disabledAttr . '>
                    <i class="mgc_edit_line text-base"></i>
                </button>';
            }
            
            if ($canDelete) {
                $actions .= '<button class="btn-delete-pr inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ' . $disabledClass . '" 
                    data-id="' . $pr->id . '"
                    data-number="' . e($pr->pr_number) . '"
                    data-plugin="tippy" 
                    data-tippy-content="' . ($isLocked ? 'PR sudah terkunci' : 'Hapus PR') . '"
                    ' . $disabledAttr . '>
                    <i class="mgc_delete_2_line text-base"></i>
                </button>';
            }
            
            $actions .= '</div>';

            return [
                'number' => $index + 1,
                'pr_number' => '<span class="font-medium text-gray-900 dark:text-white">' . e($pr->pr_number) . $lockIcon . '</span>',
                'location' => $pr->location 
                    ? '<span class="text-gray-700 dark:text-gray-300">' . e($pr->location->name) . '</span>'
                    : '<span class="text-gray-400">-</span>',
                'items_count' => '<span class="pr-items-count inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" data-pr-id="' . $pr->id . '" title="Klik untuk melihat detail items">
                                    <i class="mgc_shopping_bag_3_line"></i>
                                    ' . $pr->items->count() . ' Items
                                  </span>',
                'total_amount' => '<span class="text-sm font-semibold text-gray-900 dark:text-white">' . $formattedAmount . '</span>',
                'approved_date' => $pr->approved_date 
                    ? '<span class="text-sm text-gray-600 dark:text-gray-400">' . Carbon::parse($pr->approved_date)->format('d M Y') . '</span>'
                    : '<span class="text-gray-400">-</span>',
                'status' => $stageBadge,
                'request_type' => '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' . ($pr->request_type === 'barang' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400') . '">' . ucfirst($pr->request_type) . '</span>',
                'created_at' => '<span class="text-sm text-gray-600 dark:text-gray-400">' . $pr->created_at->format('d M Y') . '</span>',
                'created_by' => $pr->creator 
                    ? '<span class="text-sm text-gray-600 dark:text-gray-400">' . e($pr->creator->name) . '</span>'
                    : '<span class="text-gray-400">System</span>',
                'actions' => $actions,
                'checkbox' => '<div class="form-check">
                                <input type="checkbox" 
                                    class="form-checkbox rounded text-primary ' . $disabledClass . '" 
                                    value="' . $pr->id . '"
                                    ' . $disabledAttr . '>
                               </div>',
            ];
        });

        return response()->json($prsJson);
    }

    /**
     * Tampilkan form create PR.
     */
    public function create(Request $request)
    {
        // Check permission
        $this->authorize('purchase-requests.create');

        $classifications = Classification::all();

        // Check if user is super admin
        $isSuperAdmin = $request->user()?->hasRole('Super Admin');
        
        // Ambil lokasi dari user yang login
        $userLocationId = $request->user()?->location_id;
        $userLocationName = $userLocationId ? Location::find($userLocationId)?->name : null;
        
        // Jika super admin, ambil semua lokasi
        $locations = $isSuperAdmin ? Location::all() : null;

        return view('menu.purchase.purchase-request.create', [
            'classifications' => $classifications,
            'userLocationId' => $userLocationId,
            'userLocationName' => $userLocationName,
            'isSuperAdmin' => $isSuperAdmin,
            'locations' => $locations,
        ]);
    }

    /**
     * Simpan PR baru dengan items.
     */
    public function store(Request $request)
    {
        // Check permission
        $this->authorize('purchase-requests.create');

        $validated = $request->validate([
            'pr_number' => 'required|string|max:100|unique:purchase_requests,pr_number',
            'approved_date' => 'required|date',
            'request_type' => 'required|in:barang,jasa',
            'location_id' => 'required|exists:locations,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.classification_id' => 'nullable|exists:classifications,id',
            'items.*.item_desc' => 'required|string|max:255',
            'items.*.uom' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.amount' => 'required|numeric|min:0',
            'items.*.sla_pr_to_po_target' => 'required|integer|min:0',
        ]);

        // Untuk super admin, ambil location_id dari input form
        // Untuk user biasa, ambil dari profile user
        $isSuperAdmin = $request->user()?->hasRole('Super Admin');
        $locationId = $isSuperAdmin ? $validated['location_id'] : $request->user()?->location_id;

        if (!$locationId) {
            return response()->json(['message' => 'Lokasi pengguna belum diatur, hubungi administrator'], 422);
        }

        DB::beginTransaction();
        try {
            $pr = PurchaseRequest::create([
                'pr_number' => $validated['pr_number'],
                'location_id' => $locationId,
                'approved_date' => $validated['approved_date'],
                'request_type' => $validated['request_type'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            // Check if there are items to restore
            $restoreItemIds = [];
            if ($request->has('restore_item_ids')) {
                $restoreItemIds = json_decode($request->input('restore_item_ids'), true) ?? [];
            }

            // Process each item
            foreach ($validated['items'] as $index => $item) {
                // Check if this item should be restored
                $shouldRestore = false;
                $itemToRestore = null;
                
                if (!empty($restoreItemIds)) {
                    // Find matching deleted item
                    $itemToRestore = PurchaseRequestItem::onlyTrashed()
                        ->where('purchase_request_id', $pr->id)
                        ->where('item_desc', $item['item_desc'])
                        ->where('uom', $item['uom'])
                        ->where('unit_price', $item['unit_price'])
                        ->whereIn('id', $restoreItemIds)
                        ->first();
                    
                    if ($itemToRestore) {
                        $shouldRestore = true;
                    }
                }
                
                if ($shouldRestore && $itemToRestore) {
                    // Restore the deleted item with updated quantity
                    $itemToRestore->restore();
                    $itemToRestore->update([
                        'classification_id' => $item['classification_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'amount' => $item['amount'],
                        'sla_pr_to_po_target' => $item['sla_pr_to_po_target'],
                    ]);
                } else {
                    // Create new item
                    PurchaseRequestItem::create([
                        'purchase_request_id' => $pr->id,
                        'classification_id' => $item['classification_id'] ?? null,
                        'item_desc' => $item['item_desc'],
                        'uom' => $item['uom'],
                        'unit_price' => $item['unit_price'],
                        'quantity' => $item['quantity'],
                        'amount' => $item['amount'],
                        'sla_pr_to_po_target' => $item['sla_pr_to_po_target'],
                        'current_stage' => 1,
                    ]);
                }
            }

            activity()
                ->causedBy($request->user())
                ->performedOn($pr)
                ->withProperties(['attributes' => $pr->toArray()])
                ->log('Menambahkan purchase request: ' . $pr->pr_number);

            Cache::forget("purchase_requests.data");
            DB::commit();
            return response()->json([
                'message' => 'Purchase request berhasil dibuat',
                'data' => $pr->load('items'),
                'redirect' => route('purchase-request.index')
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat PR', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Tampilkan form edit PR.
     */
    public function edit(PurchaseRequest $purchase_request, Request $request)
    {
        $this->authorize('purchase-requests.edit');

        $locations = Location::all();
        $classifications = Classification::all();
        
        // Check if user is super admin
        $isSuperAdmin = $request->user()?->hasRole('Super Admin');
        
        return view('menu.purchase.purchase-request.edit', compact('purchase_request', 'locations', 'classifications', 'isSuperAdmin'));
    }

    /**
     * Update PR dengan items.
     */
    public function update(Request $request, PurchaseRequest $purchase_request)
    {
        $this->authorize('purchase-requests.edit');

        $validated = $request->validate([
            'pr_number' => 'required|string|max:100|unique:purchase_requests,pr_number,' . $purchase_request->id,
            'approved_date' => 'required|date',
            'request_type' => 'required|in:barang,jasa',
            'location_id' => 'required|exists:locations,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:purchase_request_items,id',
            'items.*.classification_id' => 'nullable|exists:classifications,id',
            'items.*.item_desc' => 'required|string|max:255',
            'items.*.uom' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.amount' => 'required|numeric|min:0',
            'items.*.sla_pr_to_po_target' => 'required|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $oldData = $purchase_request->toArray();
            
            $purchase_request->update([
                'pr_number' => $validated['pr_number'],
                'location_id' => $validated['location_id'],
                'approved_date' => $validated['approved_date'],
                'request_type' => $validated['request_type'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Get restore item IDs from request
            $restoreItemIds = $request->input('restore_item_ids') 
                ? json_decode($request->input('restore_item_ids'), true) 
                : [];

            // Get existing item IDs that should be kept
            $existingItemIds = collect($validated['items'])
                ->filter(fn($item) => isset($item['id']))
                ->pluck('id')
                ->toArray();

            // Delete items that are not in the submission and not being restored
            $purchase_request->items()
                ->whereNotIn('id', $existingItemIds)
                ->delete();
            
            foreach ($validated['items'] as $item) {
                // If item has ID, update existing item
                if (isset($item['id'])) {
                    $existingItem = PurchaseRequestItem::find($item['id']);
                    if ($existingItem && $existingItem->purchase_request_id == $purchase_request->id) {
                        $existingItem->update([
                            'classification_id' => $item['classification_id'] ?? null,
                            'item_desc' => $item['item_desc'],
                            'uom' => $item['uom'],
                            'unit_price' => $item['unit_price'],
                            'quantity' => $item['quantity'],
                            'amount' => $item['amount'],
                            'sla_pr_to_po_target' => $item['sla_pr_to_po_target'],
                        ]);
                    }
                } else {
                    // New item: check if it should restore a deleted item
                    $itemToRestore = PurchaseRequestItem::onlyTrashed()
                        ->where('purchase_request_id', $purchase_request->id)
                        ->where('item_desc', $item['item_desc'])
                        ->where('uom', $item['uom'])
                        ->where('unit_price', $item['unit_price'])
                        ->whereIn('id', $restoreItemIds)
                        ->first();

                    if ($itemToRestore) {
                        // Restore and update the deleted item
                        $itemToRestore->restore();
                        $itemToRestore->update([
                            'classification_id' => $item['classification_id'] ?? $itemToRestore->classification_id,
                            'quantity' => $item['quantity'],
                            'amount' => $item['amount'],
                            'sla_pr_to_po_target' => $item['sla_pr_to_po_target'],
                        ]);
                    } else {
                        // Create new item
                        PurchaseRequestItem::create([
                            'purchase_request_id' => $purchase_request->id,
                            'classification_id' => $item['classification_id'] ?? null,
                            'item_desc' => $item['item_desc'],
                            'uom' => $item['uom'],
                            'unit_price' => $item['unit_price'],
                            'quantity' => $item['quantity'],
                            'amount' => $item['amount'],
                            'sla_pr_to_po_target' => $item['sla_pr_to_po_target'],
                        ]);
                    }
                }
            }

            $newData = $purchase_request->fresh()->toArray();

            activity()
                ->causedBy($request->user())
                ->performedOn($purchase_request)
                ->withProperties([
                    'old' => $oldData,
                    'new' => $newData
                ])
                ->log('Mengupdate purchase request: ' . $purchase_request->pr_number);

            Cache::forget("purchase_requests.data");
            DB::commit();
            return response()->json([
                'message' => 'Purchase request berhasil diupdate',
                'data' => $purchase_request->load('items'),
                'redirect' => route('purchase-request.index')
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengupdate PR', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Soft delete banyak PR.
     */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        $prs = PurchaseRequest::whereIn('id', $ids)->get();
        $prNumbers = $prs->pluck('pr_number')->toArray();
        
        PurchaseRequest::whereIn('id', $ids)->delete();

        activity()
            ->causedBy($request->user())
            ->withProperties([
                'deleted_prs' => $prNumbers,
                'count' => count($prNumbers)
            ])
            ->log('Menghapus ' . count($prNumbers) . ' purchase request secara bulk');

        Cache::forget("purchase_requests.data");
        return response()->json(['message' => 'Purchase request berhasil dihapus']);
    }

    /**
     * Check for a single deleted item that matches the input
     */
    public function checkDeletedItem(Request $request)
    {
        $prNumber = $request->input('pr_number');
        $itemDesc = $request->input('item_desc');
        $uom = $request->input('uom');
        $unitPrice = $request->input('unit_price');

        if (empty($prNumber) || empty($itemDesc) || empty($uom) || empty($unitPrice)) {
            return response()->json([
                'has_deleted_item' => false,
                'deleted_item' => null
            ]);
        }

        // Find PR with this number (including soft deleted)
        $pr = PurchaseRequest::where('pr_number', $prNumber)
            ->withTrashed()
            ->first();

        if (!$pr) {
            return response()->json([
                'has_deleted_item' => false,
                'deleted_item' => null
            ]);
        }

        // Find matching deleted item with same purchase_request_id
        $deletedItem = PurchaseRequestItem::onlyTrashed()
            ->where('purchase_request_id', $pr->id)
            ->where('item_desc', $itemDesc)
            ->where('uom', $uom)
            ->where('unit_price', $unitPrice)
            ->first();

        if (!$deletedItem) {
            return response()->json([
                'has_deleted_item' => false,
                'deleted_item' => null
            ]);
        }

        return response()->json([
            'has_deleted_item' => true,
            'deleted_item' => [
                'id' => $deletedItem->id,
                'item_desc' => $deletedItem->item_desc,
                'uom' => $deletedItem->uom,
                'unit_price' => $deletedItem->unit_price,
                'quantity' => $deletedItem->quantity,
                'amount' => $deletedItem->amount,
                'classification_id' => $deletedItem->classification_id
            ],
            'purchase_request_id' => $pr->id
        ]);
    }

    /**
     * Check apakah PR Number sudah pernah diinput (termasuk yang sudah dihapus)
     */
    public function checkDeletedPR(Request $request)
    {
        $prNumber = $request->input('pr_number');
        
        if (!$prNumber) {
            return response()->json([
                'has_deleted_pr' => false,
                'deleted_pr' => null,
            ]);
        }

        // Cek PR yang sudah dihapus (soft deleted) dengan PR number yang sama
        $deletedPR = PurchaseRequest::onlyTrashed()
            ->with(['items.classification', 'location'])
            ->where('pr_number', $prNumber)
            ->first();

        if (!$deletedPR) {
            return response()->json([
                'has_deleted_pr' => false,
                'deleted_pr' => null,
            ]);
        }

        // Format data PR dan items untuk response
        $prData = [
            'id' => $deletedPR->id,
            'pr_number' => $deletedPR->pr_number,
            'approved_date' => $deletedPR->approved_date ? Carbon::parse($deletedPR->approved_date)->format('Y-m-d') : null,
            'request_type' => $deletedPR->request_type,
            'location_id' => $deletedPR->location_id,
            'location_name' => $deletedPR->location ? $deletedPR->location->name : null,
            'notes' => $deletedPR->notes,
            'items' => $deletedPR->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'classification_id' => $item->classification_id,
                    'classification_name' => $item->classification ? $item->classification->name : null,
                    'item_desc' => $item->item_desc,
                    'uom' => $item->uom,
                    'unit_price' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'amount' => $item->amount,
                    'sla_pr_to_po_target' => $item->sla_pr_to_po_target,
                ];
            })->toArray(),
        ];

        return response()->json([
            'has_deleted_pr' => true,
            'deleted_pr' => $prData,
        ]);
    }

    /**
     * Restore PR yang sudah dihapus beserta items-nya
     */
    public function restorePR(Request $request, $id)
    {
        try {
            // Find deleted PR
            $pr = PurchaseRequest::onlyTrashed()->with('items')->findOrFail($id);
            
            // Restore PR
            $pr->restore();
            
            // Restore all items
            $pr->items()->onlyTrashed()->restore();

            activity()
                ->causedBy($request->user())
                ->performedOn($pr)
                ->withProperties(['attributes' => $pr->toArray()])
                ->log('Mengaktifkan kembali purchase request: ' . $pr->pr_number);

            Cache::forget("purchase_requests.data");

            return response()->json([
                'message' => 'Purchase request berhasil diaktifkan kembali',
                'data' => $pr->load(['items.classification', 'location'])
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Gagal mengaktifkan PR', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get detail PR dengan items lengkap untuk modal
     */
    public function detail(PurchaseRequest $purchase_request)
    {
        $purchase_request->load(['location', 'items.classification', 'creator']);

        // Derive status badge from highest item stage
        $maxStage = (int) ($purchase_request->items->max('current_stage') ?? 1);
        $labels = PurchaseRequestItem::getStageLabels();
        $colors = PurchaseRequestItem::getStageColors();
        $stageLabel = $labels[$maxStage] ?? 'Unknown';
        $stageColor = $colors[$maxStage] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        $stageBadge = '<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ' . $stageColor . '"><i class="mgc_box_3_line"></i>' . $stageLabel . '</span>';

        return response()->json([
            'pr' => [
                'id' => $purchase_request->id,
                'request_type' => $purchase_request->request_type,
                'pr_number' => $purchase_request->pr_number,
                'approved_date' => $purchase_request->approved_date ? Carbon::parse($purchase_request->approved_date)->format('d-M-Y') : '-',
                'approved_date_raw' => $purchase_request->approved_date,
                'notes' => $purchase_request->notes ?: '-',
                'location' => $purchase_request->location ? $purchase_request->location->name : '-',
                'created_by' => $purchase_request->creator ? $purchase_request->creator->name : '-',
                'created_at' => $purchase_request->created_at ? $purchase_request->created_at->format('d-M-Y H:i') : '-',
                'status' => $stageBadge,
            ],
            'items' => $purchase_request->items->map(function ($item) {
                return [
                    'no' => $item->id,
                    'item_desc' => $item->item_desc,
                    'classification' => $item->classification ? $item->classification->name : '-',
                    'uom' => $item->uom,
                    'quantity' => $item->quantity,
                    'unit_price' => number_format($item->unit_price, 0, ',', '.'),
                    'amount' => number_format($item->amount, 0, ',', '.'),
                    'current_stage' => (int) ($item->current_stage ?? 1),
                    'current_stage_badge' => $item->stage_badge,
                    'sla_pr_to_po_target' => (int) ($item->sla_pr_to_po_target ?? 0),
                ];
            }),
        ]);
    }
}

