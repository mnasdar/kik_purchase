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
        $totalInvoices = Invoice::count();
        $receivedInvoices = Invoice::whereNotNull('invoice_received_at')->count();
        $submittedInvoices = Invoice::whereNotNull('invoice_submitted_at')->count();
        $recentInvoices = Invoice::where('created_at', '>=', now()->subDays(30))->count();

        return view('menu.invoice.dari-vendor.index', compact('totalInvoices', 'receivedInvoices', 'submittedInvoices', 'recentInvoices'));
    }

    public function getData()
    {
        $invoices = Invoice::with([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'creator'
        ])->latest()->get();

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
                'pr_number' => $pr->pr_number ?? '-',
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
        $onsites = PurchaseOrderOnsite::with([
            'purchaseOrderItem.purchaseOrder',
            'purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'purchaseOrderItem.supplier'
        ])
        ->whereDoesntHave('invoice')
        ->whereHas('purchaseOrderItem.purchaseOrder', function ($query) use ($keyword) {
            $query->where('po_number', 'like', "%{$keyword}%");
        })
        ->get();

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
        // Get all PO Onsites that don't have invoice received yet
        $onsites = PurchaseOrderOnsite::with([
            'purchaseOrderItem.purchaseOrder',
            'purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'purchaseOrderItem.purchaseOrder.supplier'
        ])
        ->whereDoesntHave('invoice', function ($query) {
            $query->whereNotNull('invoice_received_at');
        })
        ->latest()
        ->get();

        return view('menu.invoice.dari-vendor.create', compact('onsites'));
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
                $onsite = PurchaseOrderOnsite::with('purchaseOrderItem.purchaseRequestItem')->find($invoiceData['onsite_id']);
                if ($onsite && $onsite->purchaseOrderItem && $onsite->purchaseOrderItem->purchaseRequestItem) {
                    $onsite->purchaseOrderItem->purchaseRequestItem->update(['current_stage' => 4]);
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

        $invoices = Invoice::with([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder.supplier',
            'creator'
        ])->whereIn('id', $ids)->get();

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
