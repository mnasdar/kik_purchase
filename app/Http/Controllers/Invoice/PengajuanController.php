<?php

namespace App\Http\Controllers\Invoice;

use App\Http\Controllers\Controller;
use App\Models\Invoice\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Mengelola pengajuan invoice ke finance.
 */
class PengajuanController extends Controller
{
    public function index(Request $request)
    {
        $locationId = $request->user()?->location_id;

        $pendingQuery = Invoice::whereNotNull('invoice_received_at')
            ->whereNull('invoice_submitted_at');
        $this->applyLocationScope($pendingQuery, $locationId);

        $submittedQuery = Invoice::whereNotNull('invoice_submitted_at');
        $this->applyLocationScope($submittedQuery, $locationId);

        $totalQuery = Invoice::query();
        $this->applyLocationScope($totalQuery, $locationId);

        $stats = [
            'totalInvoices' => (clone $totalQuery)->count(),
            'pendingInvoices' => (clone $pendingQuery)->count(),
            'submittedInvoices' => (clone $submittedQuery)->count(),
            'recentInvoices' => (clone $submittedQuery)->where('created_at', '>=', now()->subDays(30))->count(),
        ];

        return view('menu.invoice.pengajuan.index', $stats);
    }

    public function create(Request $request)
    {
        return view('menu.invoice.pengajuan.create');
    }

