<?php

namespace App\Http\Controllers\Access;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesController extends Controller
{
    /**
     * Display roles index page dengan statistics
     */
    public function index()
    {
        $totalRoles = Role::count();
        $totalPermissions = Permission::count();
        $rolesWithUsers = Role::whereHas('users')->count();
        $protectedRoles = Role::whereIn('name', ['Super Admin', 'Kasir', 'Gudang'])->count();
        
        return view('menu.access.roles.index', compact(
            'totalRoles',
            'totalPermissions',
            'rolesWithUsers',
            'protectedRoles'
        ));
    }

    /**
     * Store role baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            DB::beginTransaction();

            // Create role dengan guard_name
            $role = Role::create([
                'name' => $validated['name'],
                'guard_name' => 'web'
            ]);

            // Sync permissions jika ada
            if (!empty($validated['permissions'])) {
                $permissions = Permission::whereIn('id', $validated['permissions'])->get();
                $role->syncPermissions($permissions);
            }

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->performedOn($role)
                ->withProperties(['permissions' => $validated['permissions'] ?? []])
                ->log('Membuat role baru: ' . $role->name);

            Cache::forget('roles.data');

            if ($request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Role berhasil ditambahkan.',
                    'redirect' => route('roles.index')
                ]);
            }

            return redirect()->route('roles.index')->with('success', 'Role berhasil ditambahkan.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error creating role: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal menambahkan role: ' . $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'Gagal menambahkan role.');
        }
    }



    /**
     * Update role
     */
    public function update(Request $request, Role $role)
    {
        // Prevent updating Super Admin
        if ($role->name === 'Super Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Role Super Admin tidak dapat diubah.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            DB::beginTransaction();

            $oldName = $role->name;
            $oldPermissions = $role->permissions->pluck('id')->toArray();

            $role->update(['name' => $validated['name']]);

            if (isset($validated['permissions'])) {
                $permissions = Permission::whereIn('id', $validated['permissions'])->get();
                $role->syncPermissions($permissions);
            } else {
                $role->syncPermissions([]);
            }

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->performedOn($role)
                ->withProperties([
                    'old' => [
                        'name' => $oldName,
                        'permissions' => $oldPermissions
                    ],
                    'new' => [
                        'name' => $validated['name'],
                        'permissions' => $validated['permissions'] ?? []
                    ]
                ])
                ->log('Mengupdate role: ' . $role->name);

            Cache::forget('roles.data');

            if ($request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Role berhasil diperbarui.',
                    'redirect' => route('roles.index')
                ]);
            }

            return redirect()->route('roles.index')->with('success', 'Role berhasil diperbarui.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error updating role: ' . $e->getMessage(), [
                'role_id' => $role->id,
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal memperbarui role: ' . $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'Gagal memperbarui role.');
        }
    }

    /**
     * Delete role
     */
    public function destroy(Role $role)
    {
        // Prevent deleting protected roles
        $protectedRoles = ['Super Admin', 'Kasir', 'Gudang'];
        
        if (in_array($role->name, $protectedRoles)) {
            return response()->json([
                'success' => false,
                'message' => 'Role ' . $role->name . ' tidak dapat dihapus.'
            ], 403);
        }

        try {
            DB::beginTransaction();

            // Check if role has users
            if ($role->users()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role tidak dapat dihapus karena masih memiliki user.'
                ], 400);
            }

            $roleName = $role->name;
            $role->delete();

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->log('Menghapus role: ' . $roleName);

            Cache::forget('roles.data');

            return response()->json([
                'success' => true,
                'message' => 'Role berhasil dihapus.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get roles data untuk DataTable
     */
    public function dataRoles()
    {
        $roles = Cache::remember('roles.data', 3600, function () {
            return Role::withCount(['users', 'permissions'])->orderBy('name')->get();
        });

        $rolesJson = $roles->map(function ($role, $index) {
            $badge = '';
            
            // Badge untuk Super Admin
            if ($role->name === 'Super Admin') {
                $badge = '<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full ml-2">
                            <i class="mgc_shield_star_line"></i>
                            Protected
                         </span>';
            }

            return [
                'number' => $index + 1,
                'name' => '<div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                <i class="mgc_shield_line text-blue-600 dark:text-blue-400"></i>
                            </div>
                            <span class="font-medium text-gray-800 dark:text-white">' . $role->name . '</span>' . $badge . '
                          </div>',
                'permissions_count' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                          <i class="mgc_checkbox_line"></i>
                                          ' . $role->permissions_count . ' Permissions
                                        </span>',
                'users_count' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    <i class="mgc_user_3_line"></i>
                                    ' . $role->users_count . ' Users
                                  </span>',
                'actions' => $role->name !== 'Super Admin' ? 
                    '<div class="flex items-center gap-2">
                        <button type="button" class="btn-edit-role inline-flex items-center justify-center h-8 w-8 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors" 
                            data-role-id="' . $role->id . '" 
                            title="Edit Role" tabindex="0" data-plugin="tippy" data-tippy-placement="top" data-tippy-arrow="true" data-tippy-animation="shift-away">
                            <i class="mgc_edit_line"></i>
                        </button>
                        <button type="button" class="btn-delete-role inline-flex items-center justify-center h-8 w-8 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors" 
                            data-role-id="' . $role->id . '" 
                            data-role-name="' . $role->name . '" 
                            title="Hapus Role" tabindex="0" data-plugin="tippy" data-tippy-placement="top" data-tippy-arrow="true" data-tippy-animation="shift-away">
                            <i class="mgc_delete_line"></i>
                        </button>
                    </div>' : 
                    '<span class="text-xs text-gray-500 dark:text-gray-400 italic">Protected</span>',
            ];
        });

        return response()->json($rolesJson);
    }

    /**
     * Get role permissions
     */
    public function getPermissions(Role $role)
    {
        $rolePermissions = $role->permissions;
        $allPermissions = Permission::orderBy('category')->orderBy('name')->get();
        $categories = $allPermissions->pluck('category')->unique()->sort()->values();

        return response()->json([
            'success' => true,
            'role' => $role,
            'permissions' => $rolePermissions,
            'allPermissions' => $allPermissions,
            'categories' => $categories,
        ]);
    }



    /**
     * Get all permissions as JSON for API
     */
    public function apiPermissions()
    {
        $permissions = Permission::orderBy('category')->orderBy('name')->get();
        $categories = $permissions->pluck('category')->unique()->sort()->values();

        return response()->json([
            'permissions' => $permissions,
            'categories' => $categories
        ]);
    }
}
