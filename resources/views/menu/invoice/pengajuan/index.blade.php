@extends('layouts.vertical', ['title' => 'Pengajuan Invoice', 'sub_title' => 'Invoice'])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css','node_modules/tippy.js/dist/tippy.css'])
@endsection

@section('content')
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_send_line"></i>
                    Pengajuan Invoice
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Ajukan invoice yang sudah diterima ke finance
                </p>
            </div>
        </div>
    </div>

    <!-- Statistik ringkas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card bg-primary text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Total Invoice</p>
                    <h3 class="text-2xl font-bold">{{ $totalInvoices ?? 0 }}</h3>
                </div>
                <i class="mgc_file_line text-3xl opacity-80"></i>
            </div>
        </div>
        <div class="card bg-amber-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Belum Diajukan</p>
                    <h3 class="text-2xl font-bold">{{ $pendingInvoices ?? 0 }}</h3>
                </div>
                <i class="mgc_time_line text-3xl opacity-80"></i>
            </div>
        </div>
        <div class="card bg-green-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Sudah Diajukan</p>
                    <h3 class="text-2xl font-bold">{{ $submittedInvoices ?? 0 }}</h3>
                </div>
                <i class="mgc_check_circle_line text-3xl opacity-80"></i>
            </div>
        </div>
        <div class="card bg-orange-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="text-sm opacity-90">Recent (30d)</p>
                    <h3 class="text-2xl font-bold">{{ $recentInvoices ?? 0 }}</h3>
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
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Daftar Invoice Siap Diajukan</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Data invoice yang sudah diterima dari vendor dan menunggu pengajuan ke finance
                    </p>
                </div>
                <div class="flex gap-2">
                    <button type="button" id="btn-refresh"
                        class="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                        data-tippy-content="Refresh Data">
                        <i class="mgc_refresh_1_line text-lg"></i>
                    </button>
                    <a href="{{ route('pengajuan.history') }}"
                        class="btn bg-info text-white hover:bg-info-600"
                        data-tippy-content="Lihat Riwayat Pengajuan">
                        <i class="mgc_history_line text-lg"></i>
                        <span>Riwayat</span>
                    </a>
                    <button type="button" id="btn-submit-selected"
                        class="btn bg-success text-white hover:bg-success-600 hidden"
                        data-tippy-content="Ajukan ke Finance">
                        <i class="mgc_send_line text-lg"></i>
                        <span>Ajukan (<span id="submit-count">0</span>)</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="p-6">
            <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">
                Showing <span id="data-count">0</span> invoice records.
            </p>
            <div class="overflow-x-auto -mx-6 px-6">
                <div id="table-pengajuan" class="w-full"></div>
            </div>
        </div>
    </div>

    <!-- Submit Modal -->
    <div id="submitModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out"
        style="opacity: 0;">
        <div id="submitModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <div class="relative min-h-screen flex items-center justify-center px-4">
            <div id="submitModalContent"
                class="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">
                <div class="p-6">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                            <i class="mgc_send_line text-2xl text-success"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ajukan ke Finance</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1" id="submitMessage">
                                Tentukan tanggal pengajuan ke finance.
                            </p>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <label class="block text-sm text-slate-700 dark:text-slate-300">Tanggal Pengajuan</label>
                        <input type="date" id="invoice_submitted_at"
                            class="form-input w-full" />
                    </div>

                    <div class="flex gap-3 justify-end mt-6">
                        <button type="button" id="submitModalCancel"
                            class="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">
                            Batal
                        </button>
                        <button type="button" id="submitModalConfirm"
                            class="btn bg-success text-white hover:bg-success-600">
                            Ajukan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/pages/highlight.js', 'resources/js/pages/extended-tippy.js', 'resources/js/custom/invoice/pengajuan/index.js'])
@endsection
