<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\Config\Location;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\Payment;
use Illuminate\Support\Facades\Log;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Purchase\PurchaseOrderItem;
use App\Models\Purchase\PurchaseRequestItem;

class DashboardController extends Controller
{
    /**
     * Display dashboard
     */
    public function index()
    {
        $locations = Location::orderBy('id')->get();
        return view('menu.dashboard', compact('locations'));
    }

    /**
     * Get dashboard data based on date range
     */
    public function getData(Request $request)
    {
        try {
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'date_type' => 'nullable|in:pr,po,invoice,payment',
                'location_id' => 'nullable|exists:locations,id',
            ]);

            $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
            $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();
            $dateType = $request->date_type ?? 'pr';
            
            // Get location_id - dari request atau dari user yang login
            $locationId = $request->location_id;
            if (!$locationId && auth()->user()->location_id) {
                $locationId = auth()->user()->location_id;
            }

            // Get counts based on date type and location
            $prCount = $this->getPRCount($startDate, $endDate, $dateType, $locationId);
            $poCount = $this->getPOCount($startDate, $endDate, $dateType, $locationId);
            $invoiceCount = $this->getInvoiceCount($startDate, $endDate, $dateType, $locationId);
            $paymentCount = $this->getPaymentCount($startDate, $endDate, $dateType, $locationId);

        // Calculate progress percentages
        $prToPoPercent = $prCount > 0 ? round(($poCount / $prCount) * 100, 1) : 0;
        $poToInvoicePercent = $poCount > 0 ? round(($invoiceCount / $poCount) * 100, 1) : 0;
        $invoiceToPaymentPercent = $invoiceCount > 0 ? round(($paymentCount / $invoiceCount) * 100, 1) : 0;
        $overallPercent = $prCount > 0 ? round(($paymentCount / $prCount) * 100, 1) : 0;

        // Get recent PR
        $recentPR = $this->getRecentPR($startDate, $endDate, $dateType, $locationId);

        // Get recent payments
        $recentPayments = $this->getRecentPayments($startDate, $endDate, $dateType, $locationId);

