@extends('layouts.vertical', ['title' => 'Data Pembayaran', 'sub_title' => 'Invoice'])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css','node_modules/tippy.js/dist/tippy.css'])
@endsection

@section('content')
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_wallet_line"></i>
                    Data Pembayaran
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Kelola data pembayaran invoice dari vendor
                </p>
            </div>
            <a href="{{ route('pembayaran.create') }}" 
                class="btn bg-primary text-white hover:bg-primary-600 inline-flex items-center gap-2">
                <i class="mgc_add_line"></i>
                <span>Tambah Pembayaran</span>
            </a>
        </div>
    </div>

    <!-- Statistik ringkas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card bg-primary text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Total Pembayaran</p>
                    <h3 class="text-2xl font-bold" id="stat-total">0</h3>
                </div>
                <i class="mgc_wallet_line text-3xl opacity-80"></i>
            </div>
        </div>
        <div class="card bg-green-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Sudah Dibayar</p>
                    <h3 class="text-2xl font-bold" id="stat-paid">0</h3>
                </div>
                <i class="mgc_check_circle_line text-3xl opacity-80"></i>
            </div>
        </div>
        <div class="card bg-amber-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Belum Dibayar</p>
                    <h3 class="text-2xl font-bold" id="stat-pending">0</h3>
                </div>
                <i class="mgc_time_line text-3xl opacity-80"></i>
            </div>
        </div>
        <div class="card bg-orange-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Recent (30 hari)</p>
                    <h3 class="text-2xl font-bold" id="stat-recent">0</h3>
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
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Daftar Pembayaran</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Kelola seluruh data pembayaran invoice
                    </p>
                </div>
                <div class="flex gap-2">
                    <button type="button" id="btn-refresh"
                        class="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                        data-tippy-content="Refresh Data">
                        <i class="mgc_refresh_1_line text-lg"></i>
                    </button>
                    <button type="button" id="btn-delete-selected"
                        class="btn bg-red-500 text-white hover:bg-red-600 hidden"
                        data-tippy-content="Hapus">
                        <i class="mgc_delete_2_line text-lg"></i>
                        <span>Hapus (<span id="delete-count">0</span>)</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="p-6" data-table-init>
            <div class="overflow-x-auto -mx-6 px-6">
                <div id="table-pembayaran" class="w-full"></div>
            </div>
        </div>
    </div>

    <!-- Delete Modal -->
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
                        <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                            <i class="mgc_alert_circle_line text-2xl text-red-600 dark:text-red-400"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Hapus Pembayaran</h3>
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
                            class="btn bg-red-500 text-white hover:bg-red-600">
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/pages/highlight.js', 'resources/js/pages/extended-tippy.js', 'resources/js/custom/invoice/pembayaran/index.js'])
@endsection
