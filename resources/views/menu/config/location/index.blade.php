@extends('layouts.vertical', ['title' => 'Unit Kerja', 'sub_title' => 'Configuration', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css', 'node_modules/tippy.js/dist/tippy.css'])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_location_line text-2xl"></i>
                    Manajemen Unit Kerja
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    Kelola data lokasi dan unit kerja perusahaan
                </p>
            </div>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total Locations -->
        <div class="card bg-primary text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Total Unit Kerja</p>
                        <p class="text-3xl font-bold mt-1">{{ $totalLocations }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_location_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- With Users -->
        <div class="card bg-success text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Dengan Users</p>
                        <p class="text-3xl font-bold mt-1">{{ $withUsers }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_user_3_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- With Purchase Requests -->
        <div class="card bg-info text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Dengan PR</p>
                        <p class="text-3xl font-bold mt-1">{{ $withPurchaseRequests }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_file_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Locations -->
        <div class="card bg-warning text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Baru (30 hari)</p>
                        <p class="text-3xl font-bold mt-1">{{ $recentLocations }}</p>
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
                    <p class="card-title">Daftar Unit Kerja</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kelola informasi lokasi dan unit kerja perusahaan
                    </p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-refresh"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
                        <i class="mgc_refresh_2_line"></i>
                    </button>
                    <button id="btn-delete-selected"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled>
                        <i class="mgc_delete_2_line mr-2"></i>
                        Hapus
                    </button>
                    <button id="btn-create-location"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                        <i class="mgc_add_line mr-2"></i>
                        Tambah Unit Kerja
                    </button>
                </div>
            </div>
        </div>
        <div class="p-6">
            <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">
                Showing <span id="data-count">0</span> unit kerja.
            </p>
            <!-- Table -->
            <div id="table-locations" class="w-full overflow-x-auto"></div>
        </div>
    </div>

    <!-- Modal Create/Edit Location -->
    <div id="locationModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out"
        style="opacity: 0;">
        <!-- Backdrop -->
        <div id="locationModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <!-- Modal Content -->
        <div class="relative min-h-screen w-full flex items-center justify-center px-4 py-6 sm:py-12">
            <div id="locationModalContent"
                class="relative w-full max-w-lg max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">

                <!-- Header -->
                <div
                    class="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-blue-700 dark:border-blue-900">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <i id="locationModalIcon" class="mgc_location_line text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 id="locationModalTitle" class="text-lg sm:text-xl font-bold text-white">Tambah Unit Kerja
                            </h3>
                            <p class="text-xs sm:text-sm text-blue-100">Lengkapi data unit kerja baru</p>
                        </div>
                    </div>
                    <button type="button" id="locationModalClose"
                        class="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors duration-200">
                        <i class="mgc_close_line text-xl"></i>
                    </button>
                </div>

                <!-- Form Content -->
                <div class="overflow-y-auto max-h-[calc(90vh-200px)] px-6 sm:px-8 py-6">
                    <form id="locationForm" class="space-y-6">
                        <input type="hidden" id="location_id" name="id">
                        <input type="hidden" id="form_method" name="_method" value="POST">

                        <!-- Nama -->
                        <div>
                            <label for="name" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Nama Unit Kerja <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="name" name="name"
                                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                placeholder="Masukkan nama unit kerja" required>
                            <div class="text-red-500 text-sm mt-1 hidden" id="error-name"></div>
                        </div>
                    </form>
                </div>

                <!-- Footer -->
                <div
                    class="sticky bottom-0 bg-gray-50 dark:bg-slate-900 px-6 sm:px-8 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <button type="button" id="locationModalCancel"
                        class="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors order-2 sm:order-1">
                        <i class="mgc_close_line mr-2"></i>
                        Batal
                    </button>
                    <button type="button" id="locationFormSubmit"
                        class="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors order-1 sm:order-2">
                        <i class="mgc_check_line mr-2"></i>
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
                    <div
                        class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                        <i class="mgc_delete_2_line text-2xl text-red-600 dark:text-red-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Konfirmasi Hapus</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-6" id="deleteMessage">
                        Apakah Anda yakin ingin menghapus unit kerja ini?
                    </p>
                    <div class="flex gap-3">
                        <button type="button" id="deleteModalCancel"
                            class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            Batal
                        </button>
                        <button type="button" id="deleteModalConfirm"
                            class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
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
        'resources/js/custom/config/location/index.js',
    ])
@endsection
