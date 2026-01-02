@extends('layouts.vertical', ['title' => 'Bulk Edit PO Onsite', 'sub_title' => 'Purchase', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite([
        'node_modules/flatpickr/dist/flatpickr.min.css',
        'resources/scss/custom/po-onsite/bulk-edit.scss',
    ])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_edit_line"></i>
                    Bulk Edit PO Onsite
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Edit {{ count($onsites) }} data tracking onsite dengan konsistensi tampilan create
                </p>
            </div>
        </div>
    </div>

    <!-- Form Card -->
    <div class="card">
        <div class="card-header">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white">Form Bulk Edit PO Onsite</h4>
        </div>
        <div class="p-6">
            <form id="form-bulk-edit-onsite" method="POST" data-ids="{{ json_encode($ids) }}">
                @csrf

                <!-- Selected Item Info (Green Box like create) -->
                <div id="selected-item-info" class="mb-6">
                    <div
                        class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div class="flex items-center justify-between mb-3">
                            <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <i class="mgc_check_circle_line text-green-600"></i>
                                Item Terpilih (<span>{{ count($onsites) }}</span> items)
                            </h5>
                        </div>

                        <!-- Table of selected items -->
                        <div class="overflow-x-auto mt-3">
                            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead class="bg-slate-100 dark:bg-slate-700">
                                    <tr>
                                        <th
                                            class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            #</th>
                                        <th
                                            class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            PO Number</th>
                                        <th
                                            class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            PR Number</th>
                                        <th
                                            class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Supplier</th>
                                        <th
                                            class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Item Desc</th>
                                        <th
                                            class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                                            UOM</th>
                                        <th
                                            class="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Qty</th>
                                        <th
                                            class="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Amount</th>
                                        <th
                                            class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Target PO-&gt;Onsite</th>
                                        <th
                                            class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                                            SLA Realisasi (hari)</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    @foreach ($onsites as $index => $onsite)
                                        @php
                                            $item = $onsite->purchaseOrderItem;
                                            $po = $item->purchaseOrder ?? null;
                                            $pri = $item->purchaseRequestItem ?? null;
                                            $pr = $pri ? $pri->purchaseRequest : null;
                                        @endphp
                                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                {{ $index + 1 }}</td>
                                            <td class="px-3 py-2 text-sm font-medium text-primary">
                                                {{ $po->po_number ?? '-' }}</td>
                                            <td class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                {{ $pr->pr_number ?? '-' }}</td>
                                            <td class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                {{ $po?->supplier?->name ?? '-' }}</td>
                                            <td
                                                class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                                {{ $pri->item_desc ?? '-' }}</td>
                                            <td class="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                                                {{ $pri->uom ?? '-' }}</td>
                                            <td class="px-3 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                                                {{ number_format($item->quantity ?? 0) }}</td>
                                            <td class="px-3 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                                                {{ number_format($item->amount ?? 0) }}</td>
                                            <td class="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                                                {{ $po && $po->approved_date ? \Carbon\Carbon::parse($po->approved_date)->format('d-M-y') : '-' }}
                                            </td>
                                            <td class="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                                                {{ $item->sla_po_to_onsite_target ? $item->sla_po_to_onsite_target . ' hari' : '-' }}
                                            </td>
                                            <td class="px-3 py-2 text-sm text-center">
                                                <span
                                                    class="sla-display font-semibold text-primary"
                                                    data-id="{{ $onsite->id }}"
                                                    data-approved-date="{{ $po && $po->approved_date ? \Carbon\Carbon::parse($po->approved_date)->format('Y-m-d') : '' }}"
                                                    data-initial="{{ $onsite->sla_po_to_onsite_realization ?? '' }}">
                                                    {{ $onsite->sla_po_to_onsite_realization !== null ? $onsite->sla_po_to_onsite_realization . ' hari' : '-' }}
                                                </span>
                                                <input type="hidden" class="sla-hidden-input" name="sla_realisasi[{{ $onsite->id }}]" value="{{ $onsite->sla_po_to_onsite_realization ?? '' }}">
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Onsite Date (single field below the table) -->
                <div class="grid grid-cols-1 gap-4 mb-6">
                    <!-- Onsite Date -->
                    <div>
                        <label for="onsite_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tanggal Onsite <span class="text-danger">*</span>
                        </label>
                        <input type="text" id="onsite_date" name="onsite_date" class="form-input"
                            placeholder="Pilih tanggal" required
                            value="{{ $onsites->pluck('onsite_date')->filter()->unique()->count() === 1 ? \Carbon\Carbon::parse($onsites->pluck('onsite_date')->filter()->first())->format('Y-m-d') : '' }}">
                        <div id="error-onsite_date" class="text-danger text-xs mt-1 hidden"></div>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="flex justify-end gap-2 mt-6 pt-6 border-t">
                    <a href="{{ route('po-onsite.index') }}"
                        class="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">
                        <i class="mgc_arrow_left_line"></i>
                        Kembali
                    </a>
                    <button type="submit" id="btn-submit" class="btn bg-success text-white hover:bg-success-600">
                        <i class="mgc_save_line"></i>
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    </div>
@endsection

@section('script')
    @vite(['resources/js/custom/purchase/po-onsite/bulk-edit.js'])
@endsection
