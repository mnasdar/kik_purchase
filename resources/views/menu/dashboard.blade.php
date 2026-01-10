@extends('layouts.vertical', ['title' => 'Dashboard', 'sub_title' => 'Overview'])

@section('css')
    @vite(['node_modules/flatpickr/dist/flatpickr.min.css'])
@endsection

@section('content')
    <!-- Date Range Filter -->
    <div class="card mb-6 sticky top-20 z-40 shadow-lg">
        <div class="p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Dashboard Purchasing</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Monitoring progress Purchase Request hingga Pembayaran
                    </p>
                </div>
                <div class="flex items-center gap-3 flex-wrap">

                    <!-- Unit Filter -->
                    <div class="relative">
                        <select id="unitFilter" 
                            class="search-select pr-10"
                            @if(!auth()->user()->hasRole('Super Admin')) disabled @endif>
                            @if(auth()->user()->hasRole('Super Admin'))
                                <option value="">Semua Unit</option>
                            @endif
                            @foreach($locations as $location)
                                <option value="{{ $location->id }}" @if(!auth()->user()->hasRole('Super Admin') && auth()->user()->location_id == $location->id) selected @endif>{{ $location->name }}</option>
                            @endforeach
                        </select>
                    </div>

                    <!-- Date Type Filter -->
                    <div class="relative">
                        <select id="dateTypeFilter" 
                            class="search-select pr-10">
                            <option value="pr">PR (Approved Date)</option>
                            <option value="po">PO (Approved Date)</option>
                            <option value="invoice">Invoice (Submittion Date)</option>
                            <option value="payment">Payment (Payment Date)</option>
                        </select>
                    </div>

                    <!-- Date Range Filter -->
                    <div class="relative">
                        <input type="text" id="dateRange" 
                            class="form-input pl-10 pr-4 py-2 w-72" 
                            placeholder="Pilih rentang tanggal..." readonly>
                        <i class="mgc_calendar_line absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                    </div>

                    <!-- Reset Button -->
                    <button type="button" id="btn-reset-filter"
                        class="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">
                        <i class="mgc_refresh_1_line"></i> Reset
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <!-- Purchase Request -->
        <div class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <i class="mgc_file_new_line text-2xl"></i>
                    </div>
                    <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full" id="pr-badge">+0%</span>
                </div>
                <h3 class="text-3xl font-bold mb-1" id="stat-pr">0</h3>
                <p class="text-sm opacity-90">Purchase Request</p>
                <div class="mt-4 pt-4 border-t border-white/20">
                    <p class="text-xs opacity-75">Total PR dalam periode</p>
                </div>
            </div>
        </div>

        <!-- Purchase Order -->
        <div class="card bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <i class="mgc_shopping_cart_2_line text-2xl"></i>
                    </div>
                    <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full" id="po-badge">0%</span>
                </div>
                <h3 class="text-3xl font-bold mb-1" id="stat-po">0</h3>
                <p class="text-sm opacity-90">Purchase Order</p>
                <div class="mt-4 pt-4 border-t border-white/20">
                    <p class="text-xs opacity-75">Konversi dari PR</p>
                </div>
            </div>
        </div>

        <!-- Invoice -->
        <div class="card bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <i class="mgc_file_check_line text-2xl"></i>
                    </div>
                    <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full" id="invoice-badge">0%</span>
                </div>
                <h3 class="text-3xl font-bold mb-1" id="stat-invoice">0</h3>
                <p class="text-sm opacity-90">Invoice Received</p>
                <div class="mt-4 pt-4 border-t border-white/20">
                    <p class="text-xs opacity-75">Invoice diterima</p>
                </div>
            </div>
        </div>

        <!-- Payment -->
        <div class="card bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <i class="mgc_wallet_line text-2xl"></i>
                    </div>
                    <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full" id="payment-badge">0%</span>
                </div>
                <h3 class="text-3xl font-bold mb-1" id="stat-payment">0</h3>
                <p class="text-sm opacity-90">Payment Complete</p>
                <div class="mt-4 pt-4 border-t border-white/20">
                    <p class="text-xs opacity-75">Pembayaran selesai</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Progress Flow & Charts -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <!-- Progress Flow -->
        <div class="card">
            <div class="card-header">
                <h4 class="text-lg font-semibold text-gray-800 dark:text-white" id="progressFlowTitle">Progress Flow</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Alur proses dari PR hingga Payment
                </p>
            </div>
            <div class="p-6">
                <div class="space-y-6">
                    <!-- PR to PO -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">PR → PO</span>
                            <span class="text-sm font-bold text-blue-600 dark:text-blue-400" id="progress-pr-po">0%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
                                style="width: 0%" id="bar-pr-po"></div>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span id="count-pr-po">0 dari 0</span> PR telah menjadi PO
                        </p>
                    </div>

                    <!-- PO to Invoice -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">PO → Invoice</span>
                            <span class="text-sm font-bold text-purple-600 dark:text-purple-400" id="progress-po-invoice">0%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div class="bg-gradient-to-r from-purple-500 to-amber-500 h-3 rounded-full transition-all duration-500" 
                                style="width: 0%" id="bar-po-invoice"></div>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span id="count-po-invoice">0 dari 0</span> PO telah diterima invoicenya
                        </p>
                    </div>

                    <!-- Invoice to Payment -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice → Payment</span>
                            <span class="text-sm font-bold text-amber-600 dark:text-amber-400" id="progress-invoice-payment">0%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div class="bg-gradient-to-r from-amber-500 to-green-500 h-3 rounded-full transition-all duration-500" 
                                style="width: 0%" id="bar-invoice-payment"></div>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span id="count-invoice-payment">0 dari 0</span> Invoice telah dibayar
                        </p>
                    </div>

                    <!-- Overall Progress -->
                    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">Overall Progress</span>
                            <span class="text-sm font-bold text-green-600 dark:text-green-400" id="progress-overall">0%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div class="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-4 rounded-full transition-all duration-500" 
                                style="width: 0%" id="bar-overall"></div>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Progress keseluruhan dari PR hingga Payment
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chart Visualization -->
        <div class="card">
            <div class="card-header">
                <h4 class="text-lg font-semibold text-gray-800 dark:text-white" id="chartItemTitle">Grafik Jumlah Item</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Grafik perbandingan volume data
                </p>
            </div>
            <div class="p-6">
                <div id="chart-purchasing" style="min-height: 350px;"></div>
            </div>
        </div>
    </div>

    <!-- PO Analytics Chart -->
    <div class="card mb-6">
        <div class="card-header">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white" id="poChartTitle">Grafik Purchase Order (PO)</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-1" id="poChartSubtitle">
                        Grafik total amount, jumlah PO, dan rata-rata % realisasi SLA per bulan (12 bulan terakhir)
                    </p>
                </div>
                <div class="relative">
                    <select id="poAnalyticsFilter" 
                        class="search-select pr-10">
                        <option value="po">Purchase Order</option>
                        <option value="pr">Purchase Request</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="p-6">
            <div id="chart-po-analytics" style="min-height: 400px;"></div>
        </div>
    </div>

    <!-- Cost Saving Analytics Charts -->
    <!-- Total Cost Saving Chart (Full Width) -->
    <div class="card mb-6">
        <div class="card-header">
            <div>
                <h4 class="text-lg font-semibold text-gray-800 dark:text-white" id="totalCostSavingTitle">Total Cost Saving</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Total penghematan biaya per periode
                </p>
            </div>
        </div>
        <div class="p-6">
            <div id="chart-cost-saving-total" style="min-height: 380px;"></div>
        </div>
    </div>

    <!-- % Cost Saving and % SLA Charts (2 Columns) -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <!-- % Cost Saving Chart -->
        <div class="card">
            <div class="card-header">
                <h4 class="text-lg font-semibold text-gray-800 dark:text-white" id="percentCostSavingTitle">% Cost Saving</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Persentase penghematan rata-rata per item
                </p>
            </div>
            <div class="p-6">
                <div id="chart-cost-saving-percent" style="min-height: 380px;"></div>
            </div>
        </div>

        <!-- % SLA Chart -->
        <div class="card">
            <div class="card-header">
                <h4 class="text-lg font-semibold text-gray-800 dark:text-white" id="slaCostSavingTitle">% SLA PR → PO</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Compliance SLA (<= target = 100%, > target = 0%)
                </p>
            </div>
            <div class="p-6">
                <div id="chart-sla-percent" style="min-height: 380px;"></div>
            </div>
        </div>
    </div>

@endsection

@section('script')
    @vite([
        // 
        'resources/js/pages/form-select.js',
        'resources/js/pages/form-flatpickr.js', 
        'resources/js/custom/dashboard/index.js'])
@endsection
