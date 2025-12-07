@extends('layouts.vertical', ['title' => 'Role & Permission', 'sub_title' => 'User Management', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite([
        'node_modules/gridjs/dist/theme/mermaid.min.css',
        'node_modules/sweetalert2/dist/sweetalert2.min.css',
        'node_modules/tippy.js/dist/tippy.css',
    ])
    <style>
        .permission-checkbox:checked {
            background-color: #3b82f6;
            border-color: #3b82f6;
        }
        .category-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Animasi untuk icon settings */
        @keyframes rotateSettings {
            0% {
                transform: rotate(0deg) scale(1);
            }
            25% {
                transform: rotate(-12deg) scale(1.1);
            }
            75% {
                transform: rotate(12deg) scale(1.1);
            }
            100% {
                transform: rotate(0deg) scale(1);
            }
        }
        
        .animate-settings {
            animation: rotateSettings 1s ease-in-out infinite;
            transform-origin: center;
        }
        
        /* Animasi hanya saat hover pada button */
        .btn-manage-permissions:hover .mgc_settings_line {
            animation: rotateSettings 0.6s ease-in-out infinite;
        }
        
        /* Tambahkan subtle glow effect saat hover */
        .btn-manage-permissions:hover {
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
        }
    </style>
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_shield_line text-3xl text-purple-600"></i>
                    Role & Permission Management
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    Kelola role dan permission untuk kontrol akses sistem
                </p>
            </div>
            <div class="flex gap-2">
                <a href="{{ route('manajemen-user.index') }}" 
                   class="btn btn-sm bg-gray-600 text-white hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <i class="mgc_arrow_left_line me-2"></i>
                    Kembali ke User
                </a>
                <button id="btn-refresh" class="btn btn-sm btn-primary hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <i class="mgc_refresh_1_line me-2"></i>
                    Refresh
                </button>
            </div>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card bg-purple-600 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total Roles</p>
                        <h3 class="text-2xl font-bold text-white">{{ $totalRoles ?? 0 }}</h3>
                    </div>
                    <div class="bg-white/20 rounded-full p-3">
                        <i class="mgc_shield_line text-2xl text-white"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="card bg-blue-600 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Total Permissions</p>
                        <h3 class="text-2xl font-bold text-white">{{ $totalPermissions ?? 0 }}</h3>
                    </div>
                    <div class="bg-white/20 rounded-full p-3">
                        <i class="mgc_key_line text-2xl text-white"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="card bg-green-600 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white/80 text-xs font-medium mb-1">Active Roles</p>
                        <h3 class="text-2xl font-bold text-white">{{ $activeRoles ?? 0 }}</h3>
                    </div>
                    <div class="bg-white/20 rounded-full p-3">
                        <i class="mgc_check_circle_line text-2xl text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="card">
        <div class="card-header">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="bg-purple-100 dark:bg-purple-900 rounded-lg p-2">
                        <i class="mgc_list_check_3_line text-purple-600 dark:text-purple-400 text-xl"></i>
                    </div>
                    <div>
                        <h4 class="card-title">Daftar Role</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Kelola role dan assign permissions</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button id="btn-add-role" 
                            class="btn bg-primary text-white hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                            data-fc-target="addRoleModal" 
                            data-fc-type="modal">
                        <i class="mgc_add_fill me-2"></i>
                        Tambah Role
                    </button>
                    <button class="btn disabled:bg-slate-400 bg-danger text-white btn-delete hover:brightness-110 hover:shadow-md transition-all duration-200"
                            data-fc-target="deleteModal" 
                            data-fc-type="modal" 
                            type="button" 
                            title="Hapus Role"
                            data-plugin="tippy" 
                            disabled>
                        <i class="mgc_delete_2_line me-2"></i>
                        Hapus
                    </button>
                </div>
            </div>
        </div>
        <div class="p-6">
            <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">
                Kelola role dan assign permissions untuk kontrol akses yang granular. Role Super Admin dilindungi dan tidak dapat diubah.
            </p>
            <!-- Table -->
            <div id="table-role-permission" class="w-full overflow-x-auto"></div>
        </div>
    </div>

    <!-- Modal Add Role -->
    <div id="addRoleModal"
        class="fc-modal fixed inset-0 z-50 hidden overflow-y-auto"
        style="display: none;">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <!-- Background overlay -->
            <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-opacity-80" aria-hidden="true"></div>
            
            <!-- Modal panel -->
            <div class="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl dark:bg-slate-800 opacity-0 scale-95">
                <div class="flex justify-between items-center py-3 px-4 border-b dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600">
                    <h3 class="font-semibold text-white text-lg flex items-center gap-2">
                        <i class="mgc_add_circle_line text-2xl"></i>
                        Tambah Role Baru
                    </h3>
                    <button class="inline-flex flex-shrink-0 justify-center items-center h-8 w-8 text-white hover:bg-white/20 rounded-lg transition-colors"
                        data-fc-dismiss type="button">
                        <i class="mgc_close_line text-2xl"></i>
                    </button>
                </div>
                <form id="form-add-role" method="POST">
                    @csrf
                    <div class="px-4 py-6 overflow-y-auto max-h-[70vh]">
                        <div class="grid grid-cols-1 gap-5">
                            <!-- Input Nama Role -->
                            <div class="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <label for="role-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <i class="mgc_shield_line me-1 text-purple-600"></i>
                                    Nama Role
                                </label>
                                <input type="text" 
                                       id="role-name" 
                                       name="name" 
                                       class="form-input w-full" 
                                       placeholder="Contoh: Manager, Staff, etc."
                                       required>
                                <p id="error-name" class="text-red-500 text-sm mt-1"></p>
                            </div>

                            <!-- Info Box -->
                            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p class="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                                    <i class="mgc_information_line text-lg flex-shrink-0 mt-0.5"></i>
                                    <span>Pilih permissions yang ingin Anda berikan kepada role ini. Anda juga dapat menambahkan permissions nanti melalui tombol "Kelola Permission".</span>
                                </p>
                            </div>

                            <!-- Permissions Section -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    <i class="mgc_key_line me-1 text-blue-600"></i>
                                    Pilih Permissions (Opsional)
                                </label>
                                <div class="space-y-4">
                                    @foreach($permissionsHierarchy as $category => $data)
                                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <div class="category-header p-3 flex items-center justify-between">
                                                <h5 class="text-sm font-semibold text-white flex items-center gap-2">
                                                    <i class="mgc_folder_line"></i>
                                                    {{ $category }}
                                                </h5>
                                                <label class="inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" 
                                                           class="select-all-category form-checkbox rounded text-purple-700 border-purple/30 bg-white/20" 
                                                           data-category="{{ $category }}">
                                                    <span class="ml-2 text-xs text-white">Pilih Semua</span>
                                                </label>
                                            </div>
                                            <div class="p-4 bg-white dark:bg-gray-800 space-y-5">
                                                @if($data['use_groups'])
                                                    @foreach($data['groups'] as $groupName => $groupPermissions)
                                                        <div class="border border-gray-100 dark:border-gray-700 rounded-md">
                                                            <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                                                                <div class="flex items-center gap-2">
                                                                    <i class="mgc_archive_line text-primary"></i>
                                                                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{{ $groupName }}</span>
                                                                </div>
                                                                <label class="inline-flex items-center cursor-pointer">
                                                                    <input type="checkbox" class="select-all-subgroup form-checkbox rounded text-primary border-primary/30" data-category="{{ $category }}" data-group="{{ $groupName }}">
                                                                    <span class="ml-2 text-[10px] text-gray-500 dark:text-gray-400">Semua {{ $groupName }}</span>
                                                                </label>
                                                            </div>
                                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                                                                @foreach($groupPermissions as $permission)
                                                                    <label class="inline-flex items-start hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors cursor-pointer">
                                                                        <input type="checkbox" 
                                                                               name="permissions[]" 
                                                                               value="{{ $permission->id }}" 
                                                                               class="permission-checkbox form-checkbox rounded text-primary mt-0.5"
                                                                               data-category="{{ $category }}" data-group="{{ $groupName }}">
                                                                        <span class="ml-2 flex-1">
                                                                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 block">{{ $permission->display_name }}</span>
                                                                            @if($permission->description)
                                                                                <span class="text-xs text-gray-500 dark:text-gray-400">{{ $permission->description }}</span>
                                                                            @endif
                                                                        </span>
                                                                    </label>
                                                                @endforeach
                                                            </div>
                                                        </div>
                                                    @endforeach
                                                @else
                                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        @foreach($data['groups'] as $groupName => $groupPermissions)
                                                            @foreach($groupPermissions as $permission)
                                                                <label class="inline-flex items-start hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors cursor-pointer">
                                                                    <input type="checkbox" 
                                                                           name="permissions[]" 
                                                                           value="{{ $permission->id }}" 
                                                                           class="permission-checkbox form-checkbox rounded text-primary mt-0.5"
                                                                           data-category="{{ $category }}" data-group="{{ $groupName }}">
                                                                    <span class="ml-2 flex-1">
                                                                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 block">{{ $permission->display_name }}</span>
                                                                        @if($permission->description)
                                                                            <span class="text-xs text-gray-500 dark:text-gray-400">{{ $permission->description }}</span>
                                                                        @endif
                                                                    </span>
                                                                </label>
                                                            @endforeach
                                                        @endforeach
                                                    </div>
                                                @endif
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end items-center gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <button type="button" class="btn border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                            data-fc-dismiss>
                            <i class="mgc_close_line me-2"></i>
                            Batal
                        </button>
                        <button type="submit" class="btn bg-primary text-white hover:brightness-110 transition-all">
                            <i class="mgc_check_line me-2"></i>
                            Simpan Role
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Manage Permissions -->
    <div id="managePermissionsModal"
        class="fc-modal fixed inset-0 z-50 hidden overflow-y-auto"
        style="display: none;">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <!-- Background overlay -->
            <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-opacity-80" aria-hidden="true"></div>
            
            <!-- Modal panel -->
            <div class="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl dark:bg-slate-800 opacity-0 scale-95">
                <div class="flex justify-between items-center py-3 px-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600">
                    <h3 class="font-semibold text-white text-lg flex items-center gap-2">
                        <i class="mgc_settings_line text-2xl"></i>
                        Kelola Permission - <span id="modal-role-name" class="font-bold"></span>
                    </h3>
                    <button class="inline-flex flex-shrink-0 justify-center items-center h-8 w-8 text-white hover:bg-white/20 rounded-lg transition-colors"
                        data-fc-dismiss type="button">
                        <i class="mgc_close_line text-2xl"></i>
                    </button>
                </div>
            <form id="form-manage-permissions" method="POST">
                @csrf
                <input type="hidden" id="manage-role-id" name="role_id">
                <div class="px-4 py-6 overflow-y-auto max-h-[70vh]">
                    <div class="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p class="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                            <i class="mgc_information_line text-lg flex-shrink-0 mt-0.5"></i>
                            <span>Pilih permissions yang ingin Anda berikan kepada role ini. Permissions yang dipilih akan memungkinkan user dengan role ini mengakses fitur tertentu.</span>
                        </p>
                    </div>

                    <div id="permissions-container" class="space-y-4">
                        <!-- Permissions will be loaded here via JavaScript -->
                    </div>
                </div>
                <div class="flex justify-end items-center gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <button type="button" class="btn border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        data-fc-dismiss>
                        <i class="mgc_close_line me-2"></i>
                        Batal
                    </button>
                    <button type="submit" class="btn bg-primary text-white hover:brightness-110 transition-all">
                        <i class="mgc_check_line me-2"></i>
                        Simpan Permissions
                    </button>
                </div>
            </form>
            </div>
        </div>
    </div>

    <!-- Modal Delete -->
    <div id="deleteModal"
        class="fixed top-0 left-0 z-50 transition-all duration-500 fc-modal hidden w-full h-full min-h-full items-center fc-modal-open:flex">
        <div class="fc-modal-open:opacity-100 duration-500 opacity-0 ease-out transition-[opacity] sm:max-w-lg sm:w-full sm:mx-auto flex-col bg-white border shadow-sm rounded-md dark:bg-slate-800 dark:border-gray-700">
            <div class="flex justify-between items-center py-2.5 px-4 border-b dark:border-gray-700">
                <h3 class="font-medium text-gray-800 dark:text-white text-lg flex items-center gap-2">
                    <i class="mgc_delete_2_line text-danger"></i>
                    Hapus Role
                </h3>
                <button class="inline-flex flex-shrink-0 justify-center items-center h-8 w-8 dark:text-gray-200"
                    data-fc-dismiss type="button">
                    <i class="mgc_close_line text-2xl"></i>
                </button>
            </div>
            <form method="POST">
                @csrf
                @method('delete')
                <div class="px-4 py-8 overflow-y-auto">
                    <div class="grid grid-cols-1 gap-6">
                        <div class="text-center">
                            <div class="bg-danger-100 dark:bg-danger-900 rounded-full p-4 inline-flex mb-4">
                                <i class="mgc_alert_triangle_line text-4xl text-danger"></i>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                Apakah Anda yakin ingin menghapus role yang dipilih?
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                Role yang masih memiliki user tidak dapat dihapus. Role default (Super Admin, Kasir, Gudang) dilindungi.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end items-center gap-4 p-4 border-t dark:border-slate-700">
                    <button class="btn dark:text-gray-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:dark:bg-slate-700 transition-all"
                        data-fc-dismiss type="button">
                        <i class="mgc_close_line me-2"></i>
                        Batal
                    </button>
                    <button id="btn-delete-role" class="btn bg-danger text-white hover:brightness-110 transition-all" type="button">
                        <i class="mgc_delete_2_line me-2"></i>
                        Hapus
                    </button>
                </div>
            </form>
        </div>
    </div>
@endsection

@section('script')
    @vite([
        'resources/js/pages/highlight.js',
        'resources/js/pages/extended-sweetalert.js',
        'resources/js/pages/extended-tippy.js',
        'resources/js/custom/user/role-permission/role-permission.js',
    ])
@endsection
