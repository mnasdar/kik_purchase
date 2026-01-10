<?php

namespace App\Http\Controllers\Invoice;

use App\Http\Controllers\Controller;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PembayaranController extends Controller
{
    /**
     * Display a listing of the payment.
     */
    public function index()
    {
        return view('menu.invoice.pembayaran.index');
    }

    /**
     * Get payment data for datatable
     */
    public function data()
    {
        $user = auth()->user();
        $paymentQuery = Payment::with([
            'invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseOrder.supplier',
            'invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location',
            'invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.classification',
            'creator'
        ]);

        // Filter by user's location_id
        if ($user && $user->location_id) {
            $paymentQuery->whereHas('invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($user) {
                $q->where('location_id', $user->location_id);
            });
        }

        $payments = $paymentQuery->latest()->get();

        // Build stats using the same location scope
        $invoiceQuery = Invoice::whereNotNull('invoice_submitted_at');
        if ($user && $user->location_id) {
            $invoiceQuery->whereHas('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($user) {
                $q->where('location_id', $user->location_id);
            });
        }

        $totalInvoices = (clone $invoiceQuery)->count();
        $paidInvoices = (clone $invoiceQuery)->whereHas('payments')->count();
        $unpaidInvoices = max($totalInvoices - $paidInvoices, 0);

        $now = Carbon::now();
        $thirtyDaysAgo = Carbon::now()->subDays(30)->startOfDay();
        $recentPayments = (clone $paymentQuery)
            ->whereBetween('created_at', [$thirtyDaysAgo->toDateString(), $now->toDateString()])
            ->count();

        $data = $payments->map(function ($payment, $index) {
            $invoice = $payment->invoice;
            $onsite = $invoice->purchaseOrderOnsite ?? null;
            $item = $onsite->purchaseOrderItem ?? null;
            $po = $item->purchaseOrder ?? null;
            $prItem = $item->purchaseRequestItem ?? null;
            $pr = $prItem?->purchaseRequest;
            $supplier = $po->supplier ?? null;
            $location = $pr->location ?? null;
            $classification = $prItem?->classification;

            // PO item pricing
            $unitPrice = $item->unit_price ?? 0;
            $qty = $item->quantity ?? 0;
            $amount = $unitPrice * $qty;

            // PR item pricing
            $prUnitPrice = $prItem->unit_price ?? 0;
            $prQty = $prItem->quantity ?? 0;
            $prAmount = $prItem->amount ?? ($prUnitPrice * $prQty);

            // SLA metrics
            $slaPrToPoTarget = $prItem->sla_pr_to_po_target ?? null;
            $slaPrToPoReal = $item->sla_pr_to_po_realization ?? null;
            $slaPrToPoPct = ($slaPrToPoTarget && $slaPrToPoReal !== null && $slaPrToPoTarget > 0)
                ? (round(($slaPrToPoReal / $slaPrToPoTarget) * 100)) . '%'
                : '-';

            $slaPoToOnsiteTarget = $item->sla_po_to_onsite_target ?? null;
            $slaPoToOnsiteReal = $onsite->sla_po_to_onsite_realization ?? null;
            $slaPoToOnsitePct = ($slaPoToOnsiteTarget && $slaPoToOnsiteReal !== null && $slaPoToOnsiteTarget > 0)
                ? (round(($slaPoToOnsiteReal / $slaPoToOnsiteTarget) * 100)) . '%'
                : '-';

            $slaInvoiceTarget = $invoice->sla_invoice_to_finance_target ?? null;
            $slaInvoiceReal = $invoice->sla_invoice_to_finance_realization ?? null;
            $slaInvoicePct = ($slaInvoiceTarget && $slaInvoiceReal !== null && $slaInvoiceTarget > 0)
                ? (round(($slaInvoiceReal / $slaInvoiceTarget) * 100)) . '%'
                : '-';

            return [
                'id' => $payment->id,
                'number' => $index + 1,
                // PR Section
                'pr_number' => $pr->pr_number ?? '-',
                'pr_request_type' => $pr->request_type ?? '-',
                'pr_location' => $location->name ?? '-',
                'pr_approved_date' => $pr->approved_date ? $pr->approved_date->format('d-M-y') : '-',
                'item_desc' => $prItem->item_desc ?? '-',
                'item_uom' => $prItem->uom ?? '-',
                'classification' => $classification?->name ?? '-',
                'pr_qty' => $prQty ?: '-',
                'pr_unit_price' => $prUnitPrice > 0 ? number_format($prUnitPrice, 0, ',', '.') : '-',
                'pr_amount' => ($prAmount && $prAmount > 0) ? number_format($prAmount, 0, ',', '.') : '-',
                // PO Section
                'po_number' => $po->po_number ?? '-',
                'po_supplier' => $supplier->name ?? '-',
                'po_approved_date' => $po->approved_date ? $po->approved_date->format('d-M-y') : '-',
                'qty' => $qty ?? '-',
                'unit_price' => $unitPrice > 0 ? number_format($unitPrice, 0, ',', '.') : '-',
                'amount' => $amount > 0 ? number_format($amount, 0, ',', '.') : '-',
                'cost_saving' => ($item->cost_saving && $item->cost_saving > 0) ? number_format($item->cost_saving, 0, ',', '.') : '-',
                // SLA PR -> PO
                'sla_pr_to_po_target' => $slaPrToPoTarget ?? '-',
                'sla_pr_to_po_realization' => $slaPrToPoReal ?? '-',
                'sla_pr_to_po_percentage' => $slaPrToPoPct,
                // Onsite Section
                'onsite_date' => $onsite?->onsite_date ? $onsite->onsite_date->format('d-M-y') : '-',
                'sla_po_to_onsite_target' => $slaPoToOnsiteTarget ?? '-',
                'sla_po_to_onsite_realization' => $slaPoToOnsiteReal ?? '-',
                'sla_po_to_onsite_percentage' => $slaPoToOnsitePct,
                // Invoice Section
                'invoice_number' => $invoice->invoice_number ?? '-',
                'invoice_received_at' => $invoice->invoice_received_at ? $invoice->invoice_received_at->format('d-M-y') : '-',
                'invoice_submit' => $invoice->invoice_submitted_at ? $invoice->invoice_submitted_at->format('d-M-y') : '-',
                'sla_invoice_target' => $slaInvoiceTarget ?? '-',
                'sla_invoice_realization' => $slaInvoiceReal ?? '-',
                'sla_invoice_percentage' => $slaInvoicePct,
                // Payment Section
                'payment_number' => $payment->payment_number ?? '-',
                'payment_date' => $payment->payment_date ? $payment->payment_date->format('d-M-y') : '-',
                'sla_payment' => $payment->sla_payment ?? '-',
                'created_by' => $payment->creator->name ?? '-',
                'created_at' => $payment->created_at ? $payment->created_at->format('d-M-y H:i') : '-',
            ];
        });

        return response()->json([
            'data' => $data,
            'stats' => [
                'total' => $totalInvoices,
                'paid' => $paidInvoices,
                'pending' => $unpaidInvoices,
                'recent' => $recentPayments,
            ],
        ]);
    }

    /**
     * Show the form for creating a new payment.
     */
    public function create()
    {
        return view('menu.invoice.pembayaran.create');
    }

    /**
     * Get available invoices for payment
     */
    public function getInvoices()
    {
        $user = auth()->user();
        
        $query = Invoice::whereNotNull('invoice_submitted_at')
            ->doesntHave('payments')
            ->with([
                'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
                'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location'
            ]);

        // Filter by user's location_id
        if ($user && $user->location_id) {
            $query->whereHas('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest', function ($q) use ($user) {
                $q->where('location_id', $user->location_id);
            });
        }

        $invoices = $query->latest()->get();

        $data = $invoices->map(function ($invoice) {
            $onsite = $invoice->purchaseOrderOnsite ?? null;
            $item = $onsite->purchaseOrderItem ?? null;
            $po = $item->purchaseOrder ?? null;
            $prItem = $item->purchaseRequestItem ?? null;
            $pr = $prItem?->purchaseRequest;

            $unitPrice = $item->unit_price ?? 0;
            $qty = $item->quantity ?? 0;
            $amount = $unitPrice * $qty;

            return [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number ?? '-',
                'po_number' => $po->po_number ?? '-',
                'pr_number' => $pr->pr_number ?? '-',
                'item_desc' => $prItem->item_desc ?? '-',
                'location' => $pr?->location->location_name ?? '-',
                'unit_price' => $unitPrice,
                'quantity' => $qty,
                'amount' => $amount,
                'submitted_at' => $invoice->invoice_submitted_at?->format('Y-m-d'),
            ];
        });

        return response()->json($data);
    }

    /**
     * Store a newly created payment in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.invoice_id' => 'required|exists:invoices,id',
            'items.*.payment_number' => 'nullable|string|max:100',
            'items.*.payment_date' => 'required|date',
            'items.*.sla_payment' => 'nullable|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $createdPayments = [];
            $errors = [];

            foreach ($validated['items'] as $index => $item) {
                $invoice = Invoice::find($item['invoice_id']);

                // Cek apakah invoice sudah memiliki payment
                if ($invoice && $invoice->payment) {
                    $errors[] = "Invoice {$invoice->invoice_number} sudah memiliki pembayaran";
                    continue;
                }

                $paymentData = [
                    'invoice_id' => $item['invoice_id'],
                    'payment_number' => $item['payment_number'] ?? null,
                    'payment_date' => $item['payment_date'],
                    'sla_payment' => $item['sla_payment'] ?? null,
                    'created_by' => $request->user()?->id,
                ];

                $payment = Payment::create($paymentData);

                // Update PR Item stage to 7 (Payment Completed)
                $invoice = Invoice::with('purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem')
                    ->find($item['invoice_id']);
                if ($invoice) {
                    $prItem = $invoice->purchaseOrderOnsite?->purchaseOrderItem?->purchaseRequestItem;
                    if ($prItem) {
                        $prItem->update(['current_stage' => 7]);
                    }
                }

                $createdPayments[] = $payment;
            }

            if (empty($createdPayments) && !empty($errors)) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Gagal membuat pembayaran',
                    'errors' => $errors
                ], 422);
            }

            DB::commit();

            $message = count($createdPayments) . ' pembayaran berhasil dicatat';
            if (!empty($errors)) {
                $message .= ' (dengan ' . count($errors) . ' error)';
            }

            return response()->json([
                'message' => $message,
                'data' => $createdPayments,
                'errors' => $errors
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menyimpan pembayaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified payment.
     */
    public function edit(Payment $pembayaran)
    {
        $pembayaran->load([
            'invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest'
        ]);

        return view('menu.invoice.pembayaran.edit', compact('pembayaran'));
    }

    /**
     * Update the specified payment in storage.
     */
    public function update(Request $request, Payment $pembayaran)
    {
        $validated = $request->validate([
            'payment_number' => 'nullable|string|max:100',
            'payment_date' => 'required|date',
            'sla_payment' => 'nullable|integer|min:0',
        ]);

        $pembayaran->update($validated);

        return response()->json([
            'message' => 'Pembayaran berhasil diupdate',
            'data' => $pembayaran
        ]);
    }

    /**
     * Delete single payment dan kembalikan stage ke 5
     */
    public function destroy(Payment $pembayaran)
    {
        DB::beginTransaction();
        try {
            // Get PR Item before delete
            $payment = $pembayaran->load('invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem');
            $prItem = $payment->invoice?->purchaseOrderOnsite?->purchaseOrderItem?->purchaseRequestItem;
            
            // Delete payment
            $pembayaran->delete();

            // Kembalikan current_stage ke 5 (Invoice Submitted)
            if ($prItem) {
                $prItem->update(['current_stage' => 5]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Pembayaran berhasil dihapus'
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete multiple payments.
     */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);

        if (!is_array($ids) || empty($ids)) {
            return response()->json([
                'message' => 'Tidak ada data yang dikirim'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Get affected PR Items before delete
            $payments = Payment::with('invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem')
                ->whereIn('id', $ids)
                ->get();
            
            foreach ($payments as $payment) {
                $prItem = $payment->invoice?->purchaseOrderOnsite?->purchaseOrderItem?->purchaseRequestItem;
                if ($prItem) {
                    // Kembalikan current_stage ke 5 (Invoice Submitted)
                    $prItem->update(['current_stage' => 5]);
                }
            }

            Payment::whereIn('id', $ids)->delete();

            DB::commit();
            return response()->json([
                'message' => count($ids) . ' pembayaran berhasil dihapus'
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}