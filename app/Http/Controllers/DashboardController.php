<?php

namespace App\Http\Controllers;

use App\Models\Purchase\PurchaseRequest;
use App\Models\Purchase\PurchaseRequestItem;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseOrderItem;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\Payment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Display dashboard
     */
    public function index()
    {
        return view('menu.dashboard');
    }

    /**
     * Get dashboard data based on date range
     */
    public function getData(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        // Get counts - PR and PO are counted by their items
        $prCount = PurchaseRequestItem::whereBetween('created_at', [$startDate, $endDate])->count();
        $poCount = PurchaseOrderItem::whereBetween('created_at', [$startDate, $endDate])->count();
        $invoiceCount = Invoice::whereBetween('created_at', [$startDate, $endDate])->count();
        $paymentCount = Payment::whereBetween('created_at', [$startDate, $endDate])->count();

        // Calculate progress percentages
        $prToPoPercent = $prCount > 0 ? round(($poCount / $prCount) * 100, 1) : 0;
        $poToInvoicePercent = $poCount > 0 ? round(($invoiceCount / $poCount) * 100, 1) : 0;
        $invoiceToPaymentPercent = $invoiceCount > 0 ? round(($paymentCount / $invoiceCount) * 100, 1) : 0;
        $overallPercent = $prCount > 0 ? round(($paymentCount / $prCount) * 100, 1) : 0;

        // Get recent PR
        $recentPR = PurchaseRequest::with(['location', 'creator'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($pr) {
                return [
                    'id' => $pr->id,
                    'pr_number' => $pr->pr_number,
                    'location' => $pr->location->location_name ?? '-',
                    'status' => $pr->status ?? 'Pending',
                    'created_by' => $pr->creator->name ?? '-',
                    'created_at' => $pr->created_at->format('d M Y'),
                ];
            });

        // Get recent payments
        $recentPayments = Payment::with(['invoice', 'creator'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($payment) {
                $invoice = $payment->invoice;
                return [
                    'id' => $payment->id,
                    'payment_number' => $payment->payment_number ?? '-',
                    'invoice_number' => $invoice->invoice_number ?? '-',
                    'payment_date' => $payment->payment_date ? $payment->payment_date->format('d M Y') : '-',
                    'created_by' => $payment->creator->name ?? '-',
                    'created_at' => $payment->created_at->format('d M Y'),
                ];
            });

        // Chart data (monthly trend if date range > 31 days, else daily)
        $days = $startDate->diffInDays($endDate);
        $chartData = $this->getChartData($startDate, $endDate, $days);

        return response()->json([
            'statistics' => [
                'pr' => $prCount,
                'po' => $poCount,
                'invoice' => $invoiceCount,
                'payment' => $paymentCount,
            ],
            'progress' => [
                'pr_to_po' => [
                    'percent' => $prToPoPercent,
                    'count' => $poCount,
                    'total' => $prCount,
                ],
                'po_to_invoice' => [
                    'percent' => $poToInvoicePercent,
                    'count' => $invoiceCount,
                    'total' => $poCount,
                ],
                'invoice_to_payment' => [
                    'percent' => $invoiceToPaymentPercent,
                    'count' => $paymentCount,
                    'total' => $invoiceCount,
                ],
                'overall' => [
                    'percent' => $overallPercent,
                    'count' => $paymentCount,
                    'total' => $prCount,
                ],
            ],
            'recent_pr' => $recentPR,
            'recent_payments' => $recentPayments,
            'chart' => $chartData,
        ]);
    }

    /**
     * Get chart data for trend visualization
     */
    private function getChartData($startDate, $endDate, $days)
    {
        $categories = [];
        $prData = [];
        $poData = [];
        $invoiceData = [];
        $paymentData = [];

        if ($days > 31) {
            // Monthly grouping
            $start = $startDate->copy();
            while ($start <= $endDate) {
                $monthStart = $start->copy()->startOfMonth();
                $monthEnd = $start->copy()->endOfMonth();
                
                if ($monthEnd > $endDate) {
                    $monthEnd = $endDate->copy();
                }

                $categories[] = $start->format('M Y');
                $prData[] = PurchaseRequestItem::whereBetween('created_at', [$monthStart, $monthEnd])->count();
                $poData[] = PurchaseOrderItem::whereBetween('created_at', [$monthStart, $monthEnd])->count();
                $invoiceData[] = Invoice::whereBetween('created_at', [$monthStart, $monthEnd])->count();
                $paymentData[] = Payment::whereBetween('created_at', [$monthStart, $monthEnd])->count();

                $start->addMonth();
            }
        } else {
            // Daily grouping
            $current = $startDate->copy();
            while ($current <= $endDate) {
                $dayStart = $current->copy()->startOfDay();
                $dayEnd = $current->copy()->endOfDay();

                $categories[] = $current->format('d M');
                $prData[] = PurchaseRequestItem::whereBetween('created_at', [$dayStart, $dayEnd])->count();
                $poData[] = PurchaseOrderItem::whereBetween('created_at', [$dayStart, $dayEnd])->count();
                $invoiceData[] = Invoice::whereBetween('created_at', [$dayStart, $dayEnd])->count();
                $paymentData[] = Payment::whereBetween('created_at', [$dayStart, $dayEnd])->count();

                $current->addDay();
            }
        }

        return [
            'categories' => $categories,
            'series' => [
                [
                    'name' => 'Purchase Request',
                    'data' => $prData,
                ],
                [
                    'name' => 'Purchase Order',
                    'data' => $poData,
                ],
                [
                    'name' => 'Invoice',
                    'data' => $invoiceData,
                ],
                [
                    'name' => 'Payment',
                    'data' => $paymentData,
                ],
            ],
        ];
    }

    /**
     * Get PO Analytics data for the last 12 months
     * Returns: Total Amount, PO Count, Average SLA %
     */
    public function getPoAnalytics()
    {
        $months = [];
        $totalAmounts = [];
        $poCounts = [];
        $slaPercentages = [];

        // Get data for last 12 months
        for ($i = 11; $i >= 0; $i--) {
            $startDate = Carbon::now()->subMonths($i)->startOfMonth();
            $endDate = Carbon::now()->subMonths($i)->endOfMonth();

            // Month label
            $months[] = $startDate->format('M Y');

            // Get PO items in this month through PurchaseOrder relationship
            $poItems = PurchaseOrderItem::whereHas('purchaseOrder', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate]);
            })->with('purchaseRequestItem')->get();

            // Calculate total amount
            $totalAmount = $poItems->sum('amount');
            $totalAmounts[] = round($totalAmount / 1000000, 2); // Convert to millions

            // Count PO items
            $poCounts[] = $poItems->count();

            // Calculate average SLA percentage
            $slaData = [];
            foreach ($poItems as $item) {
                $prItem = $item->purchaseRequestItem;
                if ($prItem && $prItem->sla_pr_to_po_target && $item->sla_pr_to_po_realization !== null) {
                    $target = $prItem->sla_pr_to_po_target;
                    $realization = $item->sla_pr_to_po_realization;
                    
                    // If realization > target, then 0%, else 100%
                    $slaPercent = $realization <= $target ? 100 : 0;
                    $slaData[] = $slaPercent;
                }
            }

            // Average SLA percentage for this month
            $avgSla = count($slaData) > 0 ? round(array_sum($slaData) / count($slaData), 1) : 0;
            $slaPercentages[] = $avgSla;
        }

        return response()->json([
            'categories' => $months,
            'series' => [
                [
                    'name' => 'Total Amount (Juta)',
                    'type' => 'column',
                    'data' => $totalAmounts,
                ],
                [
                    'name' => 'Jumlah PO',
                    'type' => 'line',
                    'data' => $poCounts,
                ],
                [
                    'name' => 'Avg SLA %',
                    'type' => 'line',
                    'data' => $slaPercentages,
                ],
            ],
        ]);
    }
}
