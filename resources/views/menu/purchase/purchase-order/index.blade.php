@extends('layouts.vertical', ['title' => 'Purchase Order', 'sub_title' => 'Purchase'])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css','node_modules/tippy.js/dist/tippy.css'])
@endsection

@section('content')
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_receipt_line text-3xl"></i>
                    <span>Purchase Order </span>
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Kelola purchase order dan data supplier terkait
                </p>
            </div>
        </div>
    </div>

    <!-- Statistik ringkas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total PO -->
        <div class="card bg-primary text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total PO</p>
                        <h3 class="text-2xl font-bold text-white">{{ $totalPO ?? 0 }}</h3>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_file_check_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Item PO -->
        <div class="card bg-blue-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total Item PO</p>
                        <h3 class="text-2xl font-bold text-white">{{ $totalPOItems ?? 0 }}</h3>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_shopping_bag_3_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- PO Belum Onsite -->
        <div class="card bg-warning text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">PO Belum Onsite</p>
                        <h3 class="text-2xl font-bold text-white">{{ $totalPONotOnsite ?? 0 }}</h3>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_alert_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent POs -->
        <div class="card bg-green-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">PO Dibuat (30 Hari)</p>
                        <h3 class="text-2xl font-bold text-white">{{ $recentPOs ?? 0 }}</h3>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_time_line"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Tabel utama -->
    <div class="card">
        <div class="card-header">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h4 class="card-title">Daftar Purchase Order</h4>
                    <p class="text-sm text-slate-700 dark:text-slate-400">
                        Kelola purchase order
                    </p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-toggle-filter"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
                        <i class="mgc_filter_line mr-2"></i>
                        Filter
                    </button>
                    <button id="btn-refresh"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
                        <i class="mgc_refresh_2_line"></i>
                    </button>
                    <button id="btn-delete-selected"
                        class="hidden inline-flex items-center justify-center h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                        disabled>
                        <i class="mgc_delete_2_line mr-2"></i>
                        Hapus Selected
                    </button>
                    @haspermission('purchase-orders.create')
                    <a href="{{ route('purchase-order.create') }}"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary hover:bg-primary-600 text-white transition-colors">
                        <i class="mgc_add_line mr-2"></i>
                        Tambah PO
                    </a>
                    @endhaspermission
                </div>
            </div>
        </div>
        <!-- Filter Section -->
        <div id="filter-section" class="hidden border-b border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
            <!-- Search Bars (separated) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PO Number</label>
                    <input type="text" id="filter-po-number" class="form-input" placeholder="Masukkan PO Number...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Item Description</label>
                    <input type="text" id="filter-item-desc" class="form-input" placeholder="Masukkan Item Description...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PR Number</label>
                    <input type="text" id="filter-pr-number" class="form-input" placeholder="Masukkan PR Number...">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Supplier Filter -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Supplier</label>
                    <select id="filter-supplier" class="form-select">
                        <option value="">Semua Supplier</option>
                        @foreach($suppliers ?? [] as $s)
                            <option value="{{ $s->id }}">{{ $s->name }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Request Type Filter -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipe Request (PR)</label>
                    <select id="filter-request-type" class="form-select">
                        <option value="">Semua Tipe</option>
                        <option value="barang">Barang</option>
                        <option value="jasa">Jasa</option>
                    </select>
                </div>

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

                <!-- Date From -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tanggal Dari (Approved)</label>
                    <input type="date" id="filter-date-from" class="form-input">
                </div>

                <!-- Date To -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tanggal Sampai (Approved)</label>
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
                Showing <span id="data-count">0</span> purchase order.
            </p>
            <!-- Table -->
            <div id="table-po" class="w-full overflow-x-auto"></div>
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
                        <div
                            class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <i class="mgc_alert_line text-2xl text-red-600 dark:text-red-400"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-800 dark:text-white">Konfirmasi Hapus</h3>
                            <p id="deleteMessage" class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Apakah Anda yakin ingin menghapus data ini?
                            </p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button id="deleteModalCancel"
                            class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                            Batal
                        </button>
                        <button id="deleteModalConfirm"
                            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Detail PO Modal -->
    <div id="detailPOModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out"
        style="opacity: 0;">
        <div id="detailPOModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <div class="relative min-h-screen flex items-center justify-center px-4 py-6">
            <div id="detailPOModalContent"
                class="relative w-full max-w-7xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform max-h-[90vh] overflow-y-auto"
                style="transform: scale(0.95); opacity: 0;">
                <div
                    class="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-white">Detail Purchase Order</h3>
                    <button id="detailPOModalClose"
                        class="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <i class="mgc_close_line text-xl"></i>
                    </button>
                </div>

                <div class="p-6">
                    <!-- PO Info -->
                    <div class="mb-6">
                        <h4 class="text-base font-semibold text-slate-800 dark:text-white mb-4">Informasi Purchase Order
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p class="text-xs font-medium text-slate-600 dark:text-slate-400">PO Number</p>
                                <p id="detailPONumber" class="text-sm font-semibold text-slate-800 dark:text-white mt-1">-
                                </p>
                            </div>
                            <div>
                                <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Approved Date</p>
                                <p id="detailPOApprovedDate"
                                    class="text-sm font-semibold text-slate-800 dark:text-white mt-1">-</p>
                            </div>
                            <div>
                                <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Supplier</p>
                                <p id="detailPOSupplier" class="text-sm font-semibold text-slate-800 dark:text-white mt-1">-
                                </p>
                            </div>
                            <div>
                                <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Created By</p>
                                <p id="detailPOCreatedBy" class="text-sm font-semibold text-slate-800 dark:text-white mt-1">
                                    -</p>
                            </div>
                            <div>
                                <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Created At</p>
                                <p id="detailPOCreatedAt" class="text-sm font-semibold text-slate-800 dark:text-white mt-1">
                                    -</p>
                            </div>
                        </div>
                        <div class="mt-4">
                            <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Notes</p>
                            <p id="detailPONotes" class="text-sm text-slate-800 dark:text-white mt-1">-</p>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div>
                        <h4 class="text-base font-semibold text-slate-800 dark:text-white mb-4">Items</h4>
                        <div class="overflow-x-auto">
                            <div id="detailPOItemsGrid" class="w-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/pages/highlight.js', 'resources/js/pages/extended-tippy.js', 'resources/js/custom/purchase/purchase-order/index.js'])
@endsection
