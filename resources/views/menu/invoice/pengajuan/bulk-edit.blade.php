@extends('layouts.vertical', ['title' => 'Edit Pengajuan Invoice', 'sub_title' => 'Invoice'])

@section('css')
    @vite(['node_modules/flatpickr/dist/flatpickr.min.css', 'resources/scss/custom/invoice/pengajuan/pengajuan-bulk-edit.scss'])
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
                    Edit Pengajuan Invoice
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
                    Total nilai: <span class="font-bold text-lg">Rp {{ number_format($invoices->sum(fn($inv) => $inv->purchaseOrderOnsite->purchaseOrderItem->unit_price * $inv->purchaseOrderOnsite->purchaseOrderItem->quantity ?? 0), 0, ',', '.') }}</span>
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
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Edit Data Pengajuan</h4>
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

                    <div class="grid grid-cols-1 gap-4">
                        <!-- Tanggal Pengajuan -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                <i class="mgc_calendar_line text-sm mr-1"></i>Tanggal Pengajuan
                            </label>
                            <input type="text"
                                id="bulk_invoice_submitted_at"
                                class="form-input w-full date-picker-field"
                                placeholder="Pilih tanggal pengajuan">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Opsional - Kosongkan jika tidak ingin mengubah</p>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                    <a href="{{ route('pengajuan.index') }}"
                        class="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                        <i class="mgc_arrow_left_line"></i> Batal
                    </a>
                    <button type="submit" class="btn bg-gradient-to-r from-info to-blue-500 text-white hover:shadow-lg hover:-translate-y-1 transition-all">
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
                            <th class="col-invoice"><i class="mgc_receipt_line"></i>Invoice Number</th>
                            <th class="col-po"><i class="mgc_document_line"></i>PO Number</th>
                            <th class="col-pr"><i class="mgc_document_line"></i>PR Number</th>
                            <th class="col-item"><i class="mgc_box_3_line"></i>Item Description</th>
                            <th class="col-unit-price text-right"><i class="mgc_tag_line"></i>Unit Price</th>
                            <th class="col-qty text-center"><i class="mgc_shopping_cart_2_line"></i>Qty</th>
                            <th class="col-amount text-right"><i class="mgc_counter_2_line"></i>Amount</th>
                            <th class="col-date text-center"><i class="mgc_calendar_line"></i>Tgl Diterima</th>
                            <th class="col-date text-center"><i class="mgc_calendar_line"></i>Tgl Pengajuan</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($invoices as $index => $invoice)
                            @php
                                $onsite = $invoice->purchaseOrderOnsite;
                                $item = $onsite->purchaseOrderItem ?? null;
                                $po = $item->purchaseOrder ?? null;
                                $pr = $item->purchaseRequestItem->purchaseRequest ?? null;
                                $prItem = $item->purchaseRequestItem ?? null;
                                $unitPrice = $item->unit_price ?? 0;
                                $qty = $item->quantity ?? 0;
                                $amount = $unitPrice * $qty;
                            @endphp
                            <tr class="invoice-card">
                                <td class="col-no text-center">
                                    <span class="font-semibold text-slate-700 dark:text-slate-300">{{ $index + 1 }}</span>
                                </td>
                                <td class="col-invoice">
                                    <span class="font-semibold text-slate-700 dark:text-slate-300">{{ $invoice->invoice_number ?? '-' }}</span>
                                </td>
                                <td class="col-po">
                                    <span class="font-semibold text-primary">{{ $po->po_number ?? '-' }}</span>
                                </td>
                                <td class="col-pr">
                                    <span class="text-slate-700 dark:text-slate-300">{{ $pr->pr_number ?? '-' }}</span>
                                </td>
                                <td class="col-item">
                                    <span class="text-slate-700 dark:text-slate-300">{{ $prItem->item_desc ?? '-' }}</span>
                                </td>
                                <td class="col-unit-price text-right">
                                    <span class="text-slate-700 dark:text-slate-300">Rp {{ number_format($unitPrice, 0, ',', '.') }}</span>
                                </td>
                                <td class="col-qty text-center">
                                    <span class="font-semibold text-slate-700 dark:text-slate-300">{{ $qty }}</span>
                                </td>
                                <td class="col-amount text-right">
                                    <span class="font-semibold text-green-600 dark:text-green-400">Rp {{ number_format($amount, 0, ',', '.') }}</span>
                                </td>
                                <td class="col-date text-center">
                                    <span class="text-slate-700 dark:text-slate-300">{{ $invoice->invoice_received_at?->format('d-M-y') ?? '-' }}</span>
                                </td>
                                <td class="col-date text-center">
                                    <span class="text-slate-700 dark:text-slate-300">{{ $invoice->invoice_submitted_at?->format('d-M-y') ?? '-' }}</span>
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
    @vite(['resources/js/custom/invoice/pengajuan/pengajuan-bulk-edit.js'])
@endsection
