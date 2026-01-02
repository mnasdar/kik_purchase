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
        $payments = Payment::with([
            'invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
            'invoice.purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location',
            'creator'
        ])->latest()->get();

        $data = $payments->map(function ($payment, $index) {
            $invoice = $payment->invoice;
            $onsite = $invoice->purchaseOrderOnsite ?? null;
            $item = $onsite->purchaseOrderItem ?? null;
            $po = $item->purchaseOrder ?? null;
            $prItem = $item->purchaseRequestItem ?? null;
            $pr = $prItem?->purchaseRequest;

            $unitPrice = $item->unit_price ?? 0;
            $qty = $item->quantity ?? 0;
            $amount = $unitPrice * $qty;

            return [
                'id' => $payment->id,
                'number' => $index + 1,
                'payment_number' => $payment->payment_number ?? '-',
                'invoice_number' => $invoice->invoice_number ?? '-',
                'po_number' => $po->po_number ?? '-',
                'pr_number' => $pr->pr_number ?? '-',
                'item_desc' => $prItem->item_desc ?? '-',
                'unit_price' => $unitPrice > 0 ? number_format($unitPrice, 0, ',', '.') : '-',
                'qty' => $qty ?? '-',
                'amount' => $amount > 0 ? number_format($amount, 0, ',', '.') : '-',
                'invoice_submit' => $invoice->invoice_submitted_at ? $invoice->invoice_submitted_at->format('d-M-y') : '-',
                'payment_date' => $payment->payment_date ? $payment->payment_date->format('d-M-y') : '-',
                'sla_payment' => $payment->sla_payment ?? '-',
                'created_by' => $payment->creator->name ?? '-',
            ];
        });

        return response()->json($data);
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
        $invoices = Invoice::whereNotNull('invoice_submitted_at')
            ->doesntHave('payments')
            ->with([
                'purchaseOrderOnsite.purchaseOrderItem.purchaseOrder',
                'purchaseOrderOnsite.purchaseOrderItem.purchaseRequestItem.purchaseRequest.location'
            ])
            ->latest()
            ->get();

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

        Payment::whereIn('id', $ids)->delete();

        return response()->json([
            'message' => count($ids) . ' pembayaran berhasil dihapus'
        ]);
    }
}