@extends('layouts.vertical', ['title' => 'PO Onsite', 'sub_title' => ucwords($prefix), 'mode' => $mode ?? '', 'demo' => $demo ?? ''])
@section('css')
    <!-- Glightbox css -->
    @vite([
        //
        'node_modules/gridjs/dist/theme/mermaid.min.css',
        'node_modules/glightbox/dist/css/glightbox.min.css',
        'node_modules/sweetalert2/dist/sweetalert2.min.css',
        'node_modules/tippy.js/dist/tippy.css',
        'node_modules/flatpickr/dist/flatpickr.min.css',
    ])
@endsection
@section('content')
    <div class="grid lg:grid-cols-12 gap-6">
        <div class="lg:col-span-12">
            <div class="card">
                <div class="card-header">
                    <div class="flex justify-between items-center">
                        <h4 class="card-title">Input</h4>
                    </div>
                </div>
                <div class="p-6">
                    <form id="formCari" class="grid grid-cols-4 gap-4 mb-6">
                        <div class="flex justify-between gap-2">
                            <input type="text" class="form-input" name="search" id="inputCari"
                                placeholder="PO Number/Supplier Name/Amount" autofocus>
                            <div class="flex items-center">
                                <button type="submit" class="btn bg-primary text-white"><i
                                        class="mgc_search_3_line"></i></button>
                            </div>
                        </div>
                    </form>
                </div>
                <div id="hasilCariModal"
                    class="fixed inset-0 z-50 hidden items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <!-- Konten modal -->
                    <div class="sm:max-w-7xl w-full m-3 sm:mx-auto bg-white dark:bg-slate-800 border shadow-sm rounded-md">
                        <div class="flex justify-between items-center py-2.5 px-4 border-b dark:border-gray-700">
                            <h3 class="font-medium text-gray-800 dark:text-white text-lg">Hasil Pencarian</h3>
                            <button class="h-8 w-8 dark:text-gray-200" data-fc-dismiss type="button">
                                <span class="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div class="px-4 py-8">
                            <div id="hasilCari-table" class="w-full overflow-x-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="lg:col-span-12">
            <div class="card">
                <div class="card-header">
                    <h4 class="card-title">Daftar Item Penjualan Produk</h4>
                </div>

                <div class="p-6">
                    <div class="relative overflow-x-auto">
                        <table class="w-full divide-y divide-gray-300 dark:divide-gray-700">
                            <thead
                                class="bg-slate-300 bg-opacity-20 border-t dark:bg-slate-800 divide-gray-300 dark:border-gray-700">
                                <tr>
                                    <th scope="col"
                                        class="py-3.5 ps-4 pe-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        No.</th>
                                    <th scope="col"
                                        class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        Status</th>
                                    <th scope="col"
                                        class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        PO Number</th>
                                    <th scope="col"
                                        class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 w-20">
                                        Date</th>
                                    <th scope="col"
                                        class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        Supplier Number</th>
                                    <th scope="col"
                                        class="pe-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        Unit Price</th>
                                    <th scope="col"
                                        class="pe-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        Qty</th>
                                    <th scope="col"
                                        class="pe-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        Amount</th>
                                    <th scope="col"
                                        class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        Action</th>
                                </tr>
                            </thead>
                            <tbody id="poTableBody" class="divide-y divide-gray-200 dark:divide-gray-700 ">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <!-- Button Proses -->
        <div class="flex gap-2 justify-start items-center print:hidden">
            <button type="button"
                class="btn bg-info text-white disabled:bg-slate-200 disabled:text-gray-500 btn-proses">Proses</button>
        </div>
        <!-- Button Trigger Modal Tanggal Terima -->
        <button id="btnProses" data-fc-target="prosesModal" data-fc-type="modal" data-fc-behavior="static"></button>
        <!-- Modal Tanggal Terima -->
        <div id="prosesModal"
            class="fixed top-0 left-0 z-50 transition-all duration-500 fc-modal hidden w-full h-full min-h-full items-center fc-modal-open:flex">
            <div
                class="fc-modal-open:opacity-100 duration-500 opacity-0 ease-out transition-[opacity] sm:max-w-lg sm:w-full sm:mx-auto  flex-col bg-white border shadow-sm rounded-md dark:bg-slate-800 dark:border-gray-700">
                <div class="flex justify-between items-center py-2.5 px-4 border-b dark:border-gray-700">
                    <h3 class="font-medium text-gray-800 dark:text-white text-lg">
                        Masukkan Tanggal Terima PO
                    </h3>
                    <button class="inline-flex flex-shrink-0 justify-center items-center h-8 w-8 dark:text-gray-200"
                        data-fc-dismiss type="button">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
                <form id="form-proses" action="{{ route('po-onsite.store', $prefix) }}" method="POST">
                    @csrf
                    <div class="px-4 py-8 overflow-y-auto">
                        <!-- Input tanggal terima -->
                        <div class="form-group">
                            <input type="text" class="form-input" name="received_at" id="inputReceivedAt">
                            <!-- Error Message -->
                            <p id="error-received_at" class="text-red-500 text-sm mt-1"></p>
                        </div>
                    </div>
                    <div class="flex justify-end items-center gap-4 p-4 border-t dark:border-slate-700">
                        <!-- Tombol Cancel -->
                        <button
                            class="py-2 px-5 inline-flex justify-center items-center gap-2 rounded dark:text-gray-200 border dark:border-slate-700 font-medium hover:bg-slate-100 hover:dark:bg-slate-700 transition-all"
                            data-fc-dismiss type="button">Close</button>
                        <!-- Tombol Save -->
                        <button type="submit"
                            class="inline-flex items-center rounded-md border border-transparent bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 focus:outline-none disabled:bg-slate-500">
                            <span
                                class="loader hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Save</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite([
        //
        'resources/js/pages/highlight.js',
        'resources/js/pages/extended-lightbox.js',
        'resources/js/pages/extended-sweetalert.js',
        'resources/js/pages/extended-tippy.js',
        'resources/js/pages/form-flatpickr.js',
        'resources/js/custom/po-onsite.js',
    ])
@endsection
