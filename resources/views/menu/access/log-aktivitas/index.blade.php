@extends('layouts.vertical', ['title' => 'Log Aktivitas', 'sub_title' => 'Access Control', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite([
        'node_modules/gridjs/dist/theme/mermaid.min.css',
        'node_modules/glightbox/dist/css/glightbox.min.css',
        'node_modules/tippy.js/dist/tippy.css',
    ])
    <style>
        /* Custom scrollbar untuk modal */
        #logDetailContent::-webkit-scrollbar {
            width: 8px;
        }
        #logDetailContent::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        #logDetailContent::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
        }
        #logDetailContent::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
        
        /* Animation untuk modal */
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .modal-content-animate {
            animation: slideDown 0.3s ease-out;
        }
    </style>
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_history_line text-3xl text-primary"></i>
                    Log Aktivitas
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    Pantau semua aktivitas akses dan perubahan hak pengguna
                </p>
            </div>
            <button id="btn-refresh" class="btn btn-sm btn-primary hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <i class="mgc_refresh_1_line me-2"></i>
                Refresh
            </button>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card bg-primary text-white hover:shadow-lg transition-shadow duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total Log</p>
                        <h3 class="text-2xl font-bold text-white" id="total-logs">{{ $totalLogs ?? 0 }}</h3>
                    </div>
                    <div class="bg-white/20 rounded-full p-3">
                        <i class="mgc_document_line text-2xl text-white"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="card bg-success text-white hover:shadow-lg transition-shadow duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Create</p>
                        <h3 class="text-2xl font-bold text-white" id="create-logs">{{ $createLogs ?? 0 }}</h3>
                    </div>
                    <div class="bg-white/20 rounded-full p-3">
                        <i class="mgc_add_circle_line text-2xl text-white"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="card bg-warning text-white hover:shadow-lg transition-shadow duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Update</p>
                        <h3 class="text-2xl font-bold text-white" id="update-logs">{{ $updateLogs ?? 0 }}</h3>
                    </div>
                    <div class="bg-white/20 rounded-full p-3">
                        <i class="mgc_edit_2_line text-2xl text-white"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="card bg-danger text-white hover:shadow-lg transition-shadow duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Delete</p>
                        <h3 class="text-2xl font-bold text-white" id="delete-logs">{{ $deleteLogs ?? 0 }}</h3>
                    </div>
                    <div class="bg-white/20 rounded-full p-3">
                        <i class="mgc_delete_2_line text-2xl text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="card">
        <div class="card-header">
            <div class="flex items-center gap-3">
                <div class="bg-primary-100 dark:bg-primary-900 rounded-lg p-2">
                    <i class="mgc_list_check_3_line text-primary-600 dark:text-primary-400 text-xl"></i>
                </div>
                <div>
                    <h4 class="card-title">Daftar Aktivitas</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Riwayat aktivitas akses dan perubahan peran</p>
                </div>
            </div>
        </div>
        <div class="p-6">
            <div id="table-log" class="w-full overflow-x-auto"></div>
        </div>
    </div>

    <!-- Modal Detail Log - Redesigned -->
    <div id="logDetailModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-4">
        <div class="flex items-center justify-center min-h-screen">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col modal-content-animate">
                <!-- Modal Header -->
                <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="bg-primary-100 dark:bg-primary-900 rounded-lg p-2">
                            <i class="mgc_information_line text-primary-600 dark:text-primary-400 text-xl"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-800 dark:text-white">Detail Aktivitas</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Informasi lengkap perubahan data</p>
                        </div>
                    </div>
                    <button id="closeLogDetailModal" class="inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                        <i class="mgc_close_line text-2xl"></i>
                    </button>
                </div>
                
                <!-- Modal Content -->
                <div id="logDetailContent" class="overflow-y-auto p-6 flex-1 bg-gray-50 dark:bg-gray-900/50"></div>
                
                <!-- Modal Footer -->
                <div class="flex justify-end items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button id="closeLogDetailModalBtn" class="btn btn-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 hover:shadow-md transition-all duration-200">
                        <i class="mgc_close_line me-1"></i>
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite([
        'resources/js/pages/extended-lightbox.js',
        'resources/js/pages/highlight.js',
        'resources/js/pages/extended-tippy.js',
        'resources/js/custom/access/log/log-read.js',
        'resources/js/custom/access/log/log-detail.js',
    ])
@endsection
