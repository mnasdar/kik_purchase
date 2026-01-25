<?php

namespace App\Http\Controllers\Access;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class ManajemenUserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    /**
     * Display users index page
     */
    public function index()
    {
        $this->authorize('users.view');

        // Statistics untuk users
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();
        $usersWithCustomPermissions = User::whereHas('permissions')->count();
        $roles = Role::select('id', 'name')->orderBy('name')->get();
        $locations = \App\Models\Config\Location::select('id', 'name')->orderBy('name')->get();
        $statuses = collect([
            ['id' => 1, 'name' => 'Aktif'],
            ['id' => 0, 'name' => 'Nonaktif'],
        ]);
        
        return view('menu.access.users.index', compact(
            'totalUsers',
            'activeUsers',
            'verifiedUsers',
            'usersWithCustomPermissions',
            'roles',
            'locations',
            'statuses',
        ));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('users.create');

        // Cek apakah email pernah ada tetapi dihapus (soft delete)
        $existingDeleted = User::withTrashed()
            ->where('email', $request->input('email'))
            ->first();

        if ($existingDeleted && $existingDeleted->trashed() && !$request->boolean('restore_deleted')) {
            return response()->json([
                'restorable' => true,
                'user_id' => $existingDeleted->id,
                'message' => 'User dengan email ini pernah dihapus. Aktifkan kembali?',
            ], 409);
        }

        $validated = $request->validate([
            'role' => ['required', Rule::exists('roles', 'id')],
            'location_id' => ['nullable', Rule::exists('locations', 'id')],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'password' => ['required', 'string', 'confirmed', 'min:8'],
            'is_active' => ['required', 'boolean'],
            'restore_deleted' => ['sometimes', 'boolean'],
        ]);

        try {
            DB::beginTransaction();

            $role = Role::find($validated['role']);
            $user = null;

            // Jika user pernah dihapus dan diminta diaktifkan kembali
            if ($existingDeleted && $existingDeleted->trashed() && $request->boolean('restore_deleted')) {
                // Restore user dan update dengan data baru dari form
                $existingDeleted->restore();
                $existingDeleted->update([
                    'name' => $validated['name'],
                    'location_id' => $validated['location_id'] ?? null,
                    'password' => Hash::make($validated['password']),
                    'is_active' => (bool) $validated['is_active'],
                    'email_verified_at' => Carbon::now(),
                ]);
                
                // Update role dengan role baru dari form
                if ($role) {
                    $existingDeleted->syncRoles([$role->name]);
                }
                
                $user = $existingDeleted;
            } else {
                // Create user baru
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'location_id' => $validated['location_id'] ?? null,
                    'password' => Hash::make($validated['password']),
                    'is_active' => (bool) $validated['is_active'],
                    'email_verified_at' => Carbon::now(),
                ]);

                if ($role) {
                    $user->assignRole($role->name);
                }
            }

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->withProperties([
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $role->name ?? null,
                    'restored' => $request->boolean('restore_deleted'),
                ])
                ->log(($request->boolean('restore_deleted') ? 'Mengaktifkan kembali user: ' : 'Membuat user baru: ') . $user->name);

            Cache::forget('users.data');

            if ($request->ajax()) {
                return response()->json([
                    'message' => $request->boolean('restore_deleted')
                        ? 'User berhasil diaktifkan kembali.'
                        : 'User berhasil ditambahkan.',
                    'redirect' => route('users.index'),
                ]);
            }

            return redirect()->route('users.index')->with('success', 'User berhasil ditambahkan.');
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error creating user: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Gagal menambahkan user.',
                    'error' => $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'User gagal ditambahkan.');
        }
    }

    /**
     * Display the specified resource (JSON for edit modal).
     */
    public function show(User $user)
    {
        $role = $user->roles->first();
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'location_id' => $user->location_id,
            'role_id' => $role ? $role->id : null,
            'is_active' => $user->is_active ? 1 : 0,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $this->authorize('users.edit');

        $validated = $request->validate([
            'role' => ['required', Rule::exists('roles', 'id')],
            'location_id' => ['nullable', Rule::exists('locations', 'id')],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($user->id)
                    ->whereNull('deleted_at'),
            ],
            'password' => ['nullable', 'string', 'confirmed', 'min:8'],
            'is_active' => ['required', 'boolean'],
        ]);

        // return $user;

        try {
            DB::beginTransaction();

            $oldData = $user->only(['name', 'email', 'is_active']);

            // Assign role
            $role = Role::find($validated['role']);
            if ($role) {
                $user->syncRoles([$role->name]);
            }

            // Siapkan data update
            $updateData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'location_id' => $validated['location_id'] ?? null,
                'is_active' => (bool) $validated['is_active'],
            ];

            // Update password hanya jika diisi
            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $logNew = $updateData;
            unset($logNew['password']);

            // return $updateData;

            $user->update($updateData);

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->withProperties([
                    'old' => $oldData,
                    'new' => $logNew,
                ])
                ->log('Mengupdate user: ' . $user->name);

            Cache::forget('users.data');

            if ($request->ajax()) {
                return response()->json([
                    'message' => 'User berhasil disimpan.',
                    'redirect' => route('users.index'),
                ]);
            }

            return redirect()->route('users.index')->with('success', 'User berhasil disimpan.');
        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->ajax()) {
                return response()->json([
                    'message' => 'Gagal menyimpan user.',
                    'error' => $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'User gagal disimpan.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $this->authorize('users.delete');

        try {
            DB::beginTransaction();

            $userName = $user->name;
            $userEmail = $user->email;

            // Soft delete user
            $user->delete();

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->withProperties([
                    'name' => $userName,
                    'email' => $userEmail,
                ])
                ->log('Menghapus user: ' . $userName);

            Cache::forget('users.data');

            return response()->json([
                'success' => true,
                'message' => 'User berhasil dihapus.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error deleting user: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user permissions structured by menu (for modal display)
     */
    public function getPermissionsStructured(User $user)
    {
        $rolePermissions = $user->getPermissionsViaRoles();
        $customPermissions = $user->permissions;
        $permissions = Permission::all();
        
        // Permission structure sesuai menu sidebar
        $structured = [
            [
                'menu' => 'Dashboard',
                'icon' => 'mgc_home_3_line',
                'order' => 1,
                'permissions' => $permissions->where('category', 'Dashboard')->values()->all(),
                'rolePermissions' => $rolePermissions->where('category', 'Dashboard')->values()->all(),
            ],
            [
                'menu' => 'Purchase',
                'icon' => 'mgc_shopping_cart_2_line',
                'order' => 2,
                'submenus' => [
                    [
                        'submenu' => 'PR (Purchase Request)',
                        'permissions' => $permissions->filter(function($p) {
                            return $p->category === 'Purchase' && strpos($p->name, 'purchase-requests') !== false;
                        })->values()->all(),
                    ],
                    [
                        'submenu' => 'PO (Purchase Order)',
                        'permissions' => $permissions->filter(function($p) {
                            return $p->category === 'Purchase' && strpos($p->name, 'purchase-orders') !== false;
                        })->values()->all(),
                    ],
                ]
            ],
            [
                'menu' => 'Invoice',
                'icon' => 'mgc_bill_line',
                'order' => 3,
                'submenus' => [
                    [
                        'submenu' => 'Dari Vendor',
                        'permissions' => $permissions->filter(function($p) {
                            return strpos($p->name, 'invoices.dari-vendor') !== false;
                        })->values()->all(),
                    ],
                    [
                        'submenu' => 'Pengajuan',
                        'permissions' => $permissions->filter(function($p) {
                            return strpos($p->name, 'invoices.pengajuan') !== false;
                        })->values()->all(),
                    ],
                    [
                        'submenu' => 'Pembayaran',
                        'permissions' => $permissions->filter(function($p) {
                            return strpos($p->name, 'invoices.pembayaran') !== false;
                        })->values()->all(),
                    ],
                ]
            ],
            [
                'menu' => 'Konfigurasi',
                'icon' => 'mgc_settings_1_line',
                'order' => 4,
                'submenus' => [
                    [
                        'submenu' => 'Klasifikasi',
                        'permissions' => $permissions->filter(function($p) {
                            return strpos($p->name, 'classifications') !== false;
                        })->values()->all(),
                    ],
                    [
                        'submenu' => 'Unit Kerja',
                        'permissions' => $permissions->filter(function($p) {
                            return strpos($p->name, 'locations') !== false;
                        })->values()->all(),
                    ],
                    [
                        'submenu' => 'Supplier',
                        'permissions' => $permissions->filter(function($p) {
                            return strpos($p->name, 'suppliers') !== false;
                        })->values()->all(),
                    ],
                ]
            ],
            [
                'menu' => 'Export Data',
                'icon' => 'mgc_file_export_line',
                'order' => 5,
                'permissions' => $permissions->filter(function($p) {
                    return strpos($p->name, 'reports.export') !== false;
                })->values()->all(),
            ],
            [
                'menu' => 'Manajemen Akses',
                'icon' => 'mgc_shield_line',
                'order' => 6,
                'isDivider' => true,
                'submenus' => [
                    [
                        'submenu' => 'Roles',
                        'permissions' => $permissions->filter(function($p) {
                            return strpos($p->name, 'roles') !== false;
                        })->values()->all(),
                    ],
                    [
                        'submenu' => 'Users',
                        'permissions' => $permissions->filter(function($p) {
                            return strpos($p->name, 'users') !== false;
                        })->values()->all(),
                    ],
                    [
                        'submenu' => 'Activity Log',
                        'permissions' => $permissions->filter(function($p) {
                            return strpos($p->name, 'activity-log') !== false;
                        })->values()->all(),
                    ],
                ]
            ],
        ];

        return response()->json([
            'success' => true,
            'user' => $user->load('roles'),
            'rolePermissions' => $rolePermissions,
            'customPermissions' => $customPermissions,
            'structured' => $structured,
        ]);
    }

    /**
     * Update custom permissions untuk user tertentu
     */
    public function updateUserPermissions(Request $request, User $user)
    {
        $validated = $request->validate([
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            DB::beginTransaction();

            $oldPermissions = $user->permissions->pluck('id')->toArray();
            
            // Sync hanya custom permissions (bukan dari role)
            $permissionIds = $validated['permissions'] ?? [];
            if (!empty($permissionIds)) {
                $permissions = Permission::whereIn('id', $permissionIds)->get();
                $user->syncPermissions($permissions);
            } else {
                $user->syncPermissions([]);
            }

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->withProperties([
                    'old_permissions' => $oldPermissions,
                    'new_permissions' => $permissionIds
                ])
                ->log('Mengubah custom permissions untuk user: ' . $user->name);

            Cache::forget('users.data');

            return response()->json([
                'success' => true,
                'message' => 'Custom permissions berhasil diperbarui.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error updating user permissions: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui permissions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users data untuk DataTable
     */
    public function dataUsers()
    {
        $users = Cache::remember('users.data', 3600, function () {
            return User::with(['roles', 'permissions'])->orderBy('updated_at', 'desc')->get();
        });

        $userJson = $users->map(function ($item, $index) {
            // Badge untuk user baru/update
            $badge = '';
            if ($item->is_new) {
                $badge = '<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-success rounded-full ml-2"><i class="mgc_sparkles_line"></i>New</span>';
            } elseif ($item->is_update) {
                $badge = '<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-warning rounded-full ml-2"><i class="mgc_refresh_1_line"></i>Update</span>';
            }

            // Role dengan badge khusus untuk Super Admin
            $role = $item->getRoleNames()->first() ?? '-';
            $roleBadge = '';
            if ($role === 'Super Admin') {
                $roleBadge = '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-purple-600 rounded-lg"><i class="mgc_user_4_line"></i>' . $role . '</span>';
            } elseif ($role === 'Kasir') {
                $roleBadge = '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-lg"><i class="mgc_receive_money_line"></i>' . $role . '</span>';
            } elseif ($role === 'Gudang') {
                $roleBadge = '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-lg"><i class="mgc_home_4_line"></i>' . $role . '</span>';
            } else {
                $roleBadge = '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-gray-600 rounded-lg"><i class="mgc_user_3_line"></i>' . $role . '</span>';
            }

            return [
                'number' => ($index + 1),
                'name' => '<div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                                <i class="mgc_user_3_line text-primary-600 dark:text-primary-400"></i>
                            </div>
                            <span class="font-medium text-gray-800 dark:text-white">' . $item->name . '</span>
                            ' . $badge . '
                          </div>',
                'email' => '<span class="text-sm text-gray-600 dark:text-gray-400">' . ($item->email ?? '-') . '</span>',
                'verify' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium ' . ($item->email_verified_at ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300') . '">' .
                    ($item->email_verified_at ? '<i class="mgc_check_line"></i>Verified' : '<i class="mgc_close_line"></i>Unverified')
                    . '</span>',
                'role' => $roleBadge,
                'status' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium ' . ($item->is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300') . '"><i class="' . ($item->is_active ? 'mgc_check_circle_line' : 'mgc_close_circle_line') . '"></i>' . ($item->is_active ? 'Aktif' : 'Nonaktif') . '</span>',
                'actions' => '<div class="flex items-center gap-2">
                    <button type="button" class="btn-edit-user inline-flex items-center justify-center h-8 w-8 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors" 
                        data-user-id="' . $item->id . '" 
                        title="Edit User" tabindex="0" data-plugin="tippy" data-tippy-placement="top" data-tippy-arrow="true" data-tippy-animation="shift-away">
                        <i class="mgc_edit_line"></i>
                    </button>
                    <button type="button" class="btn-permissions-user inline-flex items-center justify-center h-8 w-8 rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors" 
                        data-user-id="' . $item->id . '" 
                        data-user-name="' . $item->name . '" 
                        title="Kelola Permissions" tabindex="0" data-plugin="tippy" data-tippy-placement="top" data-tippy-arrow="true" data-tippy-animation="shift-away">
                        <i class="mgc_safe_lock_line"></i>
                    </button>
                    <button type="button" class="btn-delete-user inline-flex items-center justify-center h-8 w-8 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors" 
                        data-user-id="' . $item->id . '" 
                        data-user-name="' . $item->name . '" 
                        title="Hapus User" tabindex="0" data-plugin="tippy" data-tippy-placement="top" data-tippy-arrow="true" data-tippy-animation="shift-away">
                        <i class="mgc_delete_line"></i>
                    </button>
                </div>',
            ];
        });

        return response()->json($userJson);
    }

}