    public function getInvoices(Request $request)
    {
        $locationId = $request->user()?->location_id;

        $invoices = Invoice::with([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location',
        ])
        ->whereNotNull('invoice_received_at')
        ->whereNull('invoice_submitted_at')
        ->latest();

        $this->applyLocationScope($invoices, $locationId);

        $data = $invoices->get()->map(function ($invoice) {
            $onsite = $invoice->purchaseOrderOnsite;
            $item = $onsite->purchaseOrderItem ?? null;
            $po = $item->purchaseOrder ?? null;
            $prItem = $item->purchaseRequestItem ?? null;
            $pr = $prItem?->purchaseRequest;

            $unitPrice = $item->unit_price ?? 0;
            $qty = $item->quantity ?? 0;

            return [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number ?? '-',
                'item_description' => $prItem->item_desc ?? '-',
                'unit_price' => $unitPrice,
                'qty' => $qty,
                'invoice_received_at' => $invoice->invoice_received_at ? $invoice->invoice_received_at->toDateString() : null,
                'sla_target' => $invoice->sla_invoice_to_finance_target ?? 5,
                'purchase_order' => [
                    'po_number' => $po->po_number ?? '-',
                    'purchase_request' => [
                        'pr_number' => $pr->pr_number ?? '-',
                    ],
                ],
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function getData(Request $request)
    {
        // Tampilkan data yang sudah diajukan namun belum dilakukan pembayaran
        $locationId = $request->user()?->location_id;

        $invoices = Invoice::with([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location',
            'creator'
        ])
        ->whereNotNull('invoice_submitted_at')
        ->doesntHave('payments')
        ->latest();

        $this->applyLocationScope($invoices, $locationId);

        $data = $invoices->get()->map(function ($invoice, $index) {
            $onsite = $invoice->purchaseOrderOnsite;
            $item = $onsite->purchaseOrderItem ?? null;
            $po = $item->purchaseOrder ?? null;
            $prItem = $item->purchaseRequestItem ?? null;
            $pr = $prItem?->purchaseRequest;

            $unitPrice = $item->unit_price ?? 0;
            $qty = $item->quantity ?? 0;
            $amount = $unitPrice * $qty;

            return [
                'id' => $invoice->id,
                'number' => $index + 1,
                'invoice_number' => $invoice->invoice_number ?? '-',
                'po_number' => $po->po_number ?? '-',
                'pr_number' => $pr->pr_number ?? '-',
                'item_desc' => $prItem->item_desc ?? '-',
                'unit_price' => number_format($unitPrice, 0, ',', '.'),
                'qty' => $qty,
                'amount' => number_format($amount, 0, ',', '.'),
                'onsite_date' => $onsite?->onsite_date ? $onsite->onsite_date->format('d-M-y') : '-',
                'invoice_received_at' => $invoice->invoice_received_at ? $invoice->invoice_received_at->format('d-M-y') : '-',
                'invoice_submitted_at' => $invoice->invoice_submitted_at ? $invoice->invoice_submitted_at->format('d-M-y') : '-',
                'sla_target' => $invoice->sla_invoice_to_finance_target ?? '-',
                'sla_realization' => $invoice->sla_invoice_to_finance_realization ?? '-',
                'created_by' => $invoice->creator->name ?? '-',
                'location' => $pr?->location->location_name ?? '-',
            ];
        });

        return response()->json($data);
    }

    /**
     * Detail invoice untuk modal pada daftar pengajuan.
     */
    public function show(Invoice $pengajuan)
    {
        $pengajuan->load([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder.supplier',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.classification',
            'creator'
        ]);

        $onsite = $pengajuan->purchaseOrderOnsite;
        $item = $onsite?->purchaseOrderItem;
        $po = $item?->purchaseOrder;
        $pri = $item?->purchaseRequestItem;
        $pr = $pri?->purchaseRequest;

        $slaPrToPoPercentage = null;
        if ($pri && $pri->sla_pr_to_po_target && $item && $item->sla_pr_to_po_realization) {
            $slaPrToPoPercentage = $item->sla_pr_to_po_realization <= $pri->sla_pr_to_po_target ? 100 : 0;
        }

        $slaPoToOnsitePercentage = null;
        if ($item && $item->sla_po_to_onsite_target && $onsite && $onsite->sla_po_to_onsite_realization) {
            $slaPoToOnsitePercentage = $onsite->sla_po_to_onsite_realization <= $item->sla_po_to_onsite_target ? 100 : 0;
        }

        return response()->json([
            'id' => $pengajuan->id,
            // PR Data
            'pr_number' => $pr?->pr_number ?? '-',
            'pr_location' => $pr && $pr->location ? ($pr->location->location_name ?? $pr->location->name ?? '-') : '-',
            'pr_approved_date' => $pr && $pr->approved_date ? Carbon::parse($pr->approved_date)->format('d-M-Y') : '-',
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
            'po_approved_date' => $po && $po->approved_date ? Carbon::parse($po->approved_date)->format('d-M-Y') : '-',
            // PO Item Data
            'po_quantity' => number_format($item?->quantity ?? 0, 0, ',', '.'),
            'po_unit_price' => number_format($item?->unit_price ?? 0, 0, ',', '.'),
            'po_amount' => number_format($item?->amount ?? 0, 0, ',' , '.'),
            'cost_saving' => $item && $item->cost_saving ? number_format($item->cost_saving, 0, ',', '.') : '-',
            'sla_po_to_onsite_target' => $item && $item->sla_po_to_onsite_target ? $item->sla_po_to_onsite_target . ' hari' : '-',
            'sla_po_to_onsite_realization' => $onsite && $onsite->sla_po_to_onsite_realization ? $onsite->sla_po_to_onsite_realization . ' hari' : '-',
            'sla_po_to_onsite_percentage' => $slaPoToOnsitePercentage !== null ? $slaPoToOnsitePercentage . '%' : '-',
            // Onsite Data
            'onsite_date' => $onsite && $onsite->onsite_date ? $onsite->onsite_date->format('d-M-Y') : '-',
            // Invoice Data
            'invoice_number' => $pengajuan->invoice_number ?? '-',
            'invoice_received_at' => $pengajuan->invoice_received_at ? $pengajuan->invoice_received_at->format('d-M-Y') : '-',
            'invoice_submitted_at' => $pengajuan->invoice_submitted_at ? $pengajuan->invoice_submitted_at->format('d-M-Y') : '-',
            'sla_invoice_to_finance_target' => $pengajuan->sla_invoice_to_finance_target ?? '-',
            'sla_invoice_to_finance_realization' => $pengajuan->sla_invoice_to_finance_realization ?? '-',
            // Metadata
            'created_by' => $pengajuan->creator->name ?? '-',
            'created_at' => $pengajuan->created_at ? $pengajuan->created_at->format('d-M-Y H:i') : '-',
        ]);
    }

    public function bulkSubmit(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:invoices,id',
            'invoice_submitted_at' => 'required|date',
        ]);

        DB::beginTransaction();
        try {
            $submittedDate = Carbon::parse($validated['invoice_submitted_at']);
            
            // Get invoices with location filter
            $locationId = $request->user()?->location_id;
            $query = Invoice::whereIn('id', $validated['ids']);
            $this->applyLocationScope($query, $locationId);
            $invoices = $query->get();

            foreach ($invoices as $invoice) {
                $invoice->update([
                    'invoice_submitted_at' => $submittedDate,
                    'sla_invoice_to_finance_realization' => $this->calculateSlaRealization($invoice->invoice_received_at, $submittedDate),
                ]);

                // Update PR Item stage to 5 (Invoice Submitted)
                $invoice->load('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest');
                $prItem = $invoice->purchaseOrderOnsite?->purchaseOrderItem?->purchaseRequestItem;
                if ($prItem) {
                    $prItem->update(['current_stage' => 5]);
                    
                    // Update PR stage to 5 (Invoice Submitted)
                    if ($prItem->purchaseRequest) {
                        $prItem->purchaseRequest->update(['current_stage' => 5]);
                    }
                }
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => count($invoices) . ' invoice berhasil diajukan ke finance',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengajukan invoice: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim'], 400);
        }

        DB::beginTransaction();
        try {
            // Apply location filter
            $locationId = $request->user()?->location_id;
            $query = Invoice::whereIn('id', $ids);
            $this->applyLocationScope($query, $locationId);
            $invoices = $query->get();

            foreach ($invoices as $invoice) {
                // Reset tanggal pengajuan dan SLA realisasi
                $invoice->update([
                    'invoice_submitted_at' => null,
                    'sla_invoice_to_finance_realization' => null,
                ]);

                // Update PR Item stage kembali ke 4 (Invoice Received)
                $invoice->load('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest');
                $prItem = $invoice->purchaseOrderOnsite?->purchaseOrderItem?->purchaseRequestItem;
                if ($prItem) {
                    $prItem->update(['current_stage' => 4]);
                    
                    // Update PR stage kembali ke 4 (Invoice Received)
                    if ($prItem->purchaseRequest) {
                        $prItem->purchaseRequest->update(['current_stage' => 4]);
                    }
                }
            }

            DB::commit();
            return response()->json(['message' => count($invoices) . ' pengajuan berhasil dibatalkan']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membatalkan pengajuan: ' . $e->getMessage()], 500);
        }
    }

    // Removed history and history data methods as part of cleanup

    public function bulkEditForm(Request $request)
    {
        $ids = explode(',', $request->query('ids'));
        $ids = array_filter($ids);

        if (empty($ids)) {
            return redirect()->route('pengajuan.history')->with('error', 'Tidak ada invoice yang dipilih');
        }

        $locationId = $request->user()?->location_id;
        $invoices = Invoice::with([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location',
        ])
        ->whereIn('id', $ids)
        ->whereNotNull('invoice_submitted_at');

        $this->applyLocationScope($invoices, $locationId);
        $invoices = $invoices->get();

        if ($invoices->isEmpty()) {
            return redirect()->route('pengajuan.history')->with('error', 'Invoice tidak ditemukan');
        }

        return view('menu.invoice.pengajuan.bulk-edit', [
            'invoices' => $invoices,
            'ids' => $ids,
        ]);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:invoices,id',
            'invoice_data' => 'required|array',
        ]);

        DB::beginTransaction();
        try {
            // Get invoices with location filter
            $locationId = $request->user()?->location_id;
            $query = Invoice::whereIn('id', $validated['ids']);
            $this->applyLocationScope($query, $locationId);
            $invoices = $query->get();

            foreach ($invoices as $invoice) {
                $data = $validated['invoice_data'][$invoice->id] ?? [];

                $updateData = [];

                if (!empty($data['invoice_submitted_at'])) {
                    $updateData['invoice_submitted_at'] = Carbon::parse($data['invoice_submitted_at']);
                }

                if (!empty($data['sla_target'])) {
                    $updateData['sla_invoice_to_finance_target'] = (int) $data['sla_target'];
                }

                // Recalculate SLA realization if submitted date changed
                if (!empty($updateData['invoice_submitted_at'])) {
                    $updateData['sla_invoice_to_finance_realization'] = $this->calculateSlaRealization(
                        $invoice->invoice_received_at,
                        $updateData['invoice_submitted_at']
                    );
                }

                if (!empty($updateData)) {
                    $invoice->update($updateData);
                }
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => count($validated['ids']) . ' invoice berhasil diupdate',
                'redirect' => route('pengajuan.index'),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate invoice: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function applyLocationScope($query, $locationId = null)
    {
        if (!$locationId) {
            return $query;
        }

        return $query->whereHas('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($locationId) {
            $q->where('location_id', $locationId);
        });
    }

    private function calculateSlaRealization($receivedAt, Carbon $submittedDate = null)
    {
        if (!$receivedAt || !$submittedDate) {
            return null;
        }

        $start = Carbon::parse($receivedAt);
        $end = $submittedDate;
        
        // Calculate business days only (Monday to Friday)
        $businessDays = 0;
        $current = $start->copy();
        
        while ($current->lte($end)) {
            // Check if it's a weekday (Monday = 1, Friday = 5)
            if ($current->isWeekday()) {
                $businessDays++;
            }
            $current->addDay();
        }
        
        // Subtract 1 because we don't count the start date
        return max(0, $businessDays - 1);
    }
}
