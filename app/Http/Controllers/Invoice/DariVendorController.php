<?php

namespace App\Http\Controllers\Invoice;

use Illuminate\Http\Request;
use App\Models\Invoice\Invoice;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Purchase\PurchaseOrderOnsite;
use App\Models\Purchase\PurchaseRequestItem;

/**
 * Mencatat invoice yang diterima dari vendor.
 */
class DariVendorController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        $query = Invoice::query();
        
        // Filter by user's location_id
        if ($user && $user->location_id) {
            $query->whereHas('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($user) {
                $q->where('location_id', $user->location_id);
            });
        }
        
        $totalInvoices = (clone $query)->count();
        $totalReceivedItems = (clone $query)->whereNotNull('invoice_received_at')->count();
        $totalUnsubmittedItems = (clone $query)->whereNull('invoice_submitted_at')->count();
        $recentInvoices = (clone $query)->where('created_at', '>=', now()->subDays(30))->count();

        return view('menu.invoice.dari-vendor.index', compact('totalInvoices', 'totalReceivedItems', 'totalUnsubmittedItems', 'recentInvoices'));
    }

    public function getData()
    {
        $query = Invoice::with([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'creator'
        ])->whereNull('invoice_submitted_at');

        // Filter by user's location_id
        $user = auth()->user();
        if ($user && $user->location_id) {
            $query->whereHas('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($user) {
                $q->where('location_id', $user->location_id);
            });
        }

        $invoices = $query->latest()->get();

        $data = $invoices->map(function ($invoice, $index) {
            $onsite = $invoice->purchaseOrderOnsite;
            $item = $onsite->purchaseOrderItem ?? null;
            $po = $item->purchaseOrder ?? null;
            $pr = $item->purchaseRequestItem->purchaseRequest ?? null;
            $pritem = $item->purchaseRequestItem ?? null;
            
            $unitPrice = $item->unit_price ?? 0;
            $qty = $item->quantity ?? 0;
            $amount = $unitPrice * $qty;
            
            $maxStage = (int) ($pr->items->max('current_stage') ?? 1);
        $labels = PurchaseRequestItem::getStageLabels();
        $colors = PurchaseRequestItem::getStageColors();
        $stageLabel = $labels[$maxStage] ?? 'Unknown';
        $stageColor = $colors[$maxStage] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        $stageBadge = '<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ' . $stageColor . '"><i class="mgc_box_3_line"></i>' . $stageLabel . '</span>';

            return [
                'id' => $invoice->id,
                'number' => $index + 1,
                'invoice_number' => $invoice->invoice_number ?? '-',
                'po_number' => $po->po_number ?? '-',
                'item_desc' => $pritem->item_desc ?? '-',
                'unit_price' => number_format($unitPrice, 0, ',', '.'),
                'qty' => $qty,
                'amount' => number_format($amount, 0, ',', '.'),
                'onsite_date' => $onsite->onsite_date ? $onsite->onsite_date->format('d-M-y') : '-',
                'invoice_received_at' => $invoice->invoice_received_at ? $invoice->invoice_received_at->format('d-M-y') : '-',
                'sla_invoice_to_finance_target' => $invoice->sla_invoice_to_finance_target ?? '-',
                'current_stage' => $stageBadge,
                'created_by' => $invoice->creator->name ?? '-',
            ];
        });

        return response()->json($data);
    }

    private function getStageLabel($stage)
    {
        $stages = [
            1 => 'PR Created',
            2 => 'PO Created',
            3 => 'PO Onsite',
            4 => 'Invoice Received',
            5 => 'Payment Done'
        ];
        return $stages[$stage] ?? 'Unknown';
    }

    public function search(string $keyword)
    {
        $user = auth()->user();
        
        $query = PurchaseOrderOnsite::with([
            'purchaseOrderItem.purchaseOrder',
            'purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'purchaseOrderItem.supplier'
        ])
        ->whereDoesntHave('invoice')
        ->whereHas('purchaseOrderItem.purchaseOrder', function ($query) use ($keyword) {
            $query->where('po_number', 'like', "%{$keyword}%");
        });

        // Filter by user's location_id
        if ($user && $user->location_id) {
            $query->whereHas('purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($user) {
                $q->where('location_id', $user->location_id);
            });
        }

        $onsites = $query->get();

        $data = $onsites->map(function ($onsite) {
            $item = $onsite->purchaseOrderItem;
            $po = $item->purchaseOrder ?? null;
            $pr = $item->purchaseRequestItem->purchaseRequest ?? null;
            $supplier = $item->supplier ?? null;

            return [
                'id' => $onsite->id,
                'po_number' => $po->po_number ?? '-',
                'pr_number' => $pr->pr_number ?? '-',
                'supplier_name' => $supplier->supplier_name ?? '-',
                'item_desc' => $item->item_desc ?? '-',
                'onsite_date' => $onsite->onsite_date ? $onsite->onsite_date->format('d-M-y') : '-',
            ];
        });

        return response()->json($data);
    }

    public function create()
    {
        return view('menu.invoice.dari-vendor.create');
    }

    public function getOnsitesData(Request $request)
    {
        $user = auth()->user();
        
        // Get all PO Onsites that don't have invoice received yet
        $query = PurchaseOrderOnsite::with([
            'purchaseOrderItem.purchaseOrder',
            'purchaseOrderItem.purchaseOrder.supplier',
            'purchaseOrderItem.purchaseRequestItem.purchaseRequest'
        ])
        ->whereDoesntHave('invoice', function ($query) {
            $query->whereNotNull('invoice_received_at');
        });

        // Filter by user's location_id
        if ($user && $user->location_id) {
            $query->whereHas('purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($user) {
                $q->where('location_id', $user->location_id);
            });
        }

        $onsites = $query->latest()->get();

        $data = $onsites->map(function ($onsite, $index) {
            $item = $onsite->purchaseOrderItem;
            $po = $item->purchaseOrder ?? null;
            $supplier = $po->supplier ?? null;
            $pr = $item->purchaseRequestItem->purchaseRequest ?? null;
            $pritem = $item->purchaseRequestItem ?? null;

            return [
                'id' => $onsite->id,
                'number' => $index + 1,
                'po_number' => $po->po_number ?? '-',
                'pr_number' => $pr->pr_number ?? '-',
                'supplier' => $supplier->name ?? '-',
                'item_desc' => $pritem->item_desc ?? '-',
                'unit_price' => number_format($item->unit_price ?? 0, 0, ',', '.'),
                'quantity' => number_format($item->quantity ?? 0, 0, ',', '.'),
                'amount' => number_format($item->amount ?? 0, 0, ',', '.'),
                'onsite_date' => $onsite->onsite_date ? $onsite->onsite_date->format('d-M-y') : '-',
                'checkbox' => '<input type="checkbox" class="form-checkbox row-checkbox" data-onsite-id="' . $onsite->id . '" data-po-number="' . ($po->po_number ?? '-') . '" data-pr-number="' . ($pr->pr_number ?? '-') . '" data-supplier="' . ($supplier->name ?? '-') . '" data-item-desc="' . ($pritem->item_desc ?? '-') . '" data-unit-price="' . ($item->unit_price ?? 0) . '" data-quantity="' . ($item->quantity ?? 0) . '" data-amount="' . ($item->amount ?? 0) . '" data-onsite-date="' . ($onsite->onsite_date ? $onsite->onsite_date->format('d-M-y') : '') . '">',
            ];
        });

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_onsite_id' => 'required|exists:purchase_order_onsites,id',
            'invoice_number' => 'nullable|string|max:100',
            'invoice_received_at' => 'required|date',
            'sla_invoice_to_finance_target' => 'required|integer|min:1',
        ]);

        // Check if invoice already exists for this onsite
        $exists = Invoice::where('purchase_order_onsite_id', $validated['purchase_order_onsite_id'])->exists();
        if ($exists) {
            return response()->json([
                'message' => 'Invoice untuk PO Onsite ini sudah ada'
            ], 422);
        }

        $data = array_merge($validated, [
            'created_by' => $request->user()?->id ?? auth()->id(),
        ]);

        DB::beginTransaction();
        try {
            $invoice = Invoice::create($data);

            // Update PR Item stage to 4 (Invoice Received)
            $onsite = PurchaseOrderOnsite::with('purchaseOrderItem.purchaseRequestItem')
                ->find($validated['purchase_order_onsite_id']);
            if ($onsite && $onsite->purchaseOrderItem && $onsite->purchaseOrderItem->purchaseRequestItem) {
                $prItem = $onsite->purchaseOrderItem->purchaseRequestItem;
                $prItem->update(['current_stage' => 4]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Invoice berhasil dicatat',
                'data' => $invoice
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeMultiple(Request $request)
    {
        $validated = $request->validate([
            'invoices' => 'required|array|min:1',
            'invoices.*.onsite_id' => 'required|exists:purchase_order_onsites,id',
            'invoices.*.invoice_number' => 'nullable|string|max:100',
            'invoices.*.received_date' => 'required|date',
            'invoices.*.sla_target' => 'required|integer|min:1',
        ]);

        $userId = $request->user()?->id ?? auth()->id();
        $createdInvoices = [];
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($validated['invoices'] as $invoiceData) {
                // Check if invoice already exists for this onsite
                $exists = Invoice::where('purchase_order_onsite_id', $invoiceData['onsite_id'])->exists();
                if ($exists) {
                    $errors[] = "Invoice untuk PO Onsite ID {$invoiceData['onsite_id']} sudah ada";
                    continue;
                }

                // Create invoice
                $invoice = Invoice::create([
                    'purchase_order_onsite_id' => $invoiceData['onsite_id'],
                    'invoice_number' => $invoiceData['invoice_number'],
                    'invoice_received_at' => $invoiceData['received_date'],
                    'sla_invoice_to_finance_target' => $invoiceData['sla_target'],
                    'created_by' => $userId,
                ]);

                // Update PR Item stage to 4 (Invoice Received)
                $onsite = PurchaseOrderOnsite::with('purchaseOrderItem.purchaseRequestItem')
                    ->find($invoiceData['onsite_id']);
                if ($onsite && $onsite->purchaseOrderItem && $onsite->purchaseOrderItem->purchaseRequestItem) {
                    $prItem = $onsite->purchaseOrderItem->purchaseRequestItem;
                    $prItem->update(['current_stage' => 4]);
                }

                $createdInvoices[] = $invoice;
            }

            if (!empty($errors)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Beberapa invoice gagal dibuat',
                    'errors' => $errors
                ], 422);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => count($createdInvoices) . ' invoice berhasil dicatat',
                'data' => $createdInvoices
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function edit(Invoice $dari_vendor)
    {
        return response()->json($dari_vendor->load('purchaseOrderOnsite'));
    }

    public function update(Request $request, Invoice $dari_vendor)
    {
        $validated = $request->validate([
            'invoice_number' => 'nullable|string|max:100',
            'invoice_received_at' => 'nullable|date',
            'sla_invoice_to_finance_target' => 'nullable|integer',
        ]);

        $dari_vendor->update($validated);
        return response()->json(['message' => 'Invoice berhasil diupdate', 'data' => $dari_vendor]);
    }

    /**
     * Detail invoice: ambil PR & PO dan informasi invoice
     */
    public function show(Invoice $dari_vendor)
    {
        $dari_vendor->load([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder.supplier',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.classification',
            'creator'
        ]);

        $onsite = $dari_vendor->purchaseOrderOnsite;
        $item = $onsite?->purchaseOrderItem;
        $po = $item?->purchaseOrder;
        $pri = $item?->purchaseRequestItem;
        $pr = $pri?->purchaseRequest;

        // Persentase SLA PR->PO (100% jika realisasi <= target, 0% jika > target)
        $slaPrToPoPercentage = null;
        if ($pri && $pri->sla_pr_to_po_target && $item && $item->sla_pr_to_po_realization) {
            $slaPrToPoPercentage = $item->sla_pr_to_po_realization <= $pri->sla_pr_to_po_target ? 100 : 0;
        }

        // Persentase SLA PO->Onsite (jika data onsite tersedia)
        $slaPoToOnsitePercentage = null;
        if ($item && $item->sla_po_to_onsite_target && $onsite && $onsite->sla_po_to_onsite_realization) {
            $slaPoToOnsitePercentage = $onsite->sla_po_to_onsite_realization <= $item->sla_po_to_onsite_target ? 100 : 0;
        }

        return response()->json([
            'id' => $dari_vendor->id,
            // PR Data
            'pr_number' => $pr?->pr_number ?? '-',
            'pr_location' => $pr && $pr->location ? $pr->location->name : '-',
            'pr_approved_date' => $pr && $pr->approved_date ? \Carbon\Carbon::parse($pr->approved_date)->format('d-M-Y') : '-',
            'pr_request_type' => $pr ? ucfirst($pr->request_type) : '-',
            // PR Item Data
            'item_name' => $pri?->item_desc ?? '-',
            'classification' => $pri && $pri->classification ? $pri->classification->name : '-',
            'unit' => $pri?->uom ?? '-',
            'pr_quantity' => $pri ? number_format($pri->quantity ?? 0, 0, ',', '.') : '-',
            'pr_unit_price' => $pri ? number_format($pri->unit_price ?? 0, 0, ',', '.') : '-',
            'pr_amount' => number_format($pri?->amount ?? 0, 0, ',', '.'),
            'sla_pr_to_po_target' => $pri && $pri->sla_pr_to_po_target ? $pri->sla_pr_to_po_target . ' hari' : '-',
            'sla_pr_to_po_realization' => $item && $item->sla_pr_to_po_realization ? $item->sla_pr_to_po_realization . ' hari' : '-',
            'sla_pr_to_po_percentage' => $slaPrToPoPercentage !== null ? $slaPrToPoPercentage . '%' : '-',
            // PO Data
            'po_number' => $po?->po_number ?? '-',
            'supplier_name' => $po && $po->supplier ? $po->supplier->name : '-',
            'po_approved_date' => $po && $po->approved_date ? \Carbon\Carbon::parse($po->approved_date)->format('d-M-Y') : '-',
            // PO Item Data
            'po_quantity' => number_format($item?->quantity ?? 0, 0, ',', '.'),
            'po_unit_price' => number_format($item?->unit_price ?? 0, 0, ',', '.'),
            'po_amount' => number_format($item?->amount ?? 0, 0, ',', '.'),
            'cost_saving' => $item && $item->cost_saving ? number_format($item->cost_saving, 0, ',', '.') : '-',
            'sla_po_to_onsite_target' => $item && $item->sla_po_to_onsite_target ? $item->sla_po_to_onsite_target . ' hari' : '-',
            'sla_po_to_onsite_realization' => $onsite && $onsite->sla_po_to_onsite_realization ? $onsite->sla_po_to_onsite_realization . ' hari' : '-',
            'sla_po_to_onsite_percentage' => $slaPoToOnsitePercentage !== null ? $slaPoToOnsitePercentage . '%' : '-',
            // Onsite Data
            'onsite_date' => $onsite && $onsite->onsite_date ? $onsite->onsite_date->format('d-M-Y') : '-',
            // Invoice Data
            'invoice_number' => $dari_vendor->invoice_number ?? '-',
            'invoice_received_at' => $dari_vendor->invoice_received_at ? $dari_vendor->invoice_received_at->format('d-M-Y') : '-',
            'sla_invoice_to_finance_target' => $dari_vendor->sla_invoice_to_finance_target ?? '-',
            // Metadata
            'created_by' => $dari_vendor->creator?->name ?? '-',
            'created_at' => $dari_vendor->created_at ? $dari_vendor->created_at->format('d-M-Y H:i') : '-',
        ]);
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:invoices,id'
        ]);

        DB::beginTransaction();
        try {
            // Get invoices with their related purchase request items
            $invoices = Invoice::with([
                'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem'
            ])->whereIn('id', $validated['ids'])->get();

            // Update current_stage to 3 for related purchase request items
            foreach ($invoices as $invoice) {
                $onsite = $invoice->purchaseOrderOnsite;
                if ($onsite && $onsite->purchaseOrderItem && $onsite->purchaseOrderItem->purchaseRequestItem) {
                    $onsite->purchaseOrderItem->purchaseRequestItem->update(['current_stage' => 3]);
                }
            }

            // Delete invoices
            Invoice::whereIn('id', $validated['ids'])->delete();

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Invoice berhasil dihapus'
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    public function bulkEdit(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $ids = array_filter($ids);

        if (empty($ids)) {
            return redirect()->route('dari-vendor.index')->with('error', 'Tidak ada data yang dipilih');
        }

        $user = auth()->user();
        
        $query = Invoice::with([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder.supplier',
            'creator'
        ])->whereIn('id', $ids);

        // Filter by user's location_id
        if ($user && $user->location_id) {
            $query->whereHas('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($user) {
                $q->where('location_id', $user->location_id);
            });
        }

        $invoices = $query->get();

        if ($invoices->isEmpty()) {
            return redirect()->route('dari-vendor.index')->with('error', 'Data tidak ditemukan');
        }

        return view('menu.invoice.dari-vendor.bulk-edit', compact('invoices', 'ids'));
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:invoices,id',
            'invoice_data' => 'required|array',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['ids'] as $id) {
                $invoiceData = $validated['invoice_data'][$id] ?? [];
                
                $updateData = [];
                if (isset($invoiceData['invoice_number'])) {
                    $updateData['invoice_number'] = $invoiceData['invoice_number'] ?: null;
                }
                if (isset($invoiceData['invoice_received_at'])) {
                    $updateData['invoice_received_at'] = $invoiceData['invoice_received_at'];
                }
                if (isset($invoiceData['sla_target'])) {
                    $updateData['sla_invoice_to_finance_target'] = (int) $invoiceData['sla_target'];
                }

                if (!empty($updateData)) {
                    Invoice::where('id', $id)->update($updateData);
                }
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => count($validated['ids']) . ' invoice berhasil diupdate',
                'redirect' => route('dari-vendor.index')
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate invoice: ' . $e->getMessage()
            ], 500);
        }
    }
}
