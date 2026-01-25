@extends('layouts.vertical', ['title' => 'Roles', 'sub_title' => 'Access Control', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite(['node_modules/nice-select2/dist/css/nice-select2.css', 'node_modules/gridjs/dist/theme/mermaid.min.css', 'node_modules/tippy.js/dist/tippy.css'])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_shield_line text-2xl"></i>
                    Manajemen Roles
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    Kelola roles dan permission sistem
                </p>
            </div>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total Roles -->
        <div class="card bg-primary text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Total Roles</p>
                        <p class="text-3xl font-bold mt-1">{{ $totalRoles }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_shield_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Permissions -->
        <div class="card bg-success text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Total Permissions</p>
                        <p class="text-3xl font-bold mt-1">{{ $totalPermissions }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_check_circle_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Roles with Users -->
        <div class="card bg-info text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Roles dengan Users</p>
                        <p class="text-3xl font-bold mt-1">{{ $rolesWithUsers }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_user_3_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Protected Roles -->
        <div class="card bg-yellow-600 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Protected Roles</p>
                        <p class="text-3xl font-bold mt-1">{{ $protectedRoles }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_lock_line"></i>
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
                    <p class="card-title">Daftar Roles</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kelola roles dan assignkan permission ke setiap role
                    </p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-refresh"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
                        <i class="mgc_refresh_2_line"></i>
                    </button>
                    @haspermission('roles.create')
                    <button id="btn-create-role"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary hover:bg-primary-600 text-white transition-colors">
                        <i class="mgc_add_line mr-2"></i>
                        Tambah Role
                    </button>
                    @endhaspermission
                </div>
            </div>
        </div>
        <div class="p-6">
            <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">
                Showing <span id="data-count">0</span> roles. Click pada role untuk edit permission.
            </p>
            <!-- Table -->
            <div id="table-roles" class="w-full overflow-x-auto"></div>
        </div>
    </div>

    <!-- Modal Create/Edit Role -->
    <div id="roleModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out"
        style="opacity: 0;">
        <!-- Backdrop -->
        <div id="roleModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <!-- Modal Content -->
        <div class="relative min-h-screen w-full flex items-center justify-center px-4 py-6 sm:py-12">
            <div id="roleModalContent"
                class="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">

                <!-- Header -->
                <div
                    class="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-blue-700 dark:border-blue-900">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <i id="roleModalIcon" class="mgc_shield_add_line text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 id="roleModalTitle" class="text-lg sm:text-xl font-bold text-white">Tambah Role</h3>
                            <p class="text-xs sm:text-sm text-blue-100">Lengkapi data role baru</p>
                        </div>
                    </div>
                    <button type="button" id="roleModalClose"
                        class="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors duration-200">
                        <i class="mgc_close_line text-xl"></i>
                    </button>
                </div>

                <!-- Form Content -->
                <form id="form-role" class="overflow-y-auto" style="max-height: calc(90vh - 140px);">
                    @csrf
                    <input type="hidden" id="roleId" name="role_id">
                    <input type="hidden" id="roleMethod" name="_method" value="POST">

                    <div class="px-6 sm:px-8 py-6 space-y-5">
                        <!-- Role Name -->
                        <div class="space-y-2">
                            <label for="roleName"
                                class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <i class="mgc_shield_line text-blue-600 dark:text-blue-400"></i>
                                Nama Role
                                <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="roleName" name="name" placeholder="e.g. Editor, Moderator"
                                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400">
                            <p id="error-name" class="text-red-500 text-xs mt-1.5 flex items-center gap-1"></p>
                        </div>

                        <!-- Divider -->
                        <div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

                        <!-- Permissions Section -->
                        <div class="space-y-2">
                            <label class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <i class="mgc_check_line text-blue-600 dark:text-blue-400"></i>
                                Permissions
                                <span class="text-red-500">*</span>
                            </label>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                Pilih permissions yang akan diberikan ke role ini
                            </p>
                            <div id="permissionsContainer"
                                class="space-y-3 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50"
                                style="max-height: 400px;">
                                <!-- Permissions akan diload dari server -->
                                <div class="flex items-center justify-center py-8">
                                    <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <i class="mgc_loading_line animate-spin"></i>
                                        Loading permissions...
                                    </span>
                                </div>
                            </div>
                            <p id="error-permissions" class="text-red-500 text-xs mt-1.5 flex items-center gap-1"></p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div
                        class="sticky bottom-0 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-gray-700 px-6 sm:px-8 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                        <button type="button" id="roleModalCancel"
                            class="w-full sm:w-auto px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200 font-medium text-sm">
                            Batal
                        </button>
                        <button type="submit"
                            class="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg">
                            <span class="inline-flex items-center gap-2">
                                <i class="mgc_check_line"></i>
                                Simpan Role
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection

@section('script')
    @vite([
        // Panggil JS untuk halaman ini
        'resources/js/pages/form-select.js',
        'resources/js/pages/highlight.js',
        'resources/js/pages/extended-tippy.js',
        'resources/js/custom/access/roles/roles-read.js',
        'resources/js/custom/access/roles/roles-create.js',
        'resources/js/custom/access/roles/roles-edit.js',
        'resources/js/custom/access/roles/roles-delete.js',
    ])
@endsection
