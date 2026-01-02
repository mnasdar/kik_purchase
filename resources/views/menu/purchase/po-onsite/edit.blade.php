@extends('layouts.vertical', ['title' => 'Edit PO Onsite', 'sub_title' => 'Purchase', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite([
        'node_modules/flatpickr/dist/flatpickr.min.css',
    ])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_edit_line"></i>
                    Edit PO Onsite
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Edit data tracking onsite untuk item purchase order
                </p>
            </div>
        </div>
    </div>

    <!-- Form Card -->
    <div class="card">
        <div class="card-header">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Form Edit PO Onsite</h4>
        </div>
        <div class="p-6">
            <form id="form-edit-onsite" data-onsite-id="{{ $po_onsite->id }}" method="POST" 
                action="{{ route('po-onsite.update', ['po_onsite' => $po_onsite->id]) }}">
                @csrf
                @method('PUT')

                <!-- Item Info (Read Only) -->
                <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <i class="mgc_information_line text-blue-600"></i>
                        Informasi Item
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">PO Number:</span>
                            <span class="font-semibold ml-2">{{ $po_onsite->purchaseOrderItem->purchaseOrder->po_number }}</span>
                        </div>
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">PR Number:</span>
                            <span class="font-semibold ml-2">{{ $po_onsite->purchaseOrderItem->purchaseRequestItem->purchaseRequest->pr_number ?? '-' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">Item Name:</span>
                            <span class="font-semibold ml-2">{{ $po_onsite->purchaseOrderItem->purchaseRequestItem->item_name ?? '-' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">Quantity:</span>
                            <span class="font-semibold ml-2">{{ number_format($po_onsite->purchaseOrderItem->quantity, 0, ',', '.') }} {{ $po_onsite->purchaseOrderItem->purchaseRequestItem->unit ?? '' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">PO Approved Date:</span>
                            <span class="font-semibold ml-2" id="po-approved-date" 
                                data-date="{{ $po_onsite->purchaseOrderItem->purchaseOrder->approved_date }}">
                                {{ $po_onsite->purchaseOrderItem->purchaseOrder->approved_date ? \Carbon\Carbon::parse($po_onsite->purchaseOrderItem->purchaseOrder->approved_date)->format('d-M-y') : '-' }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Onsite Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <!-- Onsite Date -->
                    <div>
                        <label for="onsite_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tanggal Onsite <span class="text-danger">*</span>
                        </label>
                        <input type="text" id="onsite_date" name="onsite_date" 
                            class="form-input" 
                            value="{{ \Carbon\Carbon::parse($po_onsite->onsite_date)->format('d-M-y') }}"
                            data-date="{{ $po_onsite->onsite_date }}"
                            placeholder="Pilih tanggal" 
                            required>
                        <div id="error-onsite_date" class="text-danger text-xs mt-1 hidden"></div>
                    </div>

                    <!-- SLA Target -->
                    <div>
                        <label for="sla_target" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            SLA Target (hari)
                        </label>
                        <input type="number" id="sla_target" name="sla_target" 
                            class="form-input" 
                            value="{{ $po_onsite->sla_target }}"
                            placeholder="Masukkan SLA target" 
                            min="0">
                        <div id="error-sla_target" class="text-danger text-xs mt-1 hidden"></div>
                    </div>

                    <!-- SLA Realization -->
                    <div>
                        <label for="sla_realization" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            SLA Realisasi (hari)
                        </label>
                        <input type="number" id="sla_realization" name="sla_realization" 
                            class="form-input" 
                            value="{{ $po_onsite->sla_realization }}"
                            placeholder="Otomatis dihitung" 
                            min="0"
                            readonly>
                        <div id="error-sla_realization" class="text-danger text-xs mt-1 hidden"></div>
                        <p class="text-xs text-slate-500 mt-1">Dihitung otomatis dari PO Approved Date ke Onsite Date</p>
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
                        Update Onsite
                    </button>
                </div>
            </form>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/custom/purchase/po-onsite/onsite-update.js'])
@endsection
