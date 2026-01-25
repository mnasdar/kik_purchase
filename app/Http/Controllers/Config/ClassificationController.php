<?php

namespace App\Http\Controllers\Config;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\Controller;
use App\Models\Config\Classification;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\Payment;

class ClassificationController extends Controller
{
    /**
     * Tampilkan halaman klasifikasi dengan statistik.
     */
    public function index()
    {
        $this->authorize('classifications.view');

        $totalClassifications = Classification::count();
        $recentClassifications = Classification::where('created_at', '>=', now()->subDays(30))->count();

        return view('menu.config.classification.index', compact(
            'totalClassifications',
            'recentClassifications'
        ));
    }

    /**
     * Ambil data klasifikasi untuk tabel.
     */
    public function getData()
    {
        $classifications = Cache::remember('classifications.data', 3600, function () {
            return Classification::withCount(['purchaseRequestItems'])->latest()->get();
        });

        $classificationsJson = $classifications->map(function ($classification, $index) {
            $user = auth()->user();
            $canEdit = $user && $user->hasPermissionTo('classifications.edit');
            $canDelete = $user && $user->hasPermissionTo('classifications.delete');

            $actions = '<div class="flex gap-2">';
            
            if ($canEdit) {
                $actions .= '<button class="btn-edit-classification inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" 
                    data-id="' . $classification->id . '"
                    data-plugin="tippy" 
                    data-tippy-content="Edit Klasifikasi">
                    <i class="mgc_edit_line text-base"></i>
                </button>';
            }
            
            if ($canDelete) {
                $actions .= '<button class="btn-delete-classification inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" 
                    data-id="' . $classification->id . '"
                    data-name="' . e($classification->name) . '"
                    data-plugin="tippy" 
                    data-tippy-content="Hapus Klasifikasi">
                    <i class="mgc_delete_2_line text-base"></i>
                </button>';
            }
            
            $actions .= '</div>';

            return [
                'number' => $index + 1,
                'name' => '<span class="font-medium text-gray-900 dark:text-white">' . e($classification->name) . '</span>',
                'purchase_request_items_count' => '<button class="btn-view-pr-items inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                                                    data-classification-id="' . $classification->id . '"
                                                    data-classification-name="' . e($classification->name) . '"
                                                    data-plugin="tippy" 
                                                    data-tippy-content="Klik untuk melihat detail PR">
                                                    <i class="mgc_file_check_line"></i>
                                                    <span class="font-bold">' . $classification->purchase_request_items_count . '</span>
                                                    <span>Items</span>
                                                    <i class="mgc_right_line text-xs"></i>
                                                   </button>',
                'created_at' => '<span class="text-sm text-gray-600 dark:text-gray-400">' . $classification->created_at->format('d M Y') . '</span>',
                'actions' => $actions,
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
        $this->authorize('classifications.create');

        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
            'type' => 'required|in:barang,jasa',
        ]);

        DB::beginTransaction();
        try {
            $existing = Classification::withTrashed()
                ->whereRaw('LOWER(name) = ?', [strtolower($validated['name'])])
                ->first();

            // Reactivate soft-deleted data when user confirms
            if ($request->boolean('reactivate') && $request->filled('reactivate_id')) {
                $toRestore = Classification::withTrashed()->find($request->input('reactivate_id'));

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
                        ->log('Mengaktifkan kembali klasifikasi: ' . $toRestore->name);

                    Cache::forget('classifications.data');
                    DB::commit();
                    return response()->json([
                        'message' => 'Klasifikasi diaktifkan kembali dan diperbarui',
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
                    'message' => 'Nama klasifikasi sudah digunakan.',
                    'errors' => ['name' => ['Nama klasifikasi sudah digunakan.']]
                ], 422);
            }

            $classification = Classification::create($validated);

            activity()
                ->causedBy($request->user())
                ->performedOn($classification)
                ->withProperties(['attributes' => $classification->toArray()])
                ->log('Menambahkan klasifikasi: ' . $classification->name);

            Cache::forget('classifications.data');
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
        $this->authorize('classifications.edit');

        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
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

            Cache::forget('classifications.data');
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
        $this->authorize('classifications.delete');

        $classificationName = $klasifikasi->name;
        $klasifikasi->delete();

        activity()
            ->causedBy(auth()->user())
            ->withProperties(['deleted_classification' => $classificationName])
            ->log('Menghapus klasifikasi: ' . $classificationName);

        Cache::forget('classifications.data');
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

        Cache::forget('classifications.data');
        return response()->json(['message' => 'Klasifikasi berhasil dihapus']);
    }

    /**
     * Tampilkan halaman detail PR berdasarkan klasifikasi.
     */
    public function showPRItems($id)
    {
        $classification = Classification::findOrFail($id);
        
        // Load purchase request items with all related data
        $classification->load([
            'purchaseRequestItems' => function($query) {
                $query->with([
                    'purchaseRequest.location',
                    'classification',
                    'purchaseOrderItems.purchaseOrder.supplier',
                    'purchaseOrderItems.onsites'
                ])->latest();
            }
        ]);

        $prItemsCount = $classification->purchaseRequestItems->count();
        
        // Calculate statistics
        $totalPRAmount = $classification->purchaseRequestItems->sum(function($item) {
            return $item->quantity * $item->unit_price;
        });
        
        $totalPOAmount = 0;
        $totalCostSaving = 0;
        foreach ($classification->purchaseRequestItems as $prItem) {
            foreach ($prItem->purchaseOrderItems as $poItem) {
                $totalPOAmount += $poItem->amount ?? 0;
                $totalCostSaving += $poItem->cost_saving ?? 0;
            }
        }

        return view('menu.config.classification.pr-items', compact(
            'classification',
            'prItemsCount',
            'totalPRAmount',
            'totalPOAmount',
            'totalCostSaving'
        ));
    }

    /**
     * Ambil data PR items untuk tabel (AJAX).
     */
    public function getPRItemsData($id)
    {
        $classification = Classification::findOrFail($id);
        
        $prItems = $classification->purchaseRequestItems()
            ->with([
                'purchaseRequest.location',
                'purchaseRequest.creator',
                'purchaseOrderItems.purchaseOrder.supplier'
            ])
            ->latest()
            ->get();

        $prItemsJson = $prItems->map(function ($prItem, $index) use ($classification) {
            $pr = $prItem->purchaseRequest;
            
            // Get PO Item (ambil yang pertama jika ada multiple PO)
            $poItem = $prItem->purchaseOrderItems->first();
            $po = $poItem ? $poItem->purchaseOrder : null;
            
            // Derive status badge from current_stage
            $stageLabels = \App\Models\Purchase\PurchaseRequestItem::getStageLabels();
            $stageColors = \App\Models\Purchase\PurchaseRequestItem::getStageColors();
            $currentStage = $prItem->current_stage ?? 1;
            $stageLabel = $stageLabels[$currentStage] ?? 'Unknown';
            $stageColor = $stageColors[$currentStage] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
            
            return [
                'number' => $index + 1,
                'po_number' => $po ? '<button class="btn-pr-detail inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer border border-blue-300 dark:border-blue-800" data-pr-id="' . $pr->id . '" data-classification-id="' . $classification->id . '" type="button">' . e($po->po_number) . '</button>' : '<span class="text-sm text-gray-400">Belum ada PO</span>',
                'location' => '<span class="text-sm text-gray-700 dark:text-gray-300">' . e($pr->location->name ?? '-') . '</span>',
                'item_description' => '<span class="block max-w-md text-left text-sm text-gray-900 dark:text-white font-medium">' . e($prItem->item_desc) . '</span>',
                'quantity' => '<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">' . number_format($prItem->quantity, 0, ',', '.') . ' ' . e($prItem->uom) . '</span>',
                'unit_price' => $poItem ? '<span class="text-sm font-semibold text-gray-900 dark:text-white">Rp ' . number_format($poItem->unit_price ?? 0, 0, ',', '.') . '</span>' : '<span class="text-sm text-gray-400">-</span>',
                'amount' => $poItem ? '<span class="text-sm font-bold text-primary">Rp ' . number_format($poItem->amount ?? 0, 0, ',', '.') . '</span>' : '<span class="text-sm text-gray-400">-</span>',
                'status' => '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ' . $stageColor . '"><i class="mgc_box_3_line"></i>' . $stageLabel . '</span>',
                'created_by' => '<span class="text-sm text-gray-700 dark:text-gray-300">' . e($pr->creator->name ?? $pr->requester ?? '-') . '</span>',
            ];
        });

        return response()->json($prItemsJson);
    }

    /**
     * Detail PR lengkap dari PR hingga Payment untuk modal.
     */
    public function getPRDetail($classificationId, $prId)
    {
        $classification = Classification::findOrFail($classificationId);

        $purchaseRequest = PurchaseRequest::with([
            'location',
            'creator',
            'items.classification',
            'items.purchaseOrderItems.purchaseOrder.supplier',
            'items.purchaseOrderItems.onsites.invoice.payments',
        ])->findOrFail($prId);

        $itemsCollection = collect($purchaseRequest->items);

        // Pastikan PR memiliki item dengan klasifikasi yang diminta
        $hasClassification = $itemsCollection->contains(function ($item) use ($classificationId) {
            return (int) $item->classification_id === (int) $classificationId;
        });

        if (!$hasClassification) {
            return response()->json(['message' => 'PR tidak memiliki item dengan klasifikasi ini'], 404);
        }

        $items = $itemsCollection->map(function ($item) {
            $poItem = $item->purchaseOrderItems->first();
            $po = $poItem ? $poItem->purchaseOrder : null;
            $onsite = $poItem ? $poItem->onsites->first() : null;
            $invoice = $onsite ? $onsite->invoice : null;
            $payment = $invoice ? $invoice->payments->first() : null;

            return [
                'item_desc' => $item->item_desc,
                'classification' => $item->classification->name ?? '-',
                'uom' => $item->uom,
                'quantity' => $item->quantity,
                'pr_unit_price' => $item->unit_price,
                'pr_amount' => $item->amount ?? ($item->quantity * $item->unit_price),
                'stage_label' => $item->stage_label,
                'stage_color' => $item->stage_color,

                // PO data
                'po_number' => $po->po_number ?? '-',
                'po_supplier' => $po && $po->supplier ? $po->supplier->name : '-',
                'po_unit_price' => $poItem->unit_price ?? null,
                'po_quantity' => $poItem->quantity ?? null,
                'po_amount' => $poItem->amount ?? null,
                'cost_saving' => $poItem->cost_saving ?? null,
                'sla_pr_to_po_target' => $item->sla_pr_to_po_target ?? null,
                'sla_pr_to_po_realization' => $poItem->sla_pr_to_po_realization ?? null,

                // Onsite data
                'onsite_date' => $onsite?->onsite_date ? $onsite->onsite_date->format('d-M-Y') : null,
                'sla_po_to_onsite_target' => $poItem?->sla_po_to_onsite_target,
                'sla_po_to_onsite_realization' => $onsite?->sla_po_to_onsite_realization,

                // Invoice data
                'invoice_number' => $invoice?->invoice_number,
                'invoice_received_at' => $invoice?->invoice_received_at ? $invoice->invoice_received_at->format('d-M-Y') : null,
                'invoice_submitted_at' => $invoice?->invoice_submitted_at ? $invoice->invoice_submitted_at->format('d-M-Y') : null,
                'sla_invoice_to_finance_target' => $invoice?->sla_invoice_to_finance_target,
                'sla_invoice_to_finance_realization' => $invoice?->sla_invoice_to_finance_realization,

                // Payment data
                'payment_number' => $payment?->payment_number,
                'payment_date' => $payment?->payment_date ? $payment->payment_date->format('d-M-Y') : null,
                'sla_payment_target' => $invoice?->sla_payment_target,
                'sla_payment_realization' => $payment?->sla_payment,
            ];
        });

        $payload = [
            'pr' => [
                'id' => $purchaseRequest->id,
                'number' => $purchaseRequest->pr_number,
                'request_type' => $purchaseRequest->request_type,
                'location' => $purchaseRequest->location->name ?? '-',
                'approved_date' => $purchaseRequest->approved_date?->format('d-M-Y'),
                'notes' => $purchaseRequest->notes,
                'created_by' => $purchaseRequest->creator->name ?? '-',
            ],
            'items' => $items,
            'classification' => [
                'id' => $classification->id,
                'name' => $classification->name,
            ],
        ];

        return response()->json($payload);
    }
}
