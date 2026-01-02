@extends('layouts.vertical', ['title' => 'Tambah Pembayaran', 'sub_title' => 'Invoice'])

@section('css')
    @vite(['node_modules/flatpickr/dist/flatpickr.min.css'])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_add_line text-3xl"></i>
                    <span>Tambah Pembayaran</span>
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Form untuk menambahkan pembayaran invoice
                </p>
            </div>
        </div>
    </div>

    <!-- Form Card -->
    <div class="card">
        <div class="card-header">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Form Pembayaran</h4>
        </div>
        <div class="p-6">
            <form id="form-create-pembayaran" method="POST" action="{{ route('pembayaran.store') }}">
                @csrf

                <!-- Payment Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label for="payment_number" class="form-label">Payment Number</label>
                        <input type="text" id="payment_number" name="payment_number" class="form-input" placeholder="Masukkan nomor pembayaran">
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Opsional. Nomor pembayaran untuk semua invoice.</p>
                    </div>
                    <div>
                        <label for="payment_date" class="form-label">Payment Date <span class="text-red-500">*</span></label>
                        <input type="text" id="payment_date" name="payment_date" required class="form-input flatpickr-payment-date" placeholder="Pilih tanggal pembayaran">
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Tanggal pembayaran untuk semua invoice. SLA akan dihitung otomatis.</p>
                    </div>
                </div>

                <!-- Items Section -->
                <div class="border-t pt-6">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-3">
                            <h5 class="text-lg font-semibold text-gray-800 dark:text-white">Invoice untuk Dibayar</h5>
                            <button type="button" id="btn-delete-selected-items"
                                class="btn btn-sm bg-red-500 text-white hover:bg-red-600 hidden">
                                <i class="mgc_delete_2_line me-2"></i>
                                Hapus Terpilih (<span id="selected-items-count">0</span>)
                            </button>
                        </div>
                        <button type="button" id="btn-pick-invoice"
                            class="btn btn-sm bg-primary text-white hover:bg-primary-600">
                            <i class="mgc_search_line me-2"></i>
                            Pilih Invoice
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse" id="pembayaran-items-table">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-800">
                                    <th class="border px-2 py-2 text-center w-10">
                                        <input type="checkbox" id="item-select-all" class="form-checkbox rounded text-primary">
                                    </th>
                                    <th class="border px-2 py-2 text-center w-12">#</th>
                                    <th class="border px-2 py-2 text-left min-w-[150px]">Invoice Number</th>
                                    <th class="border px-2 py-2 text-left min-w-[120px]">PO Number</th>
                                    <th class="border px-2 py-2 text-left min-w-[120px]">PR Number</th>
                                    <th class="border px-2 py-2 text-left min-w-[200px]">Item Description</th>
                                    <th class="border px-2 py-2 text-right min-w-[100px]">Unit Price</th>
                                    <th class="border px-2 py-2 text-center min-w-[60px]">Qty</th>
                                    <th class="border px-2 py-2 text-right min-w-[120px]">Amount</th>
                                    <th class="border px-2 py-2 text-center min-w-[100px]">Invoice Submit</th>
                                    <th class="border px-2 py-2 text-center min-w-[100px]">SLA (Hari Kerja)</th>
                                    <th class="border px-2 py-2 text-center min-w-[80px]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="pembayaran-items-container">
                                <tr class="text-center text-gray-500">
                                    <td colspan="12" class="border px-4 py-8">
                                        <div class="flex flex-col items-center gap-2">
                                            <i class="mgc_inbox_line text-4xl text-gray-400"></i>
                                            <p class="text-sm">Belum ada invoice yang dipilih</p>
                                            <p class="text-xs text-gray-400">Klik tombol "Pilih Invoice" untuk memulai</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="flex justify-end gap-2 mt-6 pt-6 border-t">
                    <a href="{{ route('pembayaran.index') }}" class="btn bg-gray-500 text-white hover:bg-gray-600">
                        <i class="mgc_close_line me-2"></i>
                        Batal
                    </a>
                    <button type="submit" class="btn bg-success text-white hover:bg-success-600">
                        <i class="mgc_check_line me-2"></i>
                        Simpan Pembayaran
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Item Row Template -->
    <template id="pembayaran-item-row-template">
        <tr class="pembayaran-item-row">
            <td class="border px-2 py-2 text-center align-middle">
                <input type="checkbox" class="form-checkbox rounded text-primary item-checkbox">
            </td>
            <td class="border px-2 py-2 text-center align-middle pembayaran-item-number">1</td>
            <td class="border px-2 py-2 text-left align-middle">
                <input type="hidden" name="items[0][invoice_id]" class="pembayaran-invoice-id" />
                <span class="text-sm font-semibold text-blue-600 dark:text-blue-400 pembayaran-invoice-number">-</span>
            </td>
            <td class="border px-2 py-2 text-left align-middle">
                <span class="text-sm pembayaran-po-number">-</span>
            </td>
            <td class="border px-2 py-2 text-left align-middle">
                <span class="text-sm pembayaran-pr-number">-</span>
            </td>
            <td class="border px-2 py-2 text-left align-middle">
                <span class="text-sm pembayaran-item-desc">-</span>
            </td>
            <td class="border px-2 py-2 text-right align-top">
                <span class="text-sm pembayaran-unit-price">-</span>
            </td>
            <td class="border px-2 py-2 text-center align-top">
                <span class="text-sm pembayaran-qty">-</span>
            </td>
            <td class="border px-2 py-2 text-right align-top">
                <span class="text-sm font-semibold pembayaran-amount">-</span>
            </td>
            <td class="border px-2 py-2 text-center align-top">
                <input type="hidden" name="items[0][invoice_submitted_at]" class="pembayaran-submitted-at" />
                <span class="text-sm pembayaran-submitted-date">-</span>
            </td>
            <td class="border px-2 py-2 text-center align-top">
                <input type="hidden" name="items[0][sla_payment]" class="pembayaran-sla-input" />
                <span class="text-sm font-semibold text-blue-600 dark:text-blue-400 pembayaran-sla-display">-</span>
            </td>
            <td class="border px-2 py-2 text-center align-top">
                <button type="button" class="pembayaran-btn-remove-item text-red-500 hover:text-red-700">
                    <i class="mgc_delete_2_line text-xl"></i>
                </button>
            </td>
        </tr>
    </template>

    <!-- Modal: Pilih Invoice -->
    <div id="modal-pick-invoice" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative mx-auto mt-12 max-w-6xl rounded-lg bg-white dark:bg-slate-800 shadow-xl">
            <div class="flex items-center justify-between border-b px-5 py-3">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Pilih Invoice untuk Pembayaran</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Pilih invoice yang sudah diajukan dan belum dibayar</p>
                </div>
                <button type="button" id="btn-close-invoice-modal"
                    class="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                    <i class="mgc_close_line text-xl"></i>
                </button>
            </div>
            <div class="p-5">
                <!-- Search Input -->
                <div class="mb-4">
                    <input type="text" id="invoice-search-input" placeholder="Cari Invoice Number, PO, atau PR..."
                        class="w-full form-input" />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Menampilkan <span id="invoice-count">0</span> dari <span id="invoice-total">0</span> invoice
                    </p>
                </div>

                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-slate-700/60">
                            <tr>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Invoice Number</th>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">PO Number</th>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">PR Number</th>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Item</th>
                                <th class="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Unit Price</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-200">Qty</th>
                                <th class="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-200">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="invoice-list-body"></tbody>
                    </table>
                </div>

                <!-- Pagination Controls -->
                <div class="mt-4 flex items-center justify-between">
                    <div class="flex gap-2">
                        <button type="button" id="btn-invoice-prev"
                            class="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            disabled>
                            <i class="mgc_arrow_left_line mr-1"></i>Sebelumnya
                        </button>
                        <button type="button" id="btn-invoice-next"
                            class="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
                            Berikutnya<i class="mgc_arrow_right_line ml-1"></i>
                        </button>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        Halaman <span id="invoice-current-page">1</span> dari <span id="invoice-total-pages">1</span> | Per halaman:
                        <span id="invoice-per-page">10</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/custom/invoice/pembayaran/index.js'])
@endsection
