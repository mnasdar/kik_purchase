@extends('layouts.vertical', ['title' => 'Tambahkan PO', 'sub_title' => ucwords($prefix), 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite([
        // Masukkan disini
        'node_modules/nice-select2/dist/css/nice-select2.css',
        'node_modules/sweetalert2/dist/sweetalert2.min.css',
        'node_modules/tippy.js/dist/tippy.css',
        'node_modules/flatpickr/dist/flatpickr.min.css',
    ])
@endsection

@section('content')
    <form id="form-create" action="{{ route('purchase-order.store',$prefix) }}" method="POST">
        @csrf
        <div class="grid lg:grid-cols-4 gap-6">
            <div class="col-span-1 flex flex-col gap-6">
                <div class="card p-6">
                    <div class="flex justify-between items-center mb-4">
                        <p class="card-title">Select Data</p>
                        <div
                            class="inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 w-9 h-9">
                            <i class="mgc_compass_line"></i>
                        </div>
                    </div>

                    <div class="flex flex-col gap-3">
                        <div class="form-group">
                            <label for="inputStatus" class="mb-2 block">Status</label>
                            <select id="inputStatus" name="status_id" class="search-select">
                                <option value="" disabled selected>Pilih Status</option>
                                @foreach ($status as $item)
                                    <option value="{{ $item->id }}">{{ ucwords($item->name) }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <!-- Error Message -->
                        <p id="error-status_id" class="text-red-500 text-sm mt-1"></p>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-3 space-y-6">
                <div class="card p-6">
                    <div class="flex justify-between items-center mb-4">
                        <p class="card-title">Input Data</p>
                        <div
                            class="inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 w-9 h-9">
                            <i class="mgc_transfer_line"></i>
                        </div>
                    </div>

                    <div class="flex flex-col gap-3">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="form-group">
                                <label for="inputPONumber" class="mb-2 block">PO Number</label>
                                <input type="text" name="po_number" id="inputPONumber" class="form-input"
                                    placeholder="Masukkan PO Number">
                                <!-- Error Message -->
                                <p id="error-po_number" class="text-red-500 text-sm mt-1"></p>
                            </div>

                            <div class="form-group">
                                <label for="inputApproveDate" class="mb-2 block">Approved Date</label>
                                <input type="text" name="approved_date" id="inputApproveDate" class="form-input">
                                <!-- Error Message -->
                                <p id="error-approved_date" class="text-red-500 text-sm mt-1"></p>
                            </div>

                            <div class="form-group">
                                <label for="inputSupplierName" class="mb-2 block">Supplier Name</label>
                                <input type="text" name="supplier_name" id="inputSupplierName" class="form-input"
                                    placeholder="Masukkan Supplier Name">
                                <!-- Error Message -->
                                <p id="error-supplier_name" class="text-red-500 text-sm mt-1"></p>
                            </div>

                            <div class="form-group">
                                <label for="inputQuantity" class="mb-2 block">Quantity</label>
                                <input type="text" name="quantity" id="inputQuantity" class="form-input"
                                    placeholder="Masukkan Quantity"  autocomplete="off">
                                <!-- Error Message -->
                                <p id="error-quantity" class="text-red-500 text-sm mt-1"></p>
                            </div>

                            <div class="form-group">
                                <label for="inputUnitPrice" class="mb-2 block">Unit Price</label>
                                <input type="text" name="unit_price" id="inputUnitPrice" class="form-input"
                                    placeholder="Masukkan Unit Price"  autocomplete="off">
                                <!-- Error Message -->
                                <p id="error-unit_price" class="text-red-500 text-sm mt-1"></p>
                            </div>
                            

                            <div class="form-group">
                                <label for="inputAmount" class="mb-2 block">Amount</label>
                                <input type="text" name="amount" step="1000" id="inputAmount" class="form-input read-only:bg-slate-200 text-slate-600" readonly
                                    placeholder="Masukkan Amount">
                                <!-- Error Message -->
                                <p id="error-amount" class="text-red-500 text-sm mt-1"></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="lg:col-span-4 mt-5">
                    <div class="flex justify-end gap-3">
                        <button type="button" id="btn-cancel" data-url="{{ route('purchase-order.index',$prefix) }}"
                            class="inline-flex items-center rounded-md border border-transparent bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none">
                            Kembali
                        </button>
                        <button type="submit"
                            class="inline-flex items-center rounded-md border border-transparent bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 focus:outline-none disabled:bg-slate-500">
                            <span
                                class="loader hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Simpan</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection

@section('script')
    @vite([
        // Masukkan disini
        'resources/js/pages/highlight.js',
        'resources/js/pages/form-select.js',
        'resources/js/pages/extended-sweetalert.js',
        'resources/js/pages/extended-tippy.js',
        'resources/js/pages/form-flatpickr.js',
        'resources/js/custom/form-create.js',
    ])
@endsection
