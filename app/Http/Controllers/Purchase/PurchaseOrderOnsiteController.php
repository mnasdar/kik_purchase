<?php

namespace App\Http\Controllers\Purchase;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseOrderItem;
use App\Models\Purchase\PurchaseOrderOnsite;
use App\Models\Purchase\PurchaseRequestItem;
use App\Models\Purchase\PurchaseRequest;

/**
 * Controller untuk mengelola PO Onsite
 * Mengelola tracking onsite dari items purchase order
 */
class PurchaseOrderOnsiteController extends Controller
{
    /**
     * Tampilkan halaman daftar PO Onsite
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user?->hasRole('Super Admin');
        $userLocationId = $user?->location_id;

        // Base query with location filter and exclude received invoices
        $baseQuery = PurchaseOrderOnsite::query()
            ->whereDoesntHave('invoice')
            ->whereHas('purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($isSuperAdmin, $userLocationId) {
                if (!$isSuperAdmin && $userLocationId) {
                    $q->where('location_id', $userLocationId);
                }
            });

        $totalOnsites = (clone $baseQuery)->count();
        $completedOnsites = (clone $baseQuery)->whereNotNull('sla_po_to_onsite_realization')->count();
        $pendingOnsites = (clone $baseQuery)->whereNull('sla_po_to_onsite_realization')->count();
        $recentOnsites = (clone $baseQuery)->where('created_at', '>=', now()->subDays(30))->count();

        // Resources for filters
        $locations = $isSuperAdmin 
            ? \App\Models\Config\Location::orderBy('name')->get(['id','name']) 
            : \App\Models\Config\Location::where('id', $userLocationId)->get(['id','name']);
        
        $classifications = \App\Models\Config\Classification::orderBy('name')->get(['id','name']);

        return view('menu.purchase.po-onsite.index', compact(
            'totalOnsites',
            'completedOnsites',
            'pendingOnsites',
            'recentOnsites',
            'locations',
            'classifications'
        ));
    }

    /**
     * Data onsite untuk tabel
     */
    public function getData(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user?->hasRole('Super Admin');
        $userLocationId = $user?->location_id;

        $query = PurchaseOrderOnsite::with([
            'purchaseOrderItem.purchaseOrder',
            'purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'creator'
        ])
        ->whereDoesntHave('invoice');

        // Filter by user location unless super admin
        if (!$isSuperAdmin && $userLocationId) {
            $query->whereHas('purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($userLocationId) {
                $q->where('location_id', $userLocationId);
            });
        }

        // Filter by PO Number
        if ($request->filled('po_number')) {
            $poNumber = $request->input('po_number');
            $query->whereHas('purchaseOrderItem.purchaseOrder', function ($q) use ($poNumber) {
                $q->where('po_number', 'like', "%{$poNumber}%");
            });
        }

