@extends('layouts.vertical', ['title' => 'Tambah Purchase Order', 'sub_title' => 'Purchase', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite([
        // CSS dependencies
        'node_modules/flatpickr/dist/flatpickr.min.css',
        'node_modules/nice-select2/dist/css/nice-select2.css',
    ])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_box_3_line text-3xl"></i>
                    <span>Tambah Purchase Order</span>
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Form untuk menambahkan purchase order baru
                </p>
            </div>
        </div>
    </div>

    <!-- Form Card -->
    <div class="card">
        <div class="card-header">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Form Purchase Order</h4>
        </div>
        <div class="p-6">
            <form id="form-create-po" method="POST" action="{{ route('purchase-order.store') }}">
                @csrf

                <!-- PO Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <!-- PO Number (manual) -->
                    <div>
                        <label for="po_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            PO Number <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="po_number" name="po_number" class="form-input"
                            placeholder="Isi nomor PO unik" />
                        <p id="error-po_number" class="mt-1 text-sm text-red-600 hidden"></p>
                    </div>

                    <!-- Request Type -->
                    <div>
                        <label for="request_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Type <span class="text-red-500">*</span>
                        </label>
                        <select id="request_type" name="request_type" class="form-select disabled:bg-gray-200" required>
                            <option value="">Pilih Type</option>
                            <option value="barang">Barang</option>
                            <option value="jasa">Jasa</option>
                        </select>
                        <p id="error-request_type" class="mt-1 text-sm text-red-600 hidden"></p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <i class="mgc_information_line"></i>
                            Pilih tipe untuk mengaktifkan tombol "Ambil Data PR"
                        </p>
                    </div>

                    <!-- Supplier -->
                    <div>
                        <label for="supplier_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Supplier <span class="text-red-500">*</span>
                        </label>
                        <select id="supplier_id" name="supplier_id" class="block">
                            <option value="">- Pilih Supplier -</option>
                            @foreach ($supplier as $sup)
                                <option value="{{ $sup->id }}">{{ $sup->name }}</option>
                            @endforeach
                        </select>
                        <p id="error-supplier_id" class="mt-1 text-sm text-red-600 hidden"></p>
                    </div>

                    <!-- Notes -->
                    <div>
                        <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                        </label>
                        <textarea id="notes" name="notes" rows="3" class="form-input" placeholder="Catatan tambahan (opsional)"></textarea>
                    </div>

                    <!-- Approved Date -->
                    <div id="approved-date-container" class="hidden">
                        <label for="approved_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Approved Date <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="approved_date" name="approved_date" required class="form-input"
                            placeholder="Pilih tanggal" />
                        <p id="error-approved_date" class="mt-1 text-sm text-red-600 hidden"></p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <i class="mgc_information_line"></i>
                            Field ini muncul setelah Anda memuat data PR
                        </p>
                    </div>


                </div>

                <!-- Items Section -->
                <div class="border-t pt-6">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-3">
                            <h5 class="text-lg font-semibold text-gray-800 dark:text-white">Items</h5>
                            <button type="button" id="btn-delete-selected-items"
                                class="btn btn-sm bg-red-500 text-white hover:bg-red-600 hidden">
                                <i class="mgc_delete_2_line me-2"></i>
                                Hapus Terpilih (<span id="selected-items-count">0</span>)
                            </button>
                        </div>
                        <button type="button" id="btn-pick-pr"
                            class="btn btn-sm bg-primary text-white hover:bg-primary-600 disabled:bg-gray-400 " disabled>
                            <i class="mgc_search_line me-2"></i>
                            Ambil Data PR
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse" id="po-items-table">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-800">
                                    <th class="border px-2 py-2 text-center text-sm font-semibold" style="width: 40px;">
                                        <input type="checkbox" id="item-select-all"
                                            class="form-checkbox rounded text-primary">
                                    </th>
                                    <th class="border px-2 py-2 text-center text-sm font-semibold" style="width:40px;">#
                                    </th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 120px;">PR
                                        Number</th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 80px;">PR
                                        Date</th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 200px;">Item
                                        Description</th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 90px;">UOM
                                    </th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 120px;">Unit
                                        Price <span class="text-red-500">*</span></th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 80px;">Qty
                                        <span class="text-red-500">*</span>
                                    </th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 120px;">
                                        Amount</th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 100px;">SLA PR->PO</th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 100px;">Target
                                        PO-> Onsite <span class="text-red-500">*</span></th>
                                    <th class="border px-2 py-2 text-center text-sm font-semibold" style="width: 70px;">
                                        Action</th>
                                </tr>
                            </thead>
                            <tbody id="po-items-container">
                                <tr class="text-center text-gray-500">
                                    <td colspan="12" class="py-8">
                                        <i class="mgc_inbox_line text-3xl mb-2"></i>
                                        <p class="font-semibold">Klik "Ambil Data PR" untuk memuat items dari Purchase
                                            Request</p>
                                        <p class="text-sm mt-1 text-amber-600 dark:text-amber-400">⚠️ Items harus diambil
                                            dari PR (minimal 1 item)</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="flex justify-end gap-2 mt-6 pt-6 border-t">
                    <a href="{{ route('purchase-order.index') }}" class="btn bg-gray-500 text-white hover:bg-gray-600">
                        <i class="mgc_close_line me-2"></i>
                        Batal
                    </a>
                    <button type="submit" class="btn bg-success text-white hover:bg-success-600">
                        <i class="mgc_check_line me-2"></i>
                        Simpan
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Item Row Template -->
    <template id="po-item-row-template">
        <tr class="po-item-row">
            <td class="border px-2 py-2 text-center align-top mt-2">
                <input type="checkbox" class="form-checkbox rounded text-primary item-checkbox">
            </td>
            <td class="border px-2 py-2 text-center align-top mt-2 po-item-number">1</td>
            <td class="border px-2 py-2 text-left align-top mt-2">
                <input type="hidden" name="items[0][pr_number]" class="po-pr-number" />
                <input type="hidden" class="po-pr-approved-date" data-pr-approved-date="" />
                <div class="flex flex-col items-left gap-1">
                    <span class="po-pr-number-display text-sm font-semibold text-blue-600 dark:text-blue-400">-</span>
                </div>
            </td>
            <td class="border px-2 py-2 text-left align-top mt-2">
                <div class="text-xs text-gray-500">
                    <span class="po-pr-approved-date-display text-sm ">-</span>
                </div>
            </td>
            <td class="border px-2 py-2 align-top mt-2">
                <input type="hidden" name="items[0][purchase_request_item_id]" class="po-pr-item-id" />
                <div class="flex flex-col gap-1">
                    <input type="text" class="form-input form-input-sm w-full bg-gray-100 dark:bg-gray-700 po-pr-desc"
                        placeholder="Pilih dari PR" readonly />
                </div>
            </td>
            <td class="border px-2 py-2 align-top mt-2">
                <div class="flex flex-col gap-1">
                    <input type="text" class="form-input form-input-sm w-full bg-gray-100 dark:bg-gray-700 po-pr-uom"
                        placeholder="-" readonly />
                </div>
            </td>
            <td class="border px-2 py-2 align-top mt-2">
                <div class="flex flex-col gap-1">
                    <input type="text" name="items[0][unit_price]" required
                        class="form-input form-input-sm w-full autonumeric-currency" placeholder="0" />
                    <div class="text-xs text-gray-500">
                        PR Unit Price: <span class="po-pr-unit-price-display">-</span>
                    </div>
                </div>
            </td>
            <td class="border px-2 py-2 align-top mt-2">
                <div class="flex flex-col gap-1">
                    <div class="relative flex">
                        <input type="number" name="items[0][quantity]" required min="1"
                            class="form-input form-input-sm w-full po-item-quantity" placeholder="0" />
                    </div>
                    <div class="text-xs text-gray-500">
                        PR Qty: <span class="po-pr-qty-display">-</span>
                    </div>
                </div>
            </td>
            <td class="border px-2 py-2 align-top mt-2">
                <input type="hidden" name="items[0][pr_amount]" class="po-pr-amount" />
                <div class="flex flex-col gap-1">
                    <input type="text" name="items[0][amount]" readonly
                        class="form-input form-input-sm w-full bg-gray-100 dark:bg-gray-700 autonumeric-currency"
                        placeholder="0" />
                    <div class="text-xs text-gray-500">
                        PR Amount: <span class="po-pr-amount-display">-</span>
                    </div>
                </div>
            </td>
            <td class="border px-2 py-2 align-top mt-2">
                <div class="flex flex-col gap-1">
                    <input type="text" name="items[0][sla_pr_to_po_realization]" readonly
                        class="form-input form-input-sm w-full bg-gray-100 dark:bg-gray-700" placeholder="0" />
                </div>
            </td>
            <td class="border px-2 py-2 align-top mt-2">
                <div class="flex flex-col gap-1">
                    <input type="number" name="items[0][sla_po_to_onsite_target]" required
                        class="form-input form-input-sm w-full" placeholder="0" />
                </div>
            </td>
            <td class="border px-2 py-2 text-center align-top mt-2">
                <button type="button" class="po-btn-remove-item text-red-500 hover:text-red-700">
                    <i class="mgc_delete_2_line text-xl"></i>
                </button>
            </td>
        </tr>
    </template>

    <!-- Modal: Ambil PR -->
    <div id="modal-pick-pr" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative mx-auto mt-12 max-w-4xl rounded-lg bg-white dark:bg-slate-800 shadow-xl">
            <div class="flex items-center justify-between border-b px-5 py-3">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Pilih Purchase Request</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Pilih PR untuk mengisi items PO secara otomatis
                        (Hanya PR dengan item yang belum terhubung)</p>
                </div>
                <button type="button" id="btn-close-pr-modal"
                    class="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                    <i class="mgc_close_line text-xl"></i>
                </button>
            </div>
            <div class="p-5">
                <!-- Search Input -->
                <div class="mb-4">
                    <input type="text" id="pr-search-input" placeholder="Cari PR Number atau Location..."
                        class="w-full form-input" />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Menampilkan <span id="pr-count">0</span> dari <span id="pr-total">0</span> PR
                    </p>
                </div>

                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-slate-700/60">
                            <tr>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">PR Number
                                </th>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Type
                                </th>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Location
                                </th>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Approved
                                    Date</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-200">Unlinked
                                    Items</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-200"
                                    style="width:120px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="pr-list-body"></tbody>
                    </table>
                </div>

                <!-- Pagination Controls -->
                <div class="mt-4 flex items-center justify-between">
                    <div class="flex gap-2">
                        <button type="button" id="btn-pr-prev"
                            class="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            disabled>
                            <i class="mgc_arrow_left_line mr-1"></i>Sebelumnya
                        </button>
                        <button type="button" id="btn-pr-next"
                            class="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
                            Berikutnya<i class="mgc_arrow_right_line ml-1"></i>
                        </button>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        Halaman <span id="pr-current-page">1</span> dari <span id="pr-total-pages">1</span> | Per halaman:
                        <span id="pr-per-page">10</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite([
        // JS dependencies
        'resources/js/custom/purchase/purchase-order/po-create.js',
    ])
@endsection
