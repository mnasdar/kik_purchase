@extends('layouts.vertical', ['title' => 'Tambah Invoice', 'sub_title' => 'Invoice'])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css', 'node_modules/flatpickr/dist/flatpickr.min.css'])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_add_circle_line"></i>
                    Tambah Invoice dari Vendor
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Buat data invoice baru dari PO yang sudah onsite
                </p>
            </div>
        </div>
    </div>

    <!-- Selection Table Card -->
    <div class="card mb-6" id="selection-card">
        <div class="card-header">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Pilih PO Onsite</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Centang PO Onsite yang akan dibuatkan invoice
                    </p>
                </div>
                <button type="button" id="toggle-table" class="btn bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 flex items-center gap-2">
                    <i class="mgc_minimize_line text-lg"></i>
                    <span>Sembunyikan tabel</span>
                </button>
            </div>
        </div>
        <div id="selection-card-body" class="p-6">
            <!-- GridJS Table -->
            <div id="table-onsites" class="w-full"></div>
        </div>
    </div>

    <!-- Input Form Card (Hidden by default) -->
    <div id="invoice-form-container" class="card hidden">
        <div class="card-header">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Data Invoice</h4>
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Isi informasi invoice untuk PO yang dipilih
            </p>
        </div>
        <div class="p-6">
            <!-- Selected Items Summary -->
            <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                <h5 class="font-semibold text-gray-800 dark:text-white mb-3">Data yang dipilih:</h5>
                <div id="selected-items-summary" class="space-y-2 text-sm">
                    <!-- Dynamic content will be inserted here -->
                </div>
            </div>

            <!-- Invoice Form -->
            <form id="invoice-form" class="space-y-6">
                <div id="form-items-container" class="space-y-6">
                    <!-- Dynamic form items will be inserted here -->
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3 justify-end mt-8">
                    <button type="button" id="btn-cancel" class="btn bg-gray-500 text-white ">
                        <i class="mgc_close_line"></i> Batal
                    </button>
                    <button type="submit" class="btn bg-success text-white">
                        <i class="mgc_check_line"></i> Simpan Invoice
                    </button>
                </div>
            </form>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/pages/highlight.js', 'resources/js/pages/extended-tippy.js', 'resources/js/custom/invoice/dari-vendor/dari-vendor-create.js'])
@endsection
