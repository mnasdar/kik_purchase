@extends('layouts.app')

@section('title', 'Edit Pembayaran')
@section('description', 'Edit data pembayaran')

@section('css')
    @vite(['node_modules/flatpickr/dist/flatpickr.min.css'])
@endsection

@section('content')
<div class="container max-w-2xl mx-auto px-4 py-6">
    <div class="mb-6">
        <a href="/pembayaran" class="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Kembali
        </a>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <h1 class="text-2xl font-bold mb-6 text-gray-800">Edit Pembayaran</h1>

        <form id="pembayaranForm" action="/pembayaran/{{ $pembayaran->id }}" method="POST" class="space-y-6">
            @csrf
            @method('PUT')

            <!-- Invoice Selection (Read-only) -->
            <div>
                <label for="invoice_id" class="block text-sm font-medium text-gray-700 mb-2">
                    Invoice
                </label>
                <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" 
                       value="{{ $pembayaran->invoice->invoice_number ?? '-' }}" disabled>
                <input type="hidden" id="invoice_id" name="invoice_id" value="{{ $pembayaran->invoice_id }}">
                <p class="text-xs text-gray-500 mt-1">Invoice tidak dapat diubah</p>
            </div>

            <!-- Payment Number -->
            <div>
                <label for="payment_number" class="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Pembayaran
                </label>
                <input type="text" id="payment_number" name="payment_number" 
                       value="{{ old('payment_number', $pembayaran->payment_number) }}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="Misal: PAY-001">
                @error('payment_number')
                    <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- Payment Date -->
            <div>
                <label for="payment_date" class="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Pembayaran <span class="text-red-500">*</span>
                </label>
                <input type="date" id="payment_date" name="payment_date" required
                       value="{{ old('payment_date', $pembayaran->payment_date->format('Y-m-d')) }}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                @error('payment_date')
                    <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- SLA Payment -->
            <div>
                <label for="sla_payment" class="block text-sm font-medium text-gray-700 mb-2">
                    SLA Pembayaran (Hari)
                </label>
                <input type="number" id="sla_payment" name="sla_payment" min="0"
                       value="{{ old('sla_payment', $pembayaran->sla_payment) }}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="Misal: 30">
                <p class="text-xs text-gray-500 mt-1">Jumlah hari target untuk pembayaran</p>
                @error('sla_payment')
                    <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- Invoice Detail Section -->
            <div id="detailSection" class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 class="font-semibold text-gray-700 mb-3">Detail Invoice</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="text-gray-600">Nomor Invoice</p>
                        <p id="detail_invoice_number" class="font-semibold text-gray-800">{{ $pembayaran->invoice->invoice_number ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Nomor PO</p>
                        <p id="detail_po_number" class="font-semibold text-gray-800">{{ $pembayaran->invoice->purchaseOrderOnsite->purchase_order_onsite_number ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Nomor PR</p>
                        <p id="detail_pr_number" class="font-semibold text-gray-800">{{ $pembayaran->invoice->purchaseOrderOnsite->purchaseOrder->purchaseRequest->pr_number ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Item</p>
                        <p id="detail_item_desc" class="font-semibold text-gray-800 text-xs">
                            {{ $pembayaran->invoice->purchaseOrderOnsite->purchaseOrderItems->first()->item_desc ?? '-' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-gray-600">Harga Satuan</p>
                        <p id="detail_unit_price" class="font-semibold text-gray-800">
                            {{ number_format($pembayaran->invoice->purchaseOrderOnsite->purchaseOrderItems->first()->item_unit_price ?? 0, 0, ',', '.') }}
                        </p>
                    </div>
                    <div>
                        <p class="text-gray-600">Jumlah</p>
                        <p id="detail_quantity" class="font-semibold text-gray-800">
                            {{ $pembayaran->invoice->purchaseOrderOnsite->purchaseOrderItems->first()->item_qty ?? 0 }}
                        </p>
                    </div>
                    <div class="col-span-2">
                        <p class="text-gray-600">Total Amount</p>
                        <p id="detail_amount" class="font-semibold text-gray-800 text-lg">
                            @php
                                $itemPrice = $pembayaran->invoice->purchaseOrderOnsite->purchaseOrderItems->first();
                                $total = ($itemPrice->item_unit_price ?? 0) * ($itemPrice->item_qty ?? 0);
                            @endphp
                            {{ number_format($total, 0, ',', '.') }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="flex gap-3 pt-6 border-t border-gray-200">
                <a href="/pembayaran" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center">
                    Batal
                </a>
                <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Simpan Perubahan
                </button>
            </div>
        </form>
    </div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/id.js"></script>
@endsection

@section('script')
    @vite(['resources/js/custom/invoice/pembayaran/index.js'])
@endsection
