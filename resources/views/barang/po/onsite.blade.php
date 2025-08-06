@extends('layouts.vertical', ['title' => 'PO Onsite', 'sub_title' => 'Barang', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

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
                        <h4 class="card-title">Data PO (Purchase Order) Onsite</h4>
                        <div class="flex flex-row gap-2">
                            <a href="{{ route('po-onsite.create',$prefix) }}" class="btn bg-primary text-white p-2"
                                title="Tambah Data PO Onsite" tabindex="0" data-plugin="tippy" data-tippy-animation="scale"
                                data-tippy-inertia="true" data-tippy-duration="[600, 300]" data-tippy-arrow="true">
                                <i class="mgc_add_fill text-base"></i>
                            </a>
                            <button class="btn disabled:bg-slate-400 bg-warning p-2 text-white btn-edit"
                                data-fc-target="editModal" data-fc-type="modal" type="button" title="Edit" tabindex="0"
                                data-plugin="tippy" data-tippy-animation="scale" data-tippy-inertia="true"
                                data-tippy-duration="[600, 300]" data-tippy-arrow="true" disabled>
                                <i class="mgc_edit_2_line text-base"></i>
                            </button>
                            </button>
                            <button class="btn disabled:bg-slate-400 bg-danger p-2 text-white btn-delete"
                                data-fc-target="deleteModal" data-fc-behavior="static" data-fc-type="modal" type="button"
                                title="Hapus" tabindex="0" data-plugin="tippy" data-tippy-animation="scale"
                                data-tippy-inertia="true" data-tippy-duration="[600, 300]" data-tippy-arrow="true" disabled>
                                <i class="mgc_delete_2_line text-base"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">Berikut adalah data PO onsite Anda bisa mencari
                        dan mengurutkan data secara naik atau turun. Setiap halaman menampilkan 10 item.
                    </p>
                    <!-- Disini tampilkan data -->
                    <div id="onsite-table" class="w-full overflow-x-auto"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Fullscreen Loader Overlay -->
    <div id="loaderOverlay" class="hidden fixed inset-0 z-[999] bg-black bg-opacity-40 items-center justify-center">
        <div class="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
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

    <!-- Modal Edit -->
    <div id="editModal"
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
            <form id="editItemForm" method="POST">
                @csrf
                @method('put')
                <div class="px-4 py-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="form-group col-span-2">
                            <!-- Input tanggal terima -->
                            <input type="text" class="form-input" name="tgl_terima" id="tgl_terimaEdit">
                            <p id="error-edit-name" class="text-sm text-red-500 mt-1"></p>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end items-center gap-4 p-4 border-t dark:border-slate-700">
                    <button
                        class="btn dark:text-gray-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:dark:bg-slate-700 transition-all"
                        data-fc-dismiss type="button">Close
                    </button>
                    <button type="submit" class="btn bg-primary text-white flex items-center gap-2" id="btnUpdate">
                        <span
                            class="loader hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Update</span>
                    </button>
                </div>
            </form>
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
        'resources/js/pages/form-flatpickr.js',
        'resources/js/custom/data-table.js',
        'resources/js/custom/form-delete.js',
        'resources/js/custom/modal-update.js',
    ])
@endsection