        // Chart data (monthly trend if date range > 31 days, else daily)
        $days = $startDate->diffInDays($endDate);
        $chartData = $this->getChartData($startDate, $endDate, $days, $dateType, $locationId);

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
        } catch (\Exception $e) {
            Log::error('Dashboard getData error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Terjadi kesalahan saat memuat data dashboard',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cost Saving analytics per location with %Cost Saving and average SLA metrics
     */
    public function costSavingAnalytics(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && method_exists($user, 'hasRole') ? $user->hasRole('Super Admin') : false;

        $start = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->subYear()->startOfDay();
        $end = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();
        $locationId = $request->input('location_id');

        $query = PurchaseOrderItem::with([
            'purchaseOrder',
            'purchaseRequestItem.purchaseRequest.location',
            'onsites.invoice',
        ]);

        // Date filter based on PO approved_date; fallback to created_at
        if ($start && $end) {
            $query->whereHas('purchaseOrder', function ($q) use ($start, $end) {
                $q->whereBetween('approved_date', [$start->toDateString(), $end->toDateString()]);
            });
        }

        // Determine if we should show per-location comparison
        $showPerLocation = $isSuperAdmin && !$locationId;

        // Location scoping: Super Admin can filter, others limited to own location
        if ($isSuperAdmin) {
            if ($locationId) {
                $query->whereHas('purchaseRequestItem.purchaseRequest', function ($q) use ($locationId) {
                    $q->where('location_id', $locationId);
                });
            }
        } else {
            if ($user && $user->location_id) {
                $query->whereHas('purchaseRequestItem.purchaseRequest', function ($q) use ($user) {
                    $q->where('location_id', $user->location_id);
                });
            }
        }

        $items = $query->get();

        // Determine grouping granularity: daily (<=31 days) or monthly (>31 days)
        $days = $start->diffInDays($end);
        $groupMonthly = $days > 31;

        // Build bucket sequence for categories
        $categories = [];
        $cursor = $start->copy();
        if ($groupMonthly) {
            $cursor->startOfMonth();
            while ($cursor <= $end) {
                $categories[] = $cursor->format('Y-m');
                $cursor->addMonth()->startOfMonth();
            }
        } else {
            while ($cursor <= $end) {
                $categories[] = $cursor->format('Y-m-d');
                $cursor->addDay();
            }
        }

        // Helper: bucket key for item based on PO approved_date (fallback created_at)
        $getBucketKey = function ($approved) use ($groupMonthly) {
            if (!$approved) return null;
            return $groupMonthly ? $approved->format('Y-m') : $approved->format('Y-m-d');
        };

        if ($showPerLocation) {
            // Per-location comparison mode
            // Group items by location
            $locationGroups = [];
            foreach ($items as $it) {
                $location = optional($it->purchaseRequestItem)->purchaseRequest->location ?? null;
                if (!$location) continue;
                
                $locId = $location->id;
                $locName = $location->name;
                
                if (!isset($locationGroups[$locId])) {
                    $locationGroups[$locId] = [
                        'name' => $locName,
                        'items' => []
                    ];
                }
                $locationGroups[$locId]['items'][] = $it;
            }

            // Build series per location
            $seriesTotal = [];
            $seriesPercent = [];
            $seriesSla = [];

            foreach ($locationGroups as $locId => $locData) {
                $locName = $locData['name'];
                $locItems = $locData['items'];

                // Initialize bucket data for this location
                $bucketData = [];
                foreach ($categories as $cat) {
                    $bucketData[$cat] = [
                        'sumSaving' => 0.0,
                        'sumAmount' => 0.0,
                        'slaValues' => [],
                        'costSavingPercents' => [],
                    ];
                }

                // Aggregate per bucket
                foreach ($locItems as $it) {
                    $approved = optional($it->purchaseOrder)->approved_date ?? optional($it->purchaseOrder)->created_at;
                    if (!$approved) continue;
                    $key = $getBucketKey($approved);
                    if ($key === null || !isset($bucketData[$key])) continue;

                    $bucketData[$key]['sumSaving'] += (float) ($it->cost_saving ?? 0);
                    $bucketData[$key]['sumAmount'] += (float) ($it->amount ?? 0);

                    // Calculate per-item cost saving percentage
                    $itemAmount = (float) ($it->amount ?? 0);
                    $itemSaving = (float) ($it->cost_saving ?? 0);
                    if ($itemAmount > 0) {
                        $bucketData[$key]['costSavingPercents'][] = ($itemSaving / $itemAmount) * 100;
                    }

                    // SLA PR → PO only
                    $realPrPo = $it->sla_pr_to_po_realization;
                    $targetPrPo = optional($it->purchaseRequestItem)->sla_pr_to_po_target;
                    if ($realPrPo !== null && $targetPrPo !== null && $targetPrPo > 0) {
                        $bucketData[$key]['slaValues'][] = ($realPrPo <= $targetPrPo) ? 100 : 0;
                    }
                }

                // Finalize arrays for this location
                $totalCostSaving = [];
                $percentCostSaving = [];
                $avgSlaPercent = [];
                
                foreach ($categories as $cat) {
                    $sumSaving = $bucketData[$cat]['sumSaving'];
                    $sumAmount = $bucketData[$cat]['sumAmount'];
                    $vals = $bucketData[$cat]['slaValues'];
                    $percentVals = $bucketData[$cat]['costSavingPercents'];

                    $totalCostSaving[] = round($sumSaving, 0);
                    $percentCostSaving[] = count($percentVals) > 0 ? round(array_sum($percentVals) / count($percentVals), 2) : 0;
                    $avgSlaPercent[] = count($vals) > 0 ? round(array_sum($vals) / count($vals), 2) : 0;
                }

                $seriesTotal[] = ['name' => $locName, 'type' => 'column', 'data' => $totalCostSaving];
                $seriesPercent[] = ['name' => $locName . ' - % Cost Saving', 'type' => 'line', 'data' => $percentCostSaving];
                $seriesSla[] = ['name' => $locName . ' - % SLA', 'type' => 'line', 'data' => $avgSlaPercent];
            }

            return response()->json([
                'categories' => $categories,
                'seriesTotal' => $seriesTotal,
                'seriesPercent' => $seriesPercent,
                'seriesSla' => $seriesSla,
                'mode' => 'per-location'
            ]);
        } else {
            // Aggregated mode (single location or non-Super Admin)
            $bucketData = [];
            foreach ($categories as $cat) {
                $bucketData[$cat] = [
                    'sumSaving' => 0.0,
                    'sumAmount' => 0.0,
                    'slaValues' => [],
                    'costSavingPercents' => [],
                ];
            }

            foreach ($items as $it) {
                $approved = optional($it->purchaseOrder)->approved_date ?? optional($it->purchaseOrder)->created_at;
                if (!$approved) continue;
                $key = $getBucketKey($approved);
                if ($key === null || !isset($bucketData[$key])) continue;

                $bucketData[$key]['sumSaving'] += (float) ($it->cost_saving ?? 0);
                $bucketData[$key]['sumAmount'] += (float) ($it->amount ?? 0);

                // Calculate per-item cost saving percentage
                $itemAmount = (float) ($it->amount ?? 0);
                $itemSaving = (float) ($it->cost_saving ?? 0);
                if ($itemAmount > 0) {
                    $bucketData[$key]['costSavingPercents'][] = ($itemSaving / $itemAmount) * 100;
                }

                // SLA PR → PO only
                $realPrPo = $it->sla_pr_to_po_realization;
                $targetPrPo = optional($it->purchaseRequestItem)->sla_pr_to_po_target;
                if ($realPrPo !== null && $targetPrPo !== null && $targetPrPo > 0) {
                    $bucketData[$key]['slaValues'][] = ($realPrPo <= $targetPrPo) ? 100 : 0;
                }
            }

            // Finalize per bucket arrays
            $totalCostSaving = array_fill(0, count($categories), 0);
            $percentCostSaving = array_fill(0, count($categories), 0);
            $avgSlaPercent = array_fill(0, count($categories), 0);

            foreach ($categories as $idx => $cat) {
                $sumSaving = $bucketData[$cat]['sumSaving'];
                $sumAmount = $bucketData[$cat]['sumAmount'];
                $vals = $bucketData[$cat]['slaValues'];
                $percentVals = $bucketData[$cat]['costSavingPercents'];

                $totalCostSaving[$idx] = round($sumSaving, 0);
                $percentCostSaving[$idx] = count($percentVals) > 0 ? round(array_sum($percentVals) / count($percentVals), 2) : 0;
                $avgSlaPercent[$idx] = count($vals) > 0 ? round(array_sum($vals) / count($vals), 2) : 0;
            }

            return response()->json([
                'categories' => $categories,
                'series' => [
                    [ 'name' => 'Total Cost Saving', 'type' => 'column', 'data' => $totalCostSaving ],
                    [ 'name' => '% Cost Saving', 'type' => 'line', 'data' => $percentCostSaving ],
                    [ 'name' => 'Avg % SLA', 'type' => 'line', 'data' => $avgSlaPercent ],
                ],
                'mode' => 'aggregated'
            ]);
        }
    }
    /**
     * Get chart data for trend visualization
     */
    private function getChartData($startDate, $endDate, $days, $dateType, $locationId)
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
                $prData[] = $this->getPRCount($monthStart, $monthEnd, $dateType, $locationId);
                $poData[] = $this->getPOCount($monthStart, $monthEnd, $dateType, $locationId);
                $invoiceData[] = $this->getInvoiceCount($monthStart, $monthEnd, $dateType, $locationId);
                $paymentData[] = $this->getPaymentCount($monthStart, $monthEnd, $dateType, $locationId);

                $start->addMonth();
            }
        } else {
            // Daily grouping
            $current = $startDate->copy();
            while ($current <= $endDate) {
                $dayStart = $current->copy()->startOfDay();
                $dayEnd = $current->copy()->endOfDay();

                $categories[] = $current->format('d M');
                $prData[] = $this->getPRCount($dayStart, $dayEnd, $dateType, $locationId);
                $poData[] = $this->getPOCount($dayStart, $dayEnd, $dateType, $locationId);
                $invoiceData[] = $this->getInvoiceCount($dayStart, $dayEnd, $dateType, $locationId);
                $paymentData[] = $this->getPaymentCount($dayStart, $dayEnd, $dateType, $locationId);

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
    public function getPoAnalytics(Request $request)
    {
        $request->validate([
            'location_id' => 'nullable|exists:locations,id',
        ]);

        // Get location_id - dari request atau dari user yang login
        $locationId = $request->location_id;
        if (!$locationId && auth()->user()->location_id) {
            $locationId = auth()->user()->location_id;
        }

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
            $query = PurchaseOrderItem::whereHas('purchaseOrder', function ($query) use ($startDate, $endDate) {
                $query->whereNotNull('approved_date')
                      ->whereBetween('approved_date', [$startDate, $endDate]);
            });

            // Apply location filter
            if ($locationId) {
                $query->whereHas('purchaseRequestItem.purchaseRequest', function ($q) use ($locationId) {
                    $q->where('location_id', $locationId);
                });
            }

            $poItems = $query->with('purchaseRequestItem')->get();

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

    /**
     * Get PR Analytics data (12 months)
     */
    public function getPrAnalytics(Request $request)
    {
        $request->validate([
            'location_id' => 'nullable|exists:locations,id',
        ]);

        // Get location_id - dari request atau dari user yang login
        $locationId = $request->location_id;
        if (!$locationId && auth()->user()->location_id) {
            $locationId = auth()->user()->location_id;
        }

        $months = [];
        $totalAmounts = [];
        $prCounts = [];
        $slaPercentages = [];

        // Get data for last 12 months
        for ($i = 11; $i >= 0; $i--) {
            $startDate = Carbon::now()->subMonths($i)->startOfMonth();
            $endDate = Carbon::now()->subMonths($i)->endOfMonth();

            // Month label
            $months[] = $startDate->format('M Y');

            // Get PR items in this month through PurchaseRequest relationship
            $query = PurchaseRequestItem::whereHas('purchaseRequest', function ($query) use ($startDate, $endDate) {
                $query->whereNotNull('approved_date')
                      ->whereBetween('approved_date', [$startDate, $endDate]);
            });

            // Apply location filter
            if ($locationId) {
                $query->whereHas('purchaseRequest', function ($q) use ($locationId) {
                    $q->where('location_id', $locationId);
                });
            }

            $prItems = $query->get();

            // Calculate total amount
            $totalAmount = $prItems->sum('amount');
            $totalAmounts[] = round($totalAmount / 1000000, 2); // Convert to millions

            // Count PR items
            $prCounts[] = $prItems->count();

            // Calculate average SLA percentage (PR to PO)
            $slaData = [];
            foreach ($prItems as $item) {
                if ($item->sla_pr_to_po_target && $item->sla_pr_to_po_realization !== null) {
                    $target = $item->sla_pr_to_po_target;
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
                    'name' => 'Jumlah PR',
                    'type' => 'line',
                    'data' => $prCounts,
                ],
                [
                    'name' => 'Avg SLA %',
                    'type' => 'line',
                    'data' => $slaPercentages,
                ],
            ],
        ]);
    }

    /**
     * Get PR count based on date type and location
     */
    private function getPRCount($startDate, $endDate, $dateType, $locationId = null)
    {
        $query = PurchaseRequestItem::query();

        // Apply date filter based on date type
        $query->whereHas('purchaseRequest', function ($q) use ($startDate, $endDate) {
            $q->whereNotNull('approved_date')
              ->whereBetween('approved_date', [$startDate, $endDate]);
        });

        // Apply location filter
        if ($locationId) {
            $query->whereHas('purchaseRequest', function ($q) use ($locationId) {
                $q->where('location_id', $locationId);
            });
        }

        return $query->count();
    }

    /**
     * Get PO count based on date type and location
     */
    private function getPOCount($startDate, $endDate, $dateType, $locationId = null)
    {
        $query = PurchaseOrderItem::query();

        // Apply date filter based on date type
        if ($dateType === 'po') {
            $query->whereHas('purchaseOrder', function ($q) use ($startDate, $endDate) {
                $q->whereNotNull('approved_date')
                  ->whereBetween('approved_date', [$startDate, $endDate]);
            });
        } elseif ($dateType === 'pr') {
            // Filter by PR approved_date
            $query->whereHas('purchaseRequestItem', function ($q) use ($startDate, $endDate) {
                $q->whereHas('purchaseRequest', function ($subQ) use ($startDate, $endDate) {
                    $subQ->whereNotNull('approved_date')
                         ->whereBetween('approved_date', [$startDate, $endDate]);
                });
            });
        } else {
            // For invoice/payment, still use PO approved_date
            $query->whereHas('purchaseOrder', function ($q) use ($startDate, $endDate) {
                $q->whereNotNull('approved_date')
                  ->whereBetween('approved_date', [$startDate, $endDate]);
            });
        }

        // Apply location filter
        if ($locationId) {
            $query->whereHas('purchaseRequestItem', function ($q) use ($locationId) {
                $q->whereHas('purchaseRequest', function ($subQ) use ($locationId) {
                    $subQ->where('location_id', $locationId);
                });
            });
        }

        return $query->count();
    }

    /**
     * Get Invoice count based on date type and location
     */
    private function getInvoiceCount($startDate, $endDate, $dateType, $locationId = null)
    {
        $query = Invoice::query();

        // Apply date filter based on date type
        switch ($dateType) {
            case 'invoice':
                $query->whereNotNull('invoice_submitted_at')
                      ->whereBetween('invoice_submitted_at', [$startDate, $endDate]);
                break;
            case 'pr':
                $query->whereHas('purchaseOrderOnsite', function ($q) use ($startDate, $endDate, $locationId) {
                    $q->whereHas('purchaseOrderItem', function ($subQ) use ($startDate, $endDate, $locationId) {
                        $subQ->whereHas('purchaseOrder', function ($poQ) use ($startDate, $endDate) {
                            // PO exists check
                        });
                        $subQ->whereHas('purchaseRequestItem', function ($prItemQ) use ($startDate, $endDate, $locationId) {
                            $prItemQ->whereHas('purchaseRequest', function ($prQ) use ($startDate, $endDate, $locationId) {
                                $prQ->whereNotNull('approved_date')
                                    ->whereBetween('approved_date', [$startDate, $endDate]);
                                if ($locationId) {
                                    $prQ->where('location_id', $locationId);
                                }
                            });
                        });
                    });
                });
                return $query->count();
            case 'po':
                $query->whereHas('purchaseOrderOnsite', function ($q) use ($startDate, $endDate, $locationId) {
                    $q->whereHas('purchaseOrderItem', function ($subQ) use ($startDate, $endDate, $locationId) {
                        $subQ->whereHas('purchaseOrder', function ($poQ) use ($startDate, $endDate) {
                            $poQ->whereNotNull('approved_date')
                                 ->whereBetween('approved_date', [$startDate, $endDate]);
                        });
                        if ($locationId) {
                            $subQ->whereHas('purchaseRequestItem', function ($prItemQ) use ($locationId) {
                                $prItemQ->whereHas('purchaseRequest', function ($prQ) use ($locationId) {
                                    $prQ->where('location_id', $locationId);
                                });
                            });
                        }
                    });
                });
                return $query->count();
            default:
                $query->whereNotNull('invoice_submitted_at')
                      ->whereBetween('invoice_submitted_at', [$startDate, $endDate]);
        }

        // Apply location filter only if not already applied in switch cases
        if ($locationId && $dateType === 'invoice') {
            $query->whereHas('purchaseOrderOnsite', function ($q) use ($locationId) {
                $q->whereHas('purchaseOrderItem', function ($subQ) use ($locationId) {
                    $subQ->whereHas('purchaseRequestItem', function ($prItemQ) use ($locationId) {
                        $prItemQ->whereHas('purchaseRequest', function ($prQ) use ($locationId) {
                            $prQ->where('location_id', $locationId);
                        });
                    });
                });
            });
        }

        return $query->count();
    }

    /**
     * Get Payment count based on date type and location
     */
    private function getPaymentCount($startDate, $endDate, $dateType, $locationId = null)
    {
        $query = Payment::query();

        // Apply date filter based on date type
        switch ($dateType) {
            case 'payment':
                $query->whereNotNull('payment_date')
                      ->whereBetween('payment_date', [$startDate, $endDate]);
                break;
            case 'invoice':
                $query->whereHas('invoice', function ($q) use ($startDate, $endDate) {
                    $q->whereNotNull('invoice_submitted_at')
                      ->whereBetween('invoice_submitted_at', [$startDate, $endDate]);
                });
                break;
            case 'pr':
                $query->whereHas('invoice', function ($q) use ($startDate, $endDate, $locationId) {
                    $q->whereHas('purchaseOrderOnsite', function ($subQ) use ($startDate, $endDate, $locationId) {
                        $subQ->whereHas('purchaseOrderItem', function ($poItemQ) use ($startDate, $endDate, $locationId) {
                            $poItemQ->whereHas('purchaseRequestItem', function ($prItemQ) use ($startDate, $endDate, $locationId) {
                                $prItemQ->whereHas('purchaseRequest', function ($prQ) use ($startDate, $endDate, $locationId) {
                                    $prQ->whereNotNull('approved_date')
                                        ->whereBetween('approved_date', [$startDate, $endDate]);
                                    if ($locationId) {
                                        $prQ->where('location_id', $locationId);
                                    }
                                });
                            });
                        });
                    });
                });
                return $query->count();
            case 'po':
                $query->whereHas('invoice', function ($q) use ($startDate, $endDate, $locationId) {
                    $q->whereHas('purchaseOrderOnsite', function ($subQ) use ($startDate, $endDate, $locationId) {
                        $subQ->whereHas('purchaseOrderItem', function ($poItemQ) use ($startDate, $endDate, $locationId) {
                            $poItemQ->whereHas('purchaseOrder', function ($poQ) use ($startDate, $endDate) {
                                $poQ->whereNotNull('approved_date')
                                    ->whereBetween('approved_date', [$startDate, $endDate]);
                            });
                            if ($locationId) {
                                $poItemQ->whereHas('purchaseRequestItem', function ($prItemQ) use ($locationId) {
                                    $prItemQ->whereHas('purchaseRequest', function ($prQ) use ($locationId) {
                                        $prQ->where('location_id', $locationId);
                                    });
                                });
                            }
                        });
                    });
                });
                return $query->count();
            default:
                $query->whereNotNull('payment_date')
                      ->whereBetween('payment_date', [$startDate, $endDate]);
        }

        // Apply location filter only if not already applied in switch cases
        if ($locationId && in_array($dateType, ['payment', 'invoice'])) {
            $query->whereHas('invoice', function ($q) use ($locationId) {
                $q->whereHas('purchaseOrderOnsite', function ($subQ) use ($locationId) {
                    $subQ->whereHas('purchaseOrderItem', function ($poItemQ) use ($locationId) {
                        $poItemQ->whereHas('purchaseRequestItem', function ($prItemQ) use ($locationId) {
                            $prItemQ->whereHas('purchaseRequest', function ($prQ) use ($locationId) {
                                $prQ->where('location_id', $locationId);
                            });
                        });
                    });
                });
            });
        }

        return $query->count();
    }

    /**
     * Get recent PR based on date type and location
     */
    private function getRecentPR($startDate, $endDate, $dateType, $locationId = null)
    {
        $query = PurchaseRequest::with(['location', 'creator']);

        // Apply date filter
        $query->whereNotNull('approved_date')
              ->whereBetween('approved_date', [$startDate, $endDate]);

        // Apply location filter
        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        return $query->latest()
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
    }

    /**
     * Get recent payments based on date type and location
     */
    private function getRecentPayments($startDate, $endDate, $dateType, $locationId = null)
    {
        $query = Payment::with(['invoice', 'creator']);

        // Apply date filter based on date type
        switch ($dateType) {
            case 'payment':
                $query->whereNotNull('payment_date')
                      ->whereBetween('payment_date', [$startDate, $endDate]);
                break;
            case 'invoice':
                $query->whereHas('invoice', function ($q) use ($startDate, $endDate) {
                    $q->whereNotNull('invoice_submitted_at')
                      ->whereBetween('invoice_submitted_at', [$startDate, $endDate]);
                });
                break;
            case 'pr':
                $query->whereHas('invoice', function ($q) use ($startDate, $endDate) {
                    $q->whereHas('purchaseOrderOnsite', function ($subQ) use ($startDate, $endDate) {
                        $subQ->whereHas('purchaseOrderItem', function ($poItemQ) use ($startDate, $endDate) {
                            $poItemQ->whereHas('purchaseRequestItem', function ($prItemQ) use ($startDate, $endDate) {
                                $prItemQ->whereHas('purchaseRequest', function ($prQ) use ($startDate, $endDate) {
                                    $prQ->whereNotNull('approved_date')
                                        ->whereBetween('approved_date', [$startDate, $endDate]);
                                });
                            });
                        });
                    });
                });
                break;
            case 'po':
                $query->whereHas('invoice', function ($q) use ($startDate, $endDate) {
                    $q->whereHas('purchaseOrderOnsite', function ($subQ) use ($startDate, $endDate) {
                        $subQ->whereHas('purchaseOrderItem', function ($poItemQ) use ($startDate, $endDate) {
                            $poItemQ->whereHas('purchaseOrder', function ($poQ) use ($startDate, $endDate) {
                                $poQ->whereNotNull('approved_date')
                                    ->whereBetween('approved_date', [$startDate, $endDate]);
                            });
                        });
                    });
                });
                break;
            default:
                $query->whereNotNull('payment_date')
                      ->whereBetween('payment_date', [$startDate, $endDate]);
        }

        // Apply location filter
        if ($locationId) {
            $query->whereHas('invoice', function ($q) use ($locationId) {
                $q->whereHas('purchaseOrderOnsite', function ($subQ) use ($locationId) {
                    $subQ->whereHas('purchaseOrderItem', function ($poItemQ) use ($locationId) {
                        $poItemQ->whereHas('purchaseRequestItem', function ($prItemQ) use ($locationId) {
                            $prItemQ->whereHas('purchaseRequest', function ($prQ) use ($locationId) {
                                $prQ->where('location_id', $locationId);
                            });
                        });
                    });
                });
            });
        }

        return $query->latest()
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
    }
}
