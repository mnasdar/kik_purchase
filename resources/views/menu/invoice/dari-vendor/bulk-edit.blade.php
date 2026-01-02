@extends('layouts.vertical', ['title' => 'Edit Invoice', 'sub_title' => 'Invoice'])

@section('css')
    @vite(['node_modules/flatpickr/dist/flatpickr.min.css', 'resources/scss/custom/invoice/dari-vendor/dari-vendor-bulk-edit.scss'])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-info/20">
                        <i class="mgc_edit_line text-2xl text-info"></i>
                    </div>
                    Edit Multiple Invoice
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2">
                    <i class="mgc_information_line"></i>
                    Anda akan mengedit <span class="font-semibold text-info">{{ count($invoices) }} invoice</span> sekaligus
                </p>
            </div>
        </div>
    </div>

    <!-- Summary Box -->
    <div class="summary-box mb-8">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-2">
                    <i class="mgc_check_circle_2_line text-green-600 text-xl"></i>
                    Invoice yang Dipilih
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                    Total nilai: <span class="font-bold text-lg">Rp {{ number_format($invoices->sum(fn($inv) => $inv->purchaseOrderOnsite->purchaseOrderItem->amount ?? 0), 0, ',', '.') }}</span>
                </p>
            </div>
            <div class="text-center">
                <div class="text-4xl font-bold text-green-600">{{ count($invoices) }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Invoice</div>
            </div>
        </div>
    </div>

    <!-- Single Edit Form -->
    <div class="card mb-6">
        <div class="card-header bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-info/20">
                    <i class="mgc_edit_line text-info text-lg"></i>
                </div>
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Edit Data Invoice</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Data ini akan diterapkan ke semua {{ count($invoices) }} invoice yang dipilih</p>
                </div>
            </div>
        </div>
        <div class="p-6">
            <form id="bulk-edit-form">
                <input type="hidden" name="ids" value="{{ implode(',', $ids) }}">

                <div class="form-section">
                    <div class="flex items-center gap-2 mb-5">
                        <div class="step-number">✎</div>
                        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Isi Data Yang Akan Diterapkan Ke Semua Invoice</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Invoice Number -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                <i class="mgc_receipt_line text-sm mr-1"></i>Nomor Invoice
                            </label>
                            <input type="text"
                                id="bulk_invoice_number"
                                name="invoice_number"
                                class="form-input bg-white text-sm"
                                placeholder="Kosongkan jika tidak ingin mengubah">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Opsional - Kosongkan jika tidak ingin mengubah</p>
                        </div>

                        <!-- Tanggal Diterima -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                <i class="mgc_calendar_today_line text-sm mr-1"></i>Tanggal Diterima <span class="text-red-500">*</span>
                            </label>
                            <input type="text"
                                id="bulk_invoice_received_at"
                                name="invoice_received_at"
                                class="form-input date-picker-field bg-white text-sm"
                                placeholder="Pilih tanggal"
                                required>
                        </div>

                        <!-- SLA Target -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                <i class="mgc_time_line text-sm mr-1"></i>Target SLA (Hari) <span class="text-red-500">*</span>
                            </label>
                            <input type="number"
                                id="bulk_sla_target"
                                name="sla_target"
                                class="form-input bg-white text-sm"
                                min="1"
                                max="365"
                                placeholder="Jumlah hari"
                                required>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                    <a href="{{ route('dari-vendor.index') }}"
                        class="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                        <i class="mgc_arrow_left_line"></i> Batal
                    </a>
                    <button type="submit" class="btn bg-gradient-to-r from-success to-emerald-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all">
                        <i class="mgc_check_double_line"></i> Update {{ count($invoices) }} Invoice
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Invoice List Card -->
    <div class="card mb-6">
        <div class="card-header bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700">
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-500/20">
                    <i class="mgc_list_check_line text-slate-600 dark:text-slate-300 text-lg"></i>
                </div>
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Daftar Invoice Yang Akan Diedit</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Berikut adalah {{ count($invoices) }} invoice yang akan diupdate</p>
                </div>
            </div>
        </div>
        <div class="p-6">
            <!-- Invoice Table -->
            <div class="invoice-table-wrapper">
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th class="col-no text-center"><i class="mgc_hashtag_line"></i></th>
                            <th class="col-supplier"><i class="mgc_building_2_line"></i>Supplier</th>
                            <th class="col-item"><i class="mgc_box_3_line"></i>Item Description</th>
                            <th class="col-unit-price text-right"><i class="mgc_tag_line"></i>Unit Price</th>
                            <th class="col-qty text-center"><i class="mgc_shopping_cart_2_line"></i>Qty</th>
                            <th class="col-amount text-right"><i class="mgc_counter_2_line"></i>Amount</th>
                            <th class="col-amount text-right"><i class="mgc_calendar_add_line"></i>Tanggal Diterima</th>
                            <th class="col-sla text-center"><i class="mgc_time_line"></i>SLA Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($invoices as $index => $invoice)
                            @php
                                $onsite = $invoice->purchaseOrderOnsite;
                                $item = $onsite->purchaseOrderItem ?? null;
                                $po = $item->purchaseOrder ?? null;
                                $pr = $item->purchaseRequestItem->purchaseRequest ?? null;
                                $supplier = $po->supplier ?? null;
                            @endphp
                            <tr class="invoice-card">
                                <td class="text-center">
                                    <span class="badge-number">{{ $index + 1 }}</span>
                                </td>
                                <td class="font-semibold">
                                    {{ $supplier->name ?? '-' }}
                                    <div class="text-muted">
                                        {{ $invoice->invoice_number ?? '-' }}
                                    </div>
                                </td>
                                <td>
                                    {{ $item->purchaseRequestItem->item_desc ?? '-' }}
                                    <div class="text-muted">
                                        {{ $po->po_number ?? '-' }} • {{ $pr->pr_number ?? '-' }}
                                    </div>
                                </td>
                                <td class="text-right">
                                    <span class="price-tag">{{ number_format($item->unit_price ?? 0, 0, ',', '.') }}</span>
                                </td>
                                <td class="text-center font-semibold">
                                    {{ number_format($item->quantity ?? 0, 0, ',', '.') }}
                                </td>
                                <td class="text-right">
                                    <span class="amount-tag">{{ number_format($item->amount ?? 0, 0, ',', '.') }}</span>
                                </td>
                                 <td class="text-center font-semibold">
                                    {{ $invoice->invoice_received_at->format('d-M-y') ?? '-' }}
                                </td>
                                <td class="text-center">
                                    <span class="sla-badge">
                                        <i class="mgc_time_line"></i>
                                        {{ $invoice->sla_invoice_to_finance_target }} hari
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Info Box -->
    <div class="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div class="p-4 flex gap-3">
            <div class="flex-shrink-0">
                <i class="mgc_lightbulb_line text-2xl text-blue-600 dark:text-blue-400"></i>
            </div>
            <div>
                <h4 class="font-semibold text-blue-900 dark:text-blue-200">Tips</h4>
                <p class="text-sm text-blue-800 dark:text-blue-300 mt-1">
                    Data yang Anda masukkan di form edit akan diterapkan ke <strong>semua {{ count($invoices) }} invoice</strong> yang dipilih sekaligus. Pastikan data sudah benar sebelum mengklik tombol Update.
                </p>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/custom/invoice/dari-vendor/dari-vendor-bulk-edit.js'])
@endsection
