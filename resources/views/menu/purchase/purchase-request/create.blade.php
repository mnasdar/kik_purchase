@extends('layouts.vertical', ['title' => 'Tambah Purchase Request ', 'sub_title' => 'Purchase', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite(['node_modules/flatpickr/dist/flatpickr.min.css'])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_box_3_line text-3xl"></i>
                    <span>Tambah Purchase Request</span>
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Form untuk menambahkan purchase request baru
                </p>
            </div>
        </div>
    </div>

    <!-- Form Card -->
    <div class="card">
        <div class="card-header">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Form Purchase Request</h4>
        </div>
        <div class="p-6">
            <form id="form-create-pr" method="POST" action="{{ route('purchase-request.store') }}">
                @csrf

                <!-- PR Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <!-- PR Number (manual, dengan saran default) -->
                    <div>
                        <label for="pr_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            PR Number <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="pr_number" name="pr_number" class="form-input"
                            placeholder="Isi nomor PR unik" />
                        <p id="error-pr_number" class="mt-1 text-sm text-red-600 hidden"></p>
                    </div>

                    <!-- Request Type -->
                    <div>
                        <label for="request_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Request Type <span class="text-red-500">*</span>
                        </label>
                        <select id="request_type" name="request_type" class="form-select" required>
                            <option value="">Pilih Request Type</option>
                            <option value="barang">Barang</option>
                            <option value="jasa">Jasa</option>
                        </select>
                        <p id="error-request_type" class="mt-1 text-sm text-red-600 hidden"></p>
                    </div>

                    <!-- Approved Date -->
                    <div>
                        <label for="approved_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Approved Date <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="approved_date" name="approved_date" class="form-input"
                            placeholder="Pilih tanggal" />
                        <p id="error-approved_date" class="mt-1 text-sm text-red-600 hidden"></p>
                    </div>

                    <!-- Location (otomatis dari user) -->
                    @if($isSuperAdmin)
                        <!-- Super Admin: dapat memilih lokasi -->
                        <div>
                            <label for="location_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location <span class="text-red-500">*</span>
                            </label>
                            <select id="location_id" name="location_id" class="form-select" required>
                                <option value="">Pilih Lokasi</option>
                                @foreach($locations as $location)
                                    <option value="{{ $location->id }}">{{ $location->name }}</option>
                                @endforeach
                            </select>
                            <p id="error-location_id" class="mt-1 text-sm text-red-600 hidden"></p>
                        </div>
                    @else
                        <!-- Regular User: lokasi otomatis dari user -->
                        <div>
                            <label for="location_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="location_name" name="location_name"
                                value="{{ $userLocationName ?? 'Lokasi belum diatur' }}" readonly
                                class="form-input bg-gray-100 dark:bg-gray-700" />
                            <input type="hidden" id="location_id" name="location_id" value="{{ $userLocationId }}" />
                            <p id="error-location_id" class="mt-1 text-sm text-red-600 hidden"></p>
                        </div>
                    @endif

                    <!-- Notes -->
                    <div class="md:col-span-2">
                        <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                        </label>
                        <textarea id="notes" name="notes" rows="3" class="form-input" placeholder="Catatan tambahan (opsional)"></textarea>
                    </div>
                </div>

                <!-- Items Section -->
                <div class="border-t pt-6">
                    <div class="flex justify-between items-center mb-4">
                        <h5 class="text-lg font-semibold text-gray-800 dark:text-white">Items</h5>
                        <button type="button" id="btn-add-item"
                            class="btn btn-sm bg-primary text-white hover:bg-primary-600">
                            <i class="mgc_add_line me-2"></i>
                            Tambah Item
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse" id="items-table">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-800">
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 50px;">#</th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 150px;">
                                        Classification</th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 300px;">Item
                                        Description <span class="text-red-500">*</span></th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 80px;">UOM
                                        <span class="text-red-500">*</span>
                                    </th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 120px;">Unit
                                        Price <span class="text-red-500">*</span></th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 80px;">Qty
                                        <span class="text-red-500">*</span>
                                    </th>
                                    <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 120px;">
                                        Amount</th>
                                        <th class="border px-2 py-2 text-left text-sm font-semibold" style="width: 80px;">Target PR→PO
                                            <span class="text-red-500">*</span>
                                        </th>
                                    <th class="border px-2 py-2 text-center text-sm font-semibold" style="width: 70px;">
                                        Action</th>
                                </tr>
                            </thead>
                            <tbody id="items-container">
                                <!-- Dynamic rows will be added here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="flex justify-end gap-2 mt-6 pt-6 border-t">
                    <a href="{{ route('purchase-request.index') }}" class="btn bg-gray-500 text-white hover:bg-gray-600">
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
    <template id="item-row-template">
        <tr class="item-row">
            <td class="border px-2 py-2 text-center item-number">1</td>
            <td class="border px-2 py-2">
                <input type="text" name="items[0][classification_name]"
                    class="form-input form-input-sm w-full classification-input"
                    placeholder="Ketik atau pilih classification" list="classification-list-0" autocomplete="off" />
                <input type="hidden" name="items[0][classification_id]" class="classification-id" value="" />
                <datalist id="classification-list-0">
                    @foreach ($classifications as $classification)
                        <option value="{{ $classification->name }}" data-id="{{ $classification->id }}">
                            {{ $classification->name }}</option>
                    @endforeach
                </datalist>
            </td>
            <td class="border px-2 py-2">
                <input type="text" name="items[0][item_desc]" required class="form-input form-input-sm w-full"
                    placeholder="Deskripsi item" />
            </td>
            <td class="border px-2 py-2">
                <input type="text" name="items[0][uom]" required class="form-input form-input-sm w-full"
                    placeholder="Unit" style="max-width: 80px;" />
            </td>
            <td class="border px-2 py-2">
                <input type="text" name="items[0][unit_price]" required
                    class="form-input form-input-sm w-full autonumeric-currency" placeholder="0" />
            </td>
            <td class="border px-2 py-2">
                <input type="number" name="items[0][quantity]" required min="1"
                    class="form-input form-input-sm w-full item-quantity" placeholder="0" />
            </td>
            <td class="border px-2 py-2">
                <input type="text" name="items[0][amount]" readonly
                class="form-input form-input-sm w-full bg-gray-100 dark:bg-gray-700 autonumeric-currency"
                placeholder="0" />
            </td>
            <td class="border px-2 py-2">
                <input type="number" name="items[0][sla_pr_to_po_target]" required min="0"
                    class="form-input form-input-sm w-full" placeholder="Target SLA (hari)" style="max-width: 120px;" />
            </td>
            <td class="border px-2 py-2 text-center">
                <button type="button" class="btn-remove-item text-red-500 hover:text-red-700">
                    <i class="mgc_delete_2_line text-xl"></i>
                </button>
            </td>
        </tr>
    </template>
@endsection

@section('script')
    @vite(['resources/js/custom/purchase/purchase-request/pr-create.js'])
@endsection
