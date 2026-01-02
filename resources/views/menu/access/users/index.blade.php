@extends('layouts.vertical', ['title' => 'Users', 'sub_title' => 'Access Control', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite(['node_modules/nice-select2/dist/css/nice-select2.css', 'node_modules/gridjs/dist/theme/mermaid.min.css', 'node_modules/tippy.js/dist/tippy.css'])
@endsection

@section('content')
    <!-- Header Section -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="mgc_user_3_line text-2xl"></i>
                    Manajemen Users
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    Kelola users dan assignkan roles & permissions
                </p>
            </div>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total Users -->
        <div class="card bg-primary text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Total Users</p>
                        <p class="text-3xl font-bold mt-1">{{ $totalUsers }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_user_1_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Users -->
        <div class="card bg-success text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Users Aktif</p>
                        <p class="text-3xl font-bold mt-1">{{ $activeUsers }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_user_follow_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Verified Users -->
        <div class="card bg-info text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Email Verified</p>
                        <p class="text-3xl font-bold mt-1">{{ $verifiedUsers }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_check_circle_line"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Users with Custom Permissions -->
        <div class="card bg-purple-600 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Custom Permissions</p>
                        <p class="text-3xl font-bold mt-1">{{ $usersWithCustomPermissions }}</p>
                    </div>
                    <div class="text-4xl">
                        <i class="mgc_safe_lock_line"></i>
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
                    <p class="card-title">Daftar Users</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kelola users, roles, dan custom permissions
                    </p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-refresh"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
                        <i class="mgc_refresh_2_line"></i>
                    </button>
                    <button id="btn-create-user"
                        class="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                        <i class="mgc_add_line mr-2"></i>
                        Tambah User
                    </button>
                </div>
            </div>
        </div>
        <div class="p-6">
            <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">
                Showing <span id="data-count">0</span> users. Click pada user untuk edit roles dan permissions.
            </p>
            <!-- Table -->
            <div id="table-users" class="w-full overflow-x-auto"></div>
        </div>
    </div>

    <!-- Modal Create/Edit User -->
    <div id="userModal" class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out"
        style="opacity: 0;">
        <!-- Backdrop -->
        <div id="userModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <!-- Modal Content -->
        <div class="relative min-h-screen w-full flex items-center justify-center px-4 py-6 sm:py-12">
            <div id="userModalContent"
                class="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">

                <!-- Header -->
                <div
                    class="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-blue-700 dark:border-blue-900">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <i id="userModalIcon" class="mgc_user_add_line text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 id="userModalTitle" class="text-lg sm:text-xl font-bold text-white">Tambah User</h3>
                            <p class="text-xs sm:text-sm text-blue-100">Lengkapi data user baru</p>
                        </div>
                    </div>
                    <button type="button" id="userModalClose"
                        class="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors duration-200">
                        <i class="mgc_close_line text-xl"></i>
                    </button>
                </div>

                <!-- Form Content -->
                <form id="form-user" class="overflow-y-auto" style="max-height: calc(90vh - 140px);">
                    @csrf
                    <input type="hidden" id="userId" name="user_id">
                    <input type="hidden" id="userMethod" name="_method" value="POST">

                    <div class="px-6 sm:px-8 py-6 space-y-5">
                        <!-- Name Field -->
                        <div class="space-y-2">
                            <label for="userName"
                                class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <i class="mgc_user_3_line text-blue-600 dark:text-blue-400"></i>
                                Nama User
                                <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="userName" name="name" placeholder="Masukkan nama lengkap user"
                                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400">
                            <p id="error-name" class="text-red-500 text-xs mt-1.5 flex items-center gap-1"></p>
                        </div>

                        <!-- Email Field -->
                        <div class="space-y-2">
                            <label for="userEmail"
                                class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <i class="mgc_mail_line text-blue-600 dark:text-blue-400"></i>
                                Email
                                <span class="text-red-500">*</span>
                            </label>
                            <input type="email" id="userEmail" name="email" placeholder="user@example.com"
                                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400">
                            <p id="error-email" class="text-red-500 text-xs mt-1.5 flex items-center gap-1"></p>
                        </div>

                        <!-- Password Field -->
                        <div class="space-y-2">
                            <label for="userPassword"
                                class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <i class="mgc_lock_line text-blue-600 dark:text-blue-400"></i>
                                Password
                                <span id="passwordRequired" class="text-red-500">*</span>
                            </label>
                            <input type="password" id="userPassword" name="password" placeholder="Minimal 8 karakter"
                                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400">
                            <p id="error-password" class="text-red-500 text-xs mt-1.5 flex items-center gap-1"></p>
                        </div>

                        <!-- Password Confirmation Field -->
                        <div class="space-y-2">
                            <label for="userPasswordConfirmation"
                                class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <i class="mgc_lock_line text-blue-600 dark:text-blue-400"></i>
                                Konfirmasi Password
                                <span id="passwordConfirmRequired" class="text-red-500">*</span>
                            </label>
                            <input type="password" id="userPasswordConfirmation" name="password_confirmation"
                                placeholder="Ulangi password"
                                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400">
                            <p id="error-password_confirmation"
                                class="text-red-500 text-xs mt-1.5 flex items-center gap-1"></p>
                        </div>

                        <!-- Divider -->
                        <div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

                        <!-- Location Field -->
                        <div class="space-y-2">
                            <label for="userLocation"
                                class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <i class="mgc_location_line text-blue-600 dark:text-blue-400"></i>
                                Lokasi
                            </label>
                            <select id="userLocation" name="location_id"
                                class="search-select w-full border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                                <option value="">-- Pilih Lokasi --</option>
                                @foreach ($locations ?? [] as $location)
                                    <option value="{{ $location->id }}">{{ $location->name }}</option>
                                @endforeach
                            </select>
                            <p id="error-location_id" class="text-red-500 text-xs mt-1.5 flex items-center gap-1"></p>
                        </div>

                        <!-- Role Field -->
                        <div class="space-y-2">
                            <label for="userRole"
                                class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <i class="mgc_safety_certificate_line text-blue-600 dark:text-blue-400"></i>
                                Role
                                <span class="text-red-500">*</span>
                            </label>
                            <select id="userRole" name="role"
                                class="search-select w-full border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                                <option value="">-- Pilih Role --</option>
                                @foreach ($roles ?? [] as $role)
                                    <option value="{{ $role->id }}">{{ $role->name }}</option>
                                @endforeach
                            </select>
                            <p id="error-role" class="text-red-500 text-xs mt-1.5 flex items-center gap-1"></p>
                        </div>

                        <!-- Status Field -->
                        <div class="space-y-2">
                            <label for="userStatus"
                                class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <i class="mgc_toggle_left_2_line text-blue-600 dark:text-blue-400"></i>
                                Status
                                <span class="text-red-500">*</span>
                            </label>
                            <select id="userStatus" name="is_active"
                                class="search-select w-full border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                                <option value="">-- Pilih Status --</option>
                                @foreach ($statuses ?? [] as $status)
                                    <option value="{{ $status['id'] }}">{{ $status['name'] }}</option>
                                @endforeach
                            </select>
                            <p id="error-is_active" class="text-red-500 text-xs mt-1.5 flex items-center gap-1"></p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div
                        class="sticky bottom-0 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-gray-700 px-6 sm:px-8 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                        <button type="button" id="userModalCancel"
                            class="w-full sm:w-auto px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200 font-medium text-sm">
                            Batal
                        </button>
                        <button type="submit"
                            class="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg">
                            <span class="inline-flex items-center gap-2">
                                <i class="mgc_check_line"></i>
                                Simpan User
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Permissions -->
    <div id="userPermissionsModal"
        class="fixed inset-0 z-50 hidden overflow-y-auto transition-opacity duration-300 ease-out" style="opacity: 0;">
        <!-- Backdrop -->
        <div id="userPermissionsModalBackdrop"
            class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ease-out"
            style="opacity: 0;"></div>

        <!-- Modal Content -->
        <div class="relative min-h-screen w-full flex items-center justify-center px-4 py-6 sm:py-12">
            <div id="userPermissionsModalContent"
                class="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-2xl transition-all duration-300 ease-out transform"
                style="transform: scale(0.95); opacity: 0;">

                <!-- Header -->
                <div
                    class="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-purple-700 dark:border-purple-900">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <i class="mgc_safe_lock_line text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-lg sm:text-xl font-bold text-white">
                                Kelola Permissions
                            </h3>
                            <p class="text-xs sm:text-sm text-purple-100">
                                User: <span id="permissionsUserName" class="font-semibold">-</span>
                            </p>
                        </div>
                    </div>
                    <button type="button" id="userPermissionsModalClose"
                        class="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors duration-200">
                        <i class="mgc_close_line text-xl"></i>
                    </button>
                </div>

                <!-- Form Content -->
                <form id="form-user-permissions" method="POST" class="overflow-y-auto"
                    style="max-height: calc(90vh - 140px);">
                    @csrf
                    <input type="hidden" id="permissionsUserId" name="user_id">

                    <div class="px-6 sm:px-8 py-6 space-y-6">
                        <!-- Role Permissions Section -->
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                                    <h4 class="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                                        Permissions dari Role
                                    </h4>
                                </div>
                                <button type="button" id="toggleRolePermissions"
                                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
                                    title="Minimize/Expand">
                                    <i class="mgc_minimize_line text-sm" id="toggleRoleIcon"></i>
                                    <span id="toggleRoleText">Minimize</span>
                                </button>
                            </div>
                            <div id="rolePermissionsWrapper" class="transition-all duration-300 ease-in-out"
                                style="max-height: 288px; overflow: hidden;">
                                <p class="text-xs text-gray-600 dark:text-gray-400 ml-4 mb-3">
                                    Permissions yang didapatkan user dari role yang diberikan (read-only)
                                </p>
                                <div id="rolePermissionsContainer"
                                    class="ml-4 space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-h-60 overflow-y-auto">
                                    <div class="flex items-center justify-center py-6">
                                        <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <i class="mgc_loading_line animate-spin"></i>
                                            Loading permissions...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Divider -->
                        <div class="border-t border-gray-200 dark:border-gray-700"></div>

                        <!-- Custom Permissions Section -->
                        <div class="space-y-3">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400"></div>
                                <h4 class="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                                    Custom Permissions
                                </h4>
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400 ml-4">
                                Permissions tambahan yang diberikan langsung kepada user (dapat diedit)
                            </p>
                            <div id="customPermissionsContainer"
                                class="ml-4 space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50 overflow-y-auto"
                                style="max-height: 450px;">
                                <div class="flex items-center justify-center py-6">
                                    <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <i class="mgc_loading_line animate-spin"></i>
                                        Loading permissions...
                                    </span>
                                </div>
                            </div>
                            <p id="error-permissions" class="text-red-500 text-xs mt-2 flex items-center gap-1"></p>
                        </div>

                        <!-- Info Box -->
                        <div
                            class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div class="flex gap-3">
                                <i
                                    class="mgc_info_line text-amber-600 dark:text-amber-400 flex-shrink-0 text-lg mt-0.5"></i>
                                <p class="text-xs text-amber-800 dark:text-amber-200">
                                    <span class="font-semibold">Tips:</span> Permissions dari role bersifat otomatis dan
                                    tidak dapat diubah. Gunakan custom permissions untuk memberikan akses tambahan atau
                                    lebih spesifik.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div
                        class="sticky bottom-0 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-gray-700 px-6 sm:px-8 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                        <button type="button" id="userPermissionsModalCancel"
                            class="w-full sm:w-auto px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200 font-medium text-sm">
                            Tutup
                        </button>
                        <button type="submit"
                            class="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg">
                            <span class="inline-flex items-center gap-2">
                                <i class="mgc_check_line"></i>
                                Simpan Permissions
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
        'resources/js/custom/access/users/users-read.js',
        'resources/js/custom/access/users/users-create.js',
        'resources/js/custom/access/users/users-edit.js',
        'resources/js/custom/access/users/users-delete.js',
    ])
@endsection
