@extends('layouts.vertical', ['title' => 'Klasifikasi', 'sub_title' => 'Configuration', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css', 'node_modules/tippy.js/dist/tippy.css'])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_classify_2_line text-2xl"></i>
                    Manajemen Klasifikasi
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    Kelola klasifikasi barang dan jasa
                </p>
            </div>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Total Classifications -->
        <div class="card bg-primary text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total Klasifikasi</p>
                        <h3 class="text-2xl font-bold text-white">{{ $totalClassifications ?? 0 }}</h3>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_classify_2_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Classifications -->
        <div class="card bg-warning text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Baru (30 Hari)</p>
                        <h3 class="text-2xl font-bold text-white">{{ $recentClassifications ?? 0 }}</h3>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_time_line"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="card">
        <div class="card-header">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h4 class="card-title">Daftar Klasifikasi</h4>
                    <p class="text-sm text-slate-700 dark:text-slate-400">
                        Kelola klasifikasi barang dan jasa untuk purchase request
                    </p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-refresh"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
                        <i class="mgc_refresh_2_line"></i>
                    <button id="btn-delete-selected"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled>
                        <i class="mgc_delete_2_line mr-2"></i>
                        Hapus
                    </button>
                    @haspermission('classifications.create')
                    <button id="btn-create-classification"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary hover:bg-primary-600 text-white transition-colors">
                        <i class="mgc_add_line mr-2"></i>
                        Tambah
                    </button>
                    @endhaspermission
                </div>
            </div>
        </div>
        <div class="p-6">
            <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">
                Showing <span id="data-count">0</span> klasifikasi.
            </p>
            <!-- Table -->
            <div id="table-classifications" class="w-full overflow-x-auto"></div>
        </div>
    </div>

    <!-- Modal Create/Edit Classification -->
    <div id="classificationModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out"
        style="opacity: 0;">
        <!-- Backdrop -->
        <div id="classificationModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <!-- Modal Content -->
        <div class="relative min-h-screen w-full flex items-center justify-center px-4 py-6 sm:py-12">
            <div id="classificationModalContent"
                class="relative w-full max-w-lg max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">

                <!-- Header -->
                <div
                    class="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900">
                            <i id="classificationModalIcon"
                                class="mgc_classify_2_line text-xl text-primary-600 dark:text-primary-400"></i>
                        </div>
                        <h3 id="classificationModalTitle" class="text-lg font-semibold text-slate-800 dark:text-white">
                            Tambah Klasifikasi
                        </h3>
                    </div>
                    <button id="classificationModalClose"
                        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <i class="mgc_close_line text-2xl"></i>
                    </button>
                </div>

                <!-- Form Content -->
                <div class="overflow-y-auto max-h-[calc(90vh-200px)] px-6 sm:px-8 py-6">
                    <form id="classificationForm" class="space-y-4">
                        @csrf
                        <input type="hidden" id="classification_id" name="classification_id">
                        <input type="hidden" id="form_method" name="_method" value="POST">

                        <!-- Name -->
                        <div>
                            <label for="name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Nama Klasifikasi <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="name" name="name"
                                class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-900 dark:text-white"
                                placeholder="Masukkan nama klasifikasi">
                            <p id="error-name" class="mt-1 text-sm text-red-600 hidden"></p>
                        </div>
                    </form>
                </div>

                <!-- Footer -->
                <div
                    class="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <button id="classificationModalCancel" type="button"
                        class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Batal
                    </button>
                    <button id="classificationFormSubmit" type="button"
                        class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-600 rounded-lg transition-colors inline-flex items-center">
                        <span id="submitButtonText">Simpan</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out"
        style="opacity: 0;">
        <div id="deleteModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <div class="relative min-h-screen flex items-center justify-center px-4">
            <div id="deleteModalContent"
                class="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">
                <div class="p-6">
                    <div class="flex items-center gap-4 mb-4">
                        <div
                            class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <i class="mgc_alert_line text-2xl text-red-600 dark:text-red-400"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-800 dark:text-white">Konfirmasi Hapus</h3>
                            <p id="deleteMessage" class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Apakah Anda yakin ingin menghapus data ini?
                            </p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button id="deleteModalCancel"
                            class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                            Batal
                        </button>
                        <button id="deleteModalConfirm"
                            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite([
        // Panggil JS untuk halaman ini
        'resources/js/pages/highlight.js',
        'resources/js/pages/extended-tippy.js',
        'resources/js/custom/config/classification/index.js',
    ])
@endsection
