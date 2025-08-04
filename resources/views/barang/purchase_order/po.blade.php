@extends('layouts.vertical', ['title' => 'Purchase Order', 'sub_title' => 'Barang', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite([
        // Script css disini
        'node_modules/gridjs/dist/theme/mermaid.min.css',
        'node_modules/glightbox/dist/css/glightbox.min.css',
        'node_modules/tippy.js/dist/tippy.css',
        'node_modules/flatpickr/dist/flatpickr.min.css',
    ])
@endsection

@section('content')
    <div class="grid grid-cols-12">
        <div class="col-span-12">
            <div class="card">
                <div class="card-header">
                    <div class="flex md:flex-row flex-col justify-between items-start md:items-center">
                        <h4 class="card-title">Data PO (Purchase Order)</h4>
                        <div class="flex flex-row gap-2">
                            <button class="btn disabled:bg-slate-400 bg-purple-500 p-2 text-white btn-linktopr"
                                data-fc-target="showprModal" data-fc-behavior="static" data-fc-type="modal" type="button" title="Hubungkan PR"
                                tabindex="0" data-plugin="tippy" data-tippy-animation="scale" data-tippy-inertia="true"
                                data-tippy-duration="[600, 300]" data-tippy-arrow="true">
                                <i class="mgc_link_fill text-base"></i>
                            </button>
                            <a href="{{ route('purchase-order.create',$prefix) }}" class="btn bg-primary text-white p-2"
                                title="Buat PO" tabindex="0" data-plugin="tippy" data-tippy-animation="scale"
                                data-tippy-inertia="true" data-tippy-duration="[600, 300]" data-tippy-arrow="true">
                                <i class="mgc_add_fill text-base"></i>
                            </a>
                            <button class="btn disabled:bg-slate-400 bg-warning p-2 text-white btn-edit" type="button"
                                title="Edit" tabindex="0" data-plugin="tippy" data-tippy-animation="scale"
                                data-tippy-inertia="true" data-tippy-duration="[600, 300]" data-tippy-arrow="true" disabled>
                                <i class="mgc_edit_2_line text-base"></i>
                            </button>
                            <button class="btn disabled:bg-slate-400 bg-danger p-2 text-white btn-delete"
                                data-fc-target="deleteModal" data-fc-behavior="static" data-fc-type="modal" type="button" title="Hapus"
                                tabindex="0" data-plugin="tippy" data-tippy-animation="scale" data-tippy-inertia="true"
                                data-tippy-duration="[600, 300]" data-tippy-arrow="true" disabled>
                                <i class="mgc_delete_2_line text-base"></i>
                            </button>
                            <button class="hidden btn disabled:bg-slate-400 bg-danger p-2 text-white btn-show"
                                data-fc-target="showprModal" data-fc-behavior="static" data-fc-type="modal" type="button">
                                <i class="mgc_eye_2_fill text-2xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">Berikut adalah data produk. Anda bisa mencari
                        dan mengurutkan data secara naik atau turun. Setiap halaman menampilkan 10 item.
                    </p>
                    <!-- Disini tampilkan data -->
                    <div id="purchase_order-table" class="w-full overflow-x-auto"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Delete -->
    <div id="deleteModal"
        class="fixed top-0 left-0 z-50 transition-all duration-500 fc-modal hidden w-full h-full min-h-full items-center fc-modal-open:flex">
        <div
            class="fc-modal-open:opacity-100 duration-500 opacity-0 ease-out transition-[opacity] sm:max-w-lg sm:w-full sm:mx-auto  flex-col bg-white border shadow-sm rounded-md dark:bg-slate-800 dark:border-gray-700">
            <div class="flex justify-between items-center py-2.5 px-4 border-b dark:border-gray-700">
                <h3 class="font-medium text-gray-800 dark:text-white text-lg">
                    Delete Item
                </h3>
                <button class="inline-flex flex-shrink-0 justify-center items-center h-8 w-8 dark:text-gray-200"
                    data-fc-dismiss type="button">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form method="POST">
                @csrf
                @method('delete')
                <div class="px-4 py-8 overflow-y-auto">
                    <div class="grid grid-cols-1 gap-6">
                        <div>
                            <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
                                Apakah Anda yakin ingin menghapus data ini?
                            </p>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end items-center gap-4 p-4 border-t dark:border-slate-700">
                    <button
                        class="btn dark:text-gray-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:dark:bg-slate-700 transition-all"
                        data-fc-dismiss type="button">Close
                    </button>
                    <button id="confirmDelete" class="btn bg-danger text-white" type="button">Hapus</button>
                </div>
            </form>
        </div>
    </div>

    <div id="showprModal" class="w-full h-full mt-5 fixed top-0 left-0 z-50 transition-all duration-500 fc-modal hidden">
        <div
            class="sm:max-w-7xl fc-modal-open:opacity-100 duration-500 opacity-0 ease-out transition-all sm:w-full m-3 sm:mx-auto flex flex-col bg-white border shadow-sm rounded-md dark:bg-slate-800 dark:border-gray-700">
            <div class="flex justify-between items-center py-2.5 px-4 border-b dark:border-gray-700">
                <h3 class="font-medium text-gray-800 dark:text-white text-lg">
                    PR Number Detail
                </h3>
                <button class="inline-flex flex-shrink-0 justify-center items-center h-8 w-8 dark:text-gray-200"
                    data-fc-dismiss modal-close type="button">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="grid grid-cols-12">
                <div class="col-span-12">
                    <div class="card">
                        <div class="p-4">
                            <div class="overflow-x-auto p-3">
                                <div class="min-w-full inline-block align-middle">
                                    <form class="my-2">
                                        @csrf
                                        <button type="button" class="btn bg-success text-white disabled:bg-slate-400 btn-savepr" disabled><i class="mgc_save_2_line text-base me-4"></i> Save PR</button>
                                    </form>
                                    <form class="my-2">
                                        @csrf
                                        <button type="button" class="btn bg-danger text-white disabled:bg-slate-400 btn-deletepr" disabled><i class="mgc_delete_line  text-base me-4"></i> Delete PR</button>
                                    </form>
                                    <div
                                        class="border rounded-lg divide-y divide-gray-200 dark:border-gray-700 dark:divide-gray-700">
                                        <!-- Disini tampilkan data -->
                                        <div id="show_pr-table"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-end items-center gap-4 p-4 border-t dark:border-slate-700">
                            <button
                                class="btn dark:text-gray-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:dark:bg-slate-700 transition-all"
                                data-fc-dismiss modal-close type="button">Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    <script>
        const Data = @json($dataJson);
    </script>
    @vite([
        // Script JS disini
        'resources/js/pages/extended-lightbox.js',
        'resources/js/pages/highlight.js',
        'resources/js/pages/extended-tippy.js',
        'resources/js/custom/data-table.js',
        'resources/js/custom/form-delete.js',
        'resources/js/custom/po.js',
    ])
@endsection
