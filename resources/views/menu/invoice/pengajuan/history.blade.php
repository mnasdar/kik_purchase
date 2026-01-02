@extends('layouts.vertical', ['title' => 'Riwayat Pengajuan Invoice', 'sub_title' => 'Invoice'])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css','node_modules/tippy.js/dist/tippy.css'])
@endsection

@section('content')
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_history_line"></i>
                    Riwayat Pengajuan Invoice
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Daftar invoice yang sudah diajukan ke finance dalam 30 hari terakhir
                </p>
            </div>
        </div>
    </div>

    <!-- Tabel utama -->
    <div class="card">
        <div class="card-header">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Daftar Invoice Sudah Diajukan</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Data invoice yang sudah diajukan ke finance dalam 30 hari terakhir
                    </p>
                </div>
                <div class="flex gap-2">
                    <a href="{{ route('pengajuan.index') }}"
                        class="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                        <i class="mgc_arrow_left_line"></i> Kembali
                    </a>
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
                </div>
            </div>
        </div>
        <div class="p-6">
            <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">
                Showing <span id="data-count">0</span> invoice records.
            </p>
            <div class="overflow-x-auto -mx-6 px-6">
                <div id="table-history" class="w-full"></div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/pages/highlight.js', 'resources/js/pages/extended-tippy.js', 'resources/js/custom/invoice/pengajuan/history-index.js'])
@endsection
