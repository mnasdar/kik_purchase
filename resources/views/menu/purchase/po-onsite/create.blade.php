@extends('layouts.vertical', ['title' => 'Tambah PO Onsite', 'sub_title' => 'Purchase', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite([
        'node_modules/flatpickr/dist/flatpickr.min.css',
    ])
    <style>
        /* Hide up/down spinner for number inputs on supported browsers */
        /* Chromium (Chrome, Edge, Opera) */
        input[type=number].no-spinner::-webkit-outer-spin-button,
        input[type=number].no-spinner::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        /* Firefox */
        input[type=number].no-spinner {
            -moz-appearance: textfield;
        }
    </style>
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_add_circle_line"></i>
                    Tambah PO Onsite
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Buat data tracking onsite baru untuk item purchase order
                </p>
            </div>
        </div>
    </div>

    <!-- Form Card -->
    <div class="card">
        <div class="card-header">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Form PO Onsite</h4>
        </div>
        <div class="p-6">
            <form id="form-create-onsite" method="POST" action="{{ route('po-onsite.store') }}">
                @csrf

                <!-- Search PO Section -->
                <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cari PO Number
                    </label>
                    <div class="flex gap-2">
                        <input type="text" id="search-po" 
                            class="form-input flex-1" 
                            placeholder="Masukkan nomor PO..."
                            autocomplete="off">
                        <button type="button" id="btn-search-po" 
                            class="btn bg-primary text-white hover:bg-primary-600">
                            <i class="mgc_search_line"></i>
                            Cari
                        </button>
                    </div>
                </div>

                <!-- Search Results -->
                <div id="search-results" class="mb-6 hidden">
                    <div class="flex items-center justify-between mb-3">
                        <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Hasil Pencarian</h5>
                        <button type="button" id="btn-select-multiple" 
                            class="btn btn-sm bg-primary text-white hover:bg-primary-600 hidden">
                            <i class="mgc_check_circle_line"></i>
                            Pilih yang Dicentang (<span id="selected-count">0</span>)
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-50 dark:bg-slate-800">
                                <tr>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        <input type="checkbox" id="select-all-items" class="form-checkbox rounded text-primary">
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PO Number</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PR Number</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item Name</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">UOM</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                                    
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody id="search-results-body" class="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                                <!-- Results will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Selected Item Info -->
                <div id="selected-item-info" class="mb-6 hidden">
                    <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div class="flex items-center justify-between mb-3">
                            <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <i class="mgc_check_circle_line text-green-600"></i>
                                Item Terpilih (<span id="selected-items-count">0</span> items)
                            </h5>
                            <button type="button" id="btn-clear-selection" 
                                class="btn btn-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300">
                                <i class="mgc_close_line"></i>
                                Clear All
                            </button>
                        </div>
                        
                        <!-- DataTable untuk items yang dipilih -->
                        <div class="overflow-x-auto mt-3">
                            <table id="selected-items-table" class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead class="bg-slate-100 dark:bg-slate-700">
                                    <tr>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">#</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">PO Number</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">PR Number</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Supplier</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Item Desc</th>
                                        <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">UOM</th>
                                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                                        <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                                        <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Approved Date</th>
                                        <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Target PO-&gt;Onsite</th>
                                        <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">SLA PO-&gt;Onsite</th>
                                        <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="selected-items-body" class="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    <!-- Selected items will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Onsite Information -->
                <div id="onsite-form" class="hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <!-- Onsite Date -->
                        <div>
                            <label for="onsite_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tanggal Onsite <span class="text-danger">*</span>
                            </label>
                            <input type="text" id="onsite_date" name="onsite_date" 
                                class="form-input" 
                                placeholder="Pilih tanggal" 
                                required>
                            <div id="error-onsite_date" class="text-danger text-xs mt-1 hidden"></div>
                        </div>

                        
                    </div>

                    <!-- Form Actions -->
                    <div class="flex justify-end gap-2 mt-6 pt-6 border-t">
                        <a href="{{ route('po-onsite.index') }}" 
                            class="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">
                            <i class="mgc_arrow_left_line"></i>
                            Kembali
                        </a>
                        <button type="submit" id="btn-submit" 
                            class="btn bg-success text-white hover:bg-success-600">
                            <i class="mgc_save_line"></i>
                            Simpan Onsite
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/custom/purchase/po-onsite/onsite-create.js'])
@endsection
