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
            'recentInvoices' => (clone $submittedQuery)->where('invoice_submitted_at', '>=', now()->subDays(30))->count(),
        ];

        return view('menu.invoice.pengajuan.index', $stats);
    }

    public function getData(Request $request)
    {
        $locationId = $request->user()?->location_id;

        $invoices = Invoice::with([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location',
            'creator'
        ])
        ->whereNotNull('invoice_received_at')
        ->whereNull('invoice_submitted_at')
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
                'sla_target' => $invoice->sla_invoice_to_finance_target ?? '-',
                'sla_realization' => $invoice->sla_invoice_to_finance_realization ?? '-',
                'created_by' => $invoice->creator->name ?? '-',
                'location' => $pr?->location->location_name ?? '-',
            ];
        });

        return response()->json($data);
    }

    public function search(string $keyword)
    {
        $query = Invoice::where('invoice_number', 'like', "%{$keyword}%")
            ->whereNull('invoice_submitted_at')
            ->whereNotNull('invoice_received_at');

        $this->applyLocationScope($query, request()->user()?->location_id);

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'invoice_submitted_at' => 'required|date',
        ]);

        DB::beginTransaction();
        try {
            $locationId = $request->user()?->location_id;
            
            // Get invoice with location validation
            $query = Invoice::where('id', $validated['invoice_id']);
            $this->applyLocationScope($query, $locationId);
            $invoice = $query->firstOrFail();
            $submittedDate = Carbon::parse($validated['invoice_submitted_at']);
            $invoice->update([
                'invoice_submitted_at' => $submittedDate,
                'sla_invoice_to_finance_realization' => $this->calculateSlaRealization($invoice->invoice_received_at, $submittedDate),
            ]);

            // Update PR Item stage to 5 (Invoice Submitted)
            $invoice->load('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem');
            $prItem = $invoice->purchaseOrderOnsite?->purchaseOrderItem?->purchaseRequestItem;
            if ($prItem) {
                $prItem->update(['current_stage' => 5]);
            }

            DB::commit();
            return response()->json(['message' => 'Pengajuan invoice berhasil dicatat', 'data' => $invoice]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mencatat pengajuan', 'error' => $e->getMessage()], 500);
        }
    }

    public function edit(Invoice $pengajuan)
    {
        return response()->json($pengajuan);
    }

    public function update(Request $request, Invoice $pengajuan)
    {
        $validated = $request->validate([
            'invoice_submitted_at' => 'required|date',
        ]);

        // Validate location ownership
        $locationId = $request->user()?->location_id;
        if ($locationId) {
            $query = Invoice::where('id', $pengajuan->id);
            $this->applyLocationScope($query, $locationId);
            if (!$query->exists()) {
                return response()->json(['message' => 'Invoice tidak ditemukan atau tidak memiliki akses'], 403);
            }
        }

        $submittedDate = Carbon::parse($validated['invoice_submitted_at']);
        $pengajuan->update([
            'invoice_submitted_at' => $submittedDate,
            'sla_invoice_to_finance_realization' => $this->calculateSlaRealization($pengajuan->invoice_received_at, $submittedDate),
        ]);
        return response()->json(['message' => 'Data pengajuan diperbarui', 'data' => $pengajuan]);
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

        // Apply location filter
        $locationId = $request->user()?->location_id;
        $query = Invoice::whereIn('id', $ids);
        $this->applyLocationScope($query, $locationId);
        $query->delete();
        return response()->json(['message' => 'Data pengajuan dihapus']);
    }

    public function history(Request $request)
    {
        $locationId = $request->user()?->location_id;

        $submittedQuery = Invoice::whereNotNull('invoice_submitted_at');
        $this->applyLocationScope($submittedQuery, $locationId);

        $stats = [
            'submittedInvoices' => (clone $submittedQuery)->count(),
        ];

        return view('menu.invoice.pengajuan.history', $stats);
    }

    public function getHistoryData(Request $request)
    {
        $locationId = $request->user()?->location_id;

        $invoices = Invoice::with([
            'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location',
            'creator'
        ])
        ->whereNotNull('invoice_submitted_at')
        ->where('invoice_submitted_at', '>=', now()->subDays(30))
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
                'redirect' => route('pengajuan.history'),
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
