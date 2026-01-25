@extends('layouts.vertical', ['title' => 'PR Items - ' . $classification->name, 'sub_title' => 'Klasifikasi', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css'])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <!-- Back Button -->
                <a href="{{ route('klasifikasi.index') }}" 
                   class="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary mb-3 transition-colors">
                    <i class="mgc_left_line"></i>
                    <span>Kembali ke Klasifikasi</span>
                </a>
                
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_file_check_line text-2xl"></i>
                    PR Items: {{ $classification->name }}
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    Daftar purchase request items dengan klasifikasi <strong>{{ $classification->name }}</strong>
                </p>
            </div>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total PR Items -->
        <div class="card bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total PR Items</p>
                        <h3 class="text-2xl font-bold text-white">{{ $prItemsCount }}</h3>
                    </div>
                    <div class="text-4xl opacity-80">
                        <i class="mgc_file_check_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total PR Amount -->
        <div class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total PR Amount</p>
                        <h3 class="text-xl font-bold text-white">
                            Rp {{ number_format($totalPRAmount ?? 0, 0, ',', '.') }}
                        </h3>
                    </div>
                    <div class="text-4xl opacity-80">
                        <i class="mgc_document_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total PO Amount -->
        <div class="card bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total PO Amount</p>
                        <h3 class="text-xl font-bold text-white">
                            Rp {{ number_format($totalPOAmount ?? 0, 0, ',', '.') }}
                        </h3>
                    </div>
                    <div class="text-4xl opacity-80">
                        <i class="mgc_shopping_bag_3_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Cost Saving -->
        <div class="card bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total Cost Saving</p>
                        <h3 class="text-xl font-bold text-white">
                            Rp {{ number_format($totalCostSaving ?? 0, 0, ',', '.') }}
                        </h3>
                    </div>
                    <div class="text-4xl opacity-80">
                        <i class="mgc_money_line"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="card">
        <div class="card-header">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h4 class="card-title">Daftar PR Items</h4>
                    <p class="text-sm text-slate-700 dark:text-slate-400">
                        Semua purchase request items dengan klasifikasi {{ $classification->name }}
                    </p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-refresh"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
                        <i class="mgc_refresh_2_line"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="p-6">
            <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">
                Menampilkan <span id="data-count">0</span> PR items.
            </p>
            <!-- Table -->
            <div id="table-pr-items" class="w-full overflow-x-auto"></div>
        </div>
    </div>

    <!-- PR Detail Modal -->
    <div id="prDetailModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out" style="opacity: 0; pointer-events: none;">
        <div id="prDetailBackdrop" class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out cursor-pointer" style="opacity: 0;"></div>

        <div class="relative min-h-screen flex items-center justify-center px-4 py-6">
            <div id="prDetailContent"
                class="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">
                <div class="flex items-center justify-between border-b dark:border-slate-700 px-6 py-4">
                    <div>
                        <p class="text-xs uppercase tracking-widest text-primary font-semibold">PR Detail</p>
                        <h3 id="prDetailTitle" class="text-lg font-bold text-gray-900 dark:text-white">PR Detail</h3>
                    </div>
                    <button type="button" id="prDetailClose"
                        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <i class="mgc_close_line text-xl"></i>
                    </button>
                </div>
                <div class="p-6" id="prDetailBody">
                    <div class="text-center py-8">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">Loading...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- No Data State -->
    @if($prItemsCount === 0)
    <div class="card mt-6">
        <div class="p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <i class="mgc_inbox_line text-3xl text-slate-400"></i>
            </div>
            <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-2">Tidak Ada Data</h3>
            <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Belum ada purchase request items dengan klasifikasi <strong>{{ $classification->name }}</strong>.
            </p>
            <a href="{{ route('klasifikasi.index') }}" 
               class="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg transition-colors">
                <i class="mgc_left_line"></i>
                <span>Kembali ke Klasifikasi</span>
            </a>
        </div>
    </div>
    @endif
@endsection

@section('script')
    @vite([
        'resources/js/pages/highlight.js',
        'resources/js/custom/config/classification/pr-items.js',
    ])
    <script>
        // Pass classification data to JavaScript
        window.classificationData = {
            id: {{ $classification->id }},
            name: "{{ $classification->name }}",
            prItemsCount: {{ $prItemsCount }}
        };
    </script>
@endsection
