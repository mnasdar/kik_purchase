@extends('layouts.vertical', ['title' => 'Tambah Invoice', 'sub_title' => 'Invoice'])

@section('css')
    @vite(['node_modules/flatpickr/dist/flatpickr.min.css'])
    <style>
        /* Enhanced search styling */
        #search-po-table {
            transition: all 0.3s ease;
        }

        #search-po-table:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Table sorting enhancement */
        table thead th {
            transition: background-color 0.2s ease;
        }

        /* Highlight filtered rows */
        table tbody tr.filtered-out {
            opacity: 0.3;
        }

        /* Better hover effect */
        table tbody tr:hover {
            background-color: rgba(59, 130, 246, 0.05);
        }

        .dark table tbody tr:hover {
            background-color: rgba(59, 130, 246, 0.1);
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
                <div class="w-full sm:w-64">
                    <div class="relative">
                        <input type="text" id="search-po-table" class="form-input pl-10 pr-4"
                            placeholder="Cari PO atau PR..." autocomplete="off">
                        <i class="mgc_search_line absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="p-6">
            <!-- Table PO Onsite -->
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-slate-800">
                        <tr>
                            <th
                                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-10">
                                <input type="checkbox" id="select-all-checkbox" class="form-checkbox">
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                PO Number</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                PR Number</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Supplier</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Item Description</th>
                            <th
                                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                                Unit Price</th>
                            <th
                                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                                Qty</th>
                            <th
                                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                                Amount</th>
                            <th
                                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                                Onsite Date</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                        @forelse($onsites as $onsite)
                            @php
                                $item = $onsite->purchaseOrderItem;
                                $po = $item->purchaseOrder ?? null;
                                $pr = $item->purchaseRequestItem->purchaseRequest ?? null;
                                $supplier = $item->purchaseOrder->supplier ?? null;
                            @endphp
                            <tr class="hover:bg-gray-50 dark:hover:bg-slate-800">
                                <td class="px-4 py-3 text-center">
                                    <input type="checkbox" class="form-checkbox row-checkbox"
                                        data-onsite-id="{{ $onsite->id }}" data-row-index="{{ $loop->index }}"
                                        data-po-number="{{ $po->po_number ?? '-' }}"
                                        data-pr-number="{{ $pr->pr_number ?? '-' }}"
                                        data-supplier="{{ $supplier->name ?? '-' }}"
                                        data-item-desc="{{ $item->purchaseRequestItem->item_desc ?? '-' }}"
                                        data-onsite-date="{{ $onsite->onsite_date ? $onsite->onsite_date->format('d-M-y') : '-' }}"
                                        data-unit-price="{{ $item->unit_price ?? 0 }}"
                                        data-quantity="{{ $item->quantity ?? 0 }}" data-amount="{{ $item->amount ?? 0 }}">
                                </td>
                                <td class="px-4 py-3 text-sm font-semibold text-primary">{{ $po->po_number ?? '-' }}</td>
                                <td class="px-4 py-3 text-sm">{{ $pr->pr_number ?? '-' }}</td>
                                <td class="px-4 py-3 text-sm">{{ $supplier->name ?? '-' }}</td>
                                <td class="px-4 py-3 text-sm">{{ $item->purchaseRequestItem->item_desc ?? '-' }}</td>
                                <td class="px-4 py-3 text-sm text-right font-semibold whitespace-nowrap">
                                    {{ number_format($item->unit_price ?? 0, 0, ',', '.') }}</td>
                                <td class="px-4 py-3 text-sm text-center whitespace-nowrap">
                                    {{ number_format($item->quantity ?? 0, 0, ',', '.') }}</td>
                                <td class="px-4 py-3 text-sm text-right font-semibold text-primary whitespace-nowrap">
                                    {{ number_format($item->amount ?? 0, 0, ',', '.') }}</td>
                                <td class="px-4 py-3 text-sm text-center whitespace-nowrap">
                                    {{ $onsite->onsite_date ? $onsite->onsite_date->format('d-M-y') : '-' }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="9" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                    <i class="mgc_inbox_line text-4xl mb-2"></i>
                                    <p>Tidak ada data PO Onsite yang belum memiliki invoice</p>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
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
    @vite(['resources/js/custom/invoice/dari-vendor/dari-vendor-create.js'])
@endsection