        // Filter by PR Number
        if ($request->filled('pr_number')) {
            $prNumber = $request->input('pr_number');
            $query->whereHas('purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($prNumber) {
                $q->where('pr_number', 'like', "%{$prNumber}%");
            });
        }

        // Filter by Item Description
        if ($request->filled('item_desc')) {
            $itemDesc = $request->input('item_desc');
            $query->whereHas('purchaseOrderItem.purchaseRequestItem', function ($q) use ($itemDesc) {
                $q->where('item_desc', 'like', "%{$itemDesc}%");
            });
        }

        // Filter by Location
        if ($request->filled('location_id')) {
            $locationId = $request->input('location_id');
            $query->whereHas('purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($locationId) {
                $q->where('location_id', $locationId);
            });
        }

        // Filter by Classification
        if ($request->filled('classification_id')) {
            $classId = $request->input('classification_id');
            $query->whereHas('purchaseOrderItem.purchaseRequestItem', function ($q) use ($classId) {
                $q->where('classification_id', $classId);
            });
        }

        // Filter by PR Current Stage
        if ($request->filled('current_stage')) {
            $stage = $request->input('current_stage');
            $query->whereHas('purchaseOrderItem.purchaseRequestItem', function ($q) use ($stage) {
                $q->where('current_stage', $stage);
            });
        }

        // Filter by Onsite Date Range
        if ($request->filled('date_from')) {
            $query->whereDate('onsite_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('onsite_date', '<=', $request->input('date_to'));
        }

        $onsites = $query->latest()->get();

        $onsitesJson = $onsites->map(function ($onsite, $index) {
            $item = $onsite->purchaseOrderItem;
            $po = $item->purchaseOrder ?? null;
            $pri = $item->purchaseRequestItem ?? null;
            $pr = $pri ? $pri->purchaseRequest : null;

            // Format quantity dengan pemisah ribuan
            $formattedQty = number_format($item->quantity ?? 0, 0, ',', '.');

            // Derive status badge from highest item stage
        $maxStage = (int) ($pr->items->max('current_stage') ?? 1);
        $labels = PurchaseRequestItem::getStageLabels();
        $colors = PurchaseRequestItem::getStageColors();
        $stageLabel = $labels[$maxStage] ?? 'Unknown';
        $stageColor = $colors[$maxStage] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        $stageBadge = '<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ' . $stageColor . '"><i class="mgc_box_3_line"></i>' . $stageLabel . '</span>';

            // Calculate SLA percentage
            $targetPoToOnsite = $item->sla_po_to_onsite_target;
            $slaPoToOnsite = $onsite->sla_po_to_onsite_realization;
            $percentSla = null;
            if ($targetPoToOnsite && $slaPoToOnsite) {
                // % SLA: 100% jika selesai tepat waktu (slaPoToOnsite <= targetPoToOnsite), 0% jika terlampaui
                $percentSla = $slaPoToOnsite <= $targetPoToOnsite ? 100 : 0;
            }

            return [
                'id' => $onsite->id,
                'number' => $index + 1,
                'po_number' => $po ? $po->po_number : '-',
                'pr_number' => $pr ? $pr->pr_number : '-',
                'item_desc' => $pri ? $pri->item_desc : '-',
                'quantity' => $formattedQty,
                'po_unit_price' => '<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">' . number_format($item->unit_price ?? 0, 0, ',', '.') . '</span>',
                'po_amount' => '<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">' . number_format($item->amount ?? 0, 0, ',', '.') . '</span>',
                'po_date' => $po && $po->approved_date ? Carbon::parse($po->approved_date)->format('d-M-y') : '-',
                'onsite_date' => $onsite->onsite_date ? Carbon::parse($onsite->onsite_date)->format('d-M-y') : '-',
                'sla_target' => $item->sla_po_to_onsite_target ? $item->sla_po_to_onsite_target . ' hari' : '-',
                'sla_realization' => $onsite->sla_po_to_onsite_realization ? $onsite->sla_po_to_onsite_realization . ' hari' : '-',
                'percent_sla' => $percentSla !== null ? '<span class="text-sm font-semibold ' . ($percentSla === 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') . '">' . $percentSla . '%</span>' : '-',
                'status' => $stageBadge,
                'created_by' => $onsite->creator->name ?? '-',
                'created_at' => $onsite->created_at->format('d-M-y H:i'),
            ];
        });

        return response()->json($onsitesJson);
    }

    /**
     * Search PO Items untuk create onsite
     * Mencari PO berdasarkan nomor PO
     */
    public function search($keyword)
    {
        $poItems = PurchaseOrderItem::with([
            'purchaseOrder',
            'purchaseRequestItem.purchaseRequest',
            'onsites'
        ])
        ->whereHas('purchaseOrder', function ($q) use ($keyword) {
            $q->where('po_number', 'like', "%{$keyword}%");
        })
        ->get();

        $result = $poItems->map(function ($item) {
            $po = $item->purchaseOrder;
            $pri = $item->purchaseRequestItem;
            $pr = $pri ? $pri->purchaseRequest : null;

            return [
                'id' => $item->id,
                'po_id' => $po->id,
                'po_number' => $po->po_number,
                'pr_number' => $pr ? $pr->pr_number : '-',
                'supplier_name' => $po->supplier->name ?? '-',
                'item_desc' => $pri->item_desc ?? '-',
                'quantity' => $item->quantity,
                'uom' => $pri->uom ?? '-',
                'unit_price' => $item->unit_price,
                'amount' => $item->amount,
                'sla_po_to_onsite_target' => $item->sla_po_to_onsite_target,
                'sla_po_to_onsite_realization' => $item->sla_po_to_onsite_realization,
                'approved_date' => $po->approved_date ? Carbon::parse($po->approved_date)->format('Y-m-d') : null,
                'approved_date_formatted' => $po->approved_date ? Carbon::parse($po->approved_date)->format('d-M-y') : null,
                'has_onsite' => $item->onsites->count() > 0,
                'onsites_count' => $item->onsites->count(),
            ];
        });

        return response()->json($result);
    }

    /**
     * Tampilkan form create onsite
     */
    public function create()
    {
        return view('menu.purchase.po-onsite.create');
    }

    /**
     * Simpan onsite baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_items_id' => 'required|exists:purchase_order_items,id',
            'onsite_date' => 'required|date',
            'sla_po_to_onsite_realization' => 'nullable|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Create onsite record
            $onsite = PurchaseOrderOnsite::create([
                'purchase_order_items_id' => $validated['purchase_order_items_id'],
                'onsite_date' => $validated['onsite_date'],
                'sla_po_to_onsite_realization' => $validated['sla_po_to_onsite_realization'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            // Get PO Item dengan relasi PO dan PR
            $poItem = PurchaseOrderItem::with(['purchaseOrder', 'purchaseRequestItem.purchaseRequest'])
                ->findOrFail($validated['purchase_order_items_id']);

            // Update current_stage di PurchaseRequestItem jadi 3 (PO Onsite)
            if ($poItem->purchaseRequestItem) {
                $poItem->purchaseRequestItem->update(['current_stage' => 3]);

            }

            DB::commit();

            return response()->json([
                'message' => 'Data onsite berhasil disimpan!',
                'data' => $onsite
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menyimpan data onsite: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tampilkan detail onsite untuk edit
     */
    public function edit(PurchaseOrderOnsite $po_onsite)
    {
        $po_onsite->load([
            'purchaseOrderItem.purchaseOrder',
            'purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'creator'
        ]);

        return view('menu.purchase.po-onsite.edit', compact('po_onsite'));
    }

    /**
     * Update onsite
     */
    public function update(Request $request, PurchaseOrderOnsite $po_onsite)
    {
        $validated = $request->validate([
            'onsite_date' => 'required|date',
            'sla_po_to_onsite_realization' => 'nullable|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $po_onsite->update([
                'onsite_date' => $validated['onsite_date'],
                'sla_po_to_onsite_realization' => $validated['sla_po_to_onsite_realization'] ?? null,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Data onsite berhasil diupdate!',
                'data' => $po_onsite
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal mengupdate data onsite: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete onsite
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:purchase_order_onsites,id',
        ]);

        DB::beginTransaction();
        try {
            // Get affected PR Items before delete
            $affectedPRItemIds = [];
            $affectedPRIds = [];
            $onsites = PurchaseOrderOnsite::with('purchaseOrderItem.purchaseRequestItem.purchaseRequest')
                ->whereIn('id', $validated['ids'])
                ->get();
            
            foreach ($onsites as $onsite) {
                if ($onsite->purchaseOrderItem && $onsite->purchaseOrderItem->purchaseRequestItem) {
                    $prItem = $onsite->purchaseOrderItem->purchaseRequestItem;
                    $affectedPRItemIds[] = $prItem->id;
                    $affectedPRIds[] = $prItem->purchase_request_id;
                }
            }

            PurchaseOrderOnsite::whereIn('id', $validated['ids'])->delete();

            // Kembalikan current_stage PR Items ke 2 (PO Created)
            if (!empty($affectedPRItemIds)) {
                PurchaseRequestItem::whereIn('id', $affectedPRItemIds)
                    ->update(['current_stage' => 2]);
            }


            DB::commit();

            return response()->json([
                'message' => count($validated['ids']) . ' data onsite berhasil dihapus!'
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus data onsite: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tampilkan form bulk edit onsite
     */
    public function bulkEdit(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $ids = array_filter($ids);

        if (empty($ids)) {
            return redirect()->route('po-onsite.index')->with('error', 'Tidak ada data yang dipilih');
        }

        $onsites = PurchaseOrderOnsite::with([
            'purchaseOrderItem.purchaseOrder',
            'purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'creator'
        ])->whereIn('id', $ids)->get();

        if ($onsites->isEmpty()) {
            return redirect()->route('po-onsite.index')->with('error', 'Data tidak ditemukan');
        }

        return view('menu.purchase.po-onsite.bulk-edit', compact('onsites', 'ids'));
    }

    /**
     * Update multiple onsites
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:purchase_order_onsites,id',
            'onsite_date' => 'required|date',
            'sla_realisasi' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $count = 0;
            foreach ($validated['ids'] as $id) {
                $slaValue = isset($validated['sla_realisasi'][$id]) && $validated['sla_realisasi'][$id] !== null 
                    ? (int) $validated['sla_realisasi'][$id] 
                    : null;
                
                PurchaseOrderOnsite::where('id', $id)->update([
                    'onsite_date' => $validated['onsite_date'],
                    'sla_po_to_onsite_realization' => $slaValue,
                    'updated_at' => now(),
                ]);
                $count++;
            }

            DB::commit();

            return response()->json([
                'message' => count($validated['ids']) . ' data onsite berhasil diupdate!',
                'redirect' => route('po-onsite.index')
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal mengupdate data onsite: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tampilkan detail onsite
     */
    public function show(PurchaseOrderOnsite $po_onsite)
    {
        $po_onsite->load([
            'purchaseOrderItem.purchaseOrder',
            'purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'creator'
        ]);

        $item = $po_onsite->purchaseOrderItem;
        $po = $item->purchaseOrder;
        $pri = $item->purchaseRequestItem;
        $pr = $pri ? $pri->purchaseRequest : null;

        return response()->json([
            'id' => $po_onsite->id,
            'po_number' => $po->po_number,
            'pr_number' => $pr ? $pr->pr_number : '-',
            'item_name' => $pri->item_desc ?? '-',
            'quantity' => $item->quantity,
            'unit' => $pri->uom ?? '-',
            'onsite_date' => $po_onsite->onsite_date ? Carbon::parse($po_onsite->onsite_date)->format('d-M-Y') : '-',
            'sla_target' => $item->sla_po_to_onsite_target ?? '-',
            'sla_realization' => $po_onsite->sla_po_to_onsite_realization ?? '-',
            'created_by' => $po_onsite->creator->name ?? '-',
            'created_at' => $po_onsite->created_at->format('d-M-Y H:i'),
        ]);
    }
}
