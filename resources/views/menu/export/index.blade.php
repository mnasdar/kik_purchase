@extends('layouts.vertical', ['title' => 'Export Data', 'sub_title' => 'Export Purchasing Data'])

@section('css')
    @vite(['node_modules/flatpickr/dist/flatpickr.min.css'])
@endsection

@section('content')
    <!-- Loading Overlay -->
    <div id="export-loading-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
            <div class="flex flex-col items-center">
                <div class="mb-4">
                    <div class="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-primary animate-spin"></div>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Sedang Memproses Export</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Mohon tunggu, data sedang dipersiapkan dan akan segera diunduh...
                </p>
                <div class="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                    <div class="bg-primary h-full animate-pulse w-full"></div>
                </div>
            </div>
        </div>
    </div>

    <div class="flex flex-col gap-6">
        <!-- Export Card -->
        <div class="card">
            <div class="card-header">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Export Data Purchasing</h4>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Export seluruh rangkaian data dari Purchase Request hingga Payment ke Excel
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="mgc_file_export_line text-3xl text-primary"></i>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <form id="form-export" class="space-y-6">
                    @csrf
                    
                    <!-- Filter Type & Location Selection -->
                    <div class="flex flex-wrap gap-4 items-start">
                        <!-- Filter Type Selection -->
                        <div class="flex-shrink-0">
                            <label for="filter_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Filter Berdasarkan <span class="text-red-500">*</span>
                            </label>
                            <select id="filter_type" 
                                name="filter_type"
                                class="text-sm selectize">
                                <option value="pr">PR Approved Date</option>
                                <option value="po">PO Approved Date</option>
                            </select>
                        </div>

                        <!-- Location Filter -->
                        <div class="flex-shrink-0">
                            <label for="export_location" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Lokasi <span class="text-red-500">*</span>
                            </label>
                            <select id="export_location" 
                                name="location_id"
                                class="text-sm selectize"
                                @if(!auth()->user()->hasRole('Super Admin')) disabled @endif>
                                @if(auth()->user()->hasRole('Super Admin'))
                                    <option value="">Semua Lokasi</option>
                                @endif
                                @foreach($locations as $location)
                                    <option value="{{ $location->id }}" @if(!auth()->user()->hasRole('Super Admin') && auth()->user()->location_id == $location->id) selected @endif>{{ $location->name }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 -mt-3">Pilih filter berdasarkan dan lokasi untuk data yang akan di-export</p>

                    <!-- Date Range Selection -->
                    <div>
                        <label for="date_range" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rentang Tanggal <span class="text-red-500">*</span>
                        </label>
                        <div class="flex gap-3 items-center max-w-md">
                            <input type="text" 
                                id="date_range" 
                                name="date_range"
                                class="form-input flex-1" 
                                placeholder="Pilih rentang tanggal"
                                readonly>
                            <button type="button" id="clear-date-range" class="btn btn-ghost-secondary px-3" title="Hapus pilihan tanggal">
                                <i class="mgc_close_line"></i>
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Pilih rentang tanggal untuk data yang akan di-export</p>
                        <!-- Hidden inputs for form submission -->
                        <input type="hidden" id="start_date" name="start_date">
                        <input type="hidden" id="end_date" name="end_date">
                    </div>

                    <!-- Quick Date Filters -->
                    <div class="border-t pt-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Filter Cepat
                        </label>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" data-period="today" class="btn-quick-filter btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
                                <i class="mgc_calendar_line"></i> Hari Ini
                            </button>
                            <button type="button" data-period="yesterday" class="btn-quick-filter btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
                                <i class="mgc_calendar_line"></i> Kemarin
                            </button>
                            <button type="button" data-period="this-week" class="btn-quick-filter btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
                                <i class="mgc_calendar_line"></i> Minggu Ini
                            </button>
                            <button type="button" data-period="last-week" class="btn-quick-filter btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
                                <i class="mgc_calendar_line"></i> Minggu Lalu
                            </button>
                            <button type="button" data-period="this-month" class="btn-quick-filter btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
                                <i class="mgc_calendar_line"></i> Bulan Ini
                            </button>
                            <button type="button" data-period="last-month" class="btn-quick-filter btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
                                <i class="mgc_calendar_line"></i> Bulan Lalu
                            </button>
                            <button type="button" data-period="last-30-days" class="btn-quick-filter btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
                                <i class="mgc_calendar_line"></i> 30 Hari Terakhir
                            </button>
                            <button type="button" data-period="this-year" class="btn-quick-filter btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
                                <i class="mgc_calendar_line"></i> Tahun Ini
                            </button>
                        </div>
                    </div>

                    <!-- Export Button -->
                    <div class="flex items-center justify-end gap-3 pt-4 border-t">
                        <button type="button" id="btn-reset" class="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300">
                            <i class="mgc_refresh_1_line"></i> Reset
                        </button>
                        <button type="submit" id="btn-export" class="btn bg-success text-white hover:bg-success-600">
                            <i class="mgc_file_export_line"></i> Export ke Excel
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Info Card -->
        <div class="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div class="p-6">
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                        <i class="mgc_information_line text-3xl text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div class="flex-1">
                        <h5 class="text-base font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Informasi Export Data
                        </h5>
                        <div class="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                            <p><strong>Data yang akan di-export mencakup:</strong></p>
                            <ul class="list-disc list-inside ml-2 space-y-1">
                                <li>Purchase Request (PR) - Nomor PR, Tanggal, Lokasi, Item Detail</li>
                                <li>Purchase Order (PO) - Nomor PO, Tanggal, Supplier, Harga, Cost Saving</li>
                                <li>PO Onsite - Tanggal Onsite, SLA PO to Onsite</li>
                                <li>Invoice - Nomor Invoice, Tanggal Terima & Submit, SLA</li>
                                <li>Payment - Nomor Pembayaran, Tanggal Bayar, SLA Payment</li>
                            </ul>
                            <p class="mt-3"><strong>Catatan:</strong></p>
                            <ul class="list-disc list-inside ml-2">
                                <li>File akan diunduh dalam format Excel (.xlsx)</li>
                                <li>Data difilter berdasarkan lokasi user yang login</li>
                                <li>Periode maksimal yang disarankan: 1 tahun</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics Preview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="card">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                        <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <i class="mgc_file_new_line text-2xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">Excel</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Format Export</p>
                </div>
            </div>

            <div class="card">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                        <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <i class="mgc_checkbox_line text-2xl text-green-600 dark:text-green-400"></i>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">Lengkap</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">PR hingga Payment</p>
                </div>
            </div>

            <div class="card">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                        <div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <i class="mgc_filter_line text-2xl text-purple-600 dark:text-purple-400"></i>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">Filter</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">By Date Range</p>
                </div>
            </div>

            <div class="card">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                        <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <i class="mgc_location_line text-2xl text-amber-600 dark:text-amber-400"></i>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">Location</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Filtered by User</p>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/pages/form-flatpickr.js','resources/js/pages/form-select.js', 'resources/js/custom/export/index.js'])
@endsection
