@extends('layouts.vertical', ['title' => 'PO Onsite Tracking', 'sub_title' => 'Purchase'])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css','node_modules/tippy.js/dist/tippy.css'])
@endsection

@section('content')
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_location_line"></i>
                    PO Onsite Tracking
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Kelola data onsite dari item purchase order
                </p>
            </div>
        </div>
    </div>

    <!-- Statistik ringkas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card bg-primary text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Total Onsite</p>
                    <h3 class="text-2xl font-bold">{{ $totalOnsites }}</h3>
                </div>
                <i class="mgc_file_check_line text-3xl opacity-80"></i>
            </div>
        </div>
        <div class="card bg-green-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Completed</p>
                    <h3 class="text-2xl font-bold">{{ $completedOnsites }}</h3>
                </div>
                <i class="mgc_check_circle_line text-3xl opacity-80"></i>
            </div>
        </div>
        <div class="card bg-orange-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Pending</p>
                    <h3 class="text-2xl font-bold">{{ $pendingOnsites }}</h3>
                </div>
                <i class="mgc_time_line text-3xl opacity-80"></i>
            </div>
        </div>
        <div class="card bg-blue-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Recent (30d)</p>
                    <h3 class="text-2xl font-bold">{{ $recentOnsites }}</h3>
                </div>
                <i class="mgc_calendar_line text-3xl opacity-80"></i>
            </div>
        </div>
    </div>

    <!-- Tabel utama -->
    <div class="card">
        <div class="card-header">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Daftar PO Onsite</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Tracking data onsite purchase order items
                    </p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-toggle-filter"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
                        <i class="mgc_filter_line mr-2"></i>
                        Filter
                    </button>
                    <button type="button" id="btn-refresh" 
                        class="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                        data-tippy-content="Refresh Data">
                        <i class="mgc_refresh_1_line text-lg"></i>
                    </button>
                    <button type="button" id="btn-edit-selected" 
                        class="btn bg-info text-white hover:bg-info-600 hidden"
                        data-tippy-content="Edit yang dipilih">
                        <i class="mgc_edit_line text-lg"></i>
                        <span>Edit (<span id="edit-count">0</span>)</span>
                    </button>
                    <button type="button" id="btn-delete-selected" 
                        class="btn bg-danger text-white hover:bg-danger-600 hidden"
                        data-tippy-content="Hapus yang dipilih">
                        <i class="mgc_delete_2_line text-lg"></i>
                        <span>Hapus (<span id="delete-count">0</span>)</span>
                    </button>
                    <a href="{{ route('po-onsite.create') }}" 
                        class="btn bg-success text-white hover:bg-success-600">
                        <i class="mgc_add_line text-lg"></i>
                        <span>Tambah Onsite</span>
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Filter Section -->
        <div id="filter-section" class="hidden border-b border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
            <!-- Search Bars -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PO Number</label>
                    <input type="text" id="filter-po-number" class="form-input" placeholder="Masukkan PO Number...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PR Number</label>
                    <input type="text" id="filter-pr-number" class="form-input" placeholder="Masukkan PR Number...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Item Description</label>
                    <input type="text" id="filter-item-desc" class="form-input" placeholder="Masukkan Item Description...">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Location Filter -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Lokasi (PR)</label>
                    <select id="filter-location" class="form-select">
                        <option value="">Semua Lokasi</option>
                        @foreach($locations ?? [] as $l)
                            <option value="{{ $l->id }}">{{ $l->name }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Classification Filter -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Klasifikasi (PR Item)</label>
                    <select id="filter-classification" class="form-select">
                        <option value="">Semua Klasifikasi</option>
                        @foreach($classifications ?? [] as $c)
                            <option value="{{ $c->id }}">{{ $c->name }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Current Stage Filter -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status (PR)</label>
                    <select id="filter-stage" class="form-select">
                        <option value="">Semua Status</option>
                        <option value="1">PR Created</option>
                        <option value="2">PO Linked</option>
                        <option value="3">PO Onsite</option>
                        <option value="4">Invoice Received</option>
                        <option value="5">Invoice Submitted</option>
                        <option value="6">Payment</option>
                        <option value="7">Completed</option>
                    </select>
                </div>

                <!-- Date From -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tanggal Dari (Onsite)</label>
                    <input type="date" id="filter-date-from" class="form-input">
                </div>

                <!-- Date To -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tanggal Sampai (Onsite)</label>
                    <input type="date" id="filter-date-to" class="form-input">
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <button id="btn-clear-filter"
                    class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
                    <i class="mgc_close_line mr-2"></i>
                    Clear Filter
                </button>
                <button id="btn-apply-filter"
                    class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary hover:bg-primary-600 text-white transition-colors">
                    <i class="mgc_filter_line mr-2"></i>
                    Apply Filter
                </button>
            </div>
        </div>
        
        <div class="p-6">
            <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">
                Showing <span id="data-count">0</span> onsite records.
            </p>
            <!-- Table -->
            <div id="table-onsite" class="w-full overflow-x-auto"></div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out"
        style="opacity: 0;">
        <div id="deleteModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <div class="relative min-h-screen flex items-center justify-center px-4">
            <div id="deleteModalContent"
                class="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">
                <div class="p-6">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                            <i class="mgc_alert_triangle_line text-2xl text-danger"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Hapus</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1" id="deleteMessage">
                                Apakah Anda yakin ingin menghapus data ini?
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-3 justify-end mt-6">
                        <button type="button" id="deleteModalCancel"
                            class="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">
                            Batal
                        </button>
                        <button type="button" id="deleteModalConfirm"
                            class="btn bg-danger text-white hover:bg-danger-600">
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Detail Onsite Modal -->
    <div id="detailOnsiteModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out"
        style="opacity: 0;">
        <div id="detailOnsiteModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <div class="relative min-h-screen flex items-center justify-center px-4 py-6">
            <div id="detailOnsiteModalContent"
                class="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">
                <div class="flex items-center justify-between border-b dark:border-slate-700 px-6 py-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Detail PO Onsite</h3>
                    <button type="button" id="detailOnsiteModalClose"
                        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <i class="mgc_close_line text-xl"></i>
                    </button>
                </div>
                <div class="p-6" id="detailOnsiteContent">
                    <div class="text-center py-8">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">Loading...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/pages/highlight.js', 'resources/js/pages/extended-tippy.js', 'resources/js/custom/purchase/po-onsite/index.js'])
@endsection
