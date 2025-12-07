<?php

namespace App\Http\Controllers\User;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionController extends Controller
{
    /**
     * Display a listing of roles and permissions.
     */
    public function index()
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::orderBy('category')->orderBy('name')->get();
        
        // Group permissions by category
        $permissionsByCategory = $permissions->groupBy('category');

        // Build hierarchical (category -> group -> permissions) where group derived from name prefix before first dot
        // Only categories having more than one distinct group will be rendered with subgroup UI
        $permissionsHierarchy = [];
        foreach ($permissions as $perm) {
            $category = $perm->category ?? 'Lainnya';
            // Derive group from permission name (e.g. 'stok.view' => 'stok')
            $nameParts = explode('.', $perm->name);
            $group = $nameParts[0];
            if (!isset($permissionsHierarchy[$category])) {
                $permissionsHierarchy[$category] = [
                    'groups' => [],
                ];
            }
            if (!isset($permissionsHierarchy[$category]['groups'][$group])) {
                $permissionsHierarchy[$category]['groups'][$group] = [];
            }
            $permissionsHierarchy[$category]['groups'][$group][] = $perm;
        }
        // Mark whether category has multiple groups
        foreach ($permissionsHierarchy as $cat => &$data) {
            $data['use_groups'] = count($data['groups']) > 1; // Only show subgroup UI if more than one group
        }
        unset($data);
        
        // Statistics
        $totalRoles = Role::count();
        $totalPermissions = Permission::count();
        $activeRoles = Role::whereHas('users')->count();
        
        return view('menu.user.role-permission', compact(
            'roles',
            'permissions',
            'permissionsByCategory',
            'permissionsHierarchy',
            'totalRoles',
            'totalPermissions',
            'activeRoles'
        ));
    }

    /**
     * Get roles data for DataTable
     */
    public function data()
    {
        $roles = Role::withCount(['users', 'permissions'])->get();

        $rolesJson = $roles->map(function ($role, $index) {
            $badge = '';
            
            // Badge untuk Super Admin
            if ($role->name === 'Super Admin') {
                $badge = '<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full ml-2">
                            <i class="mgc_user_4_line"></i>
                            Admin
                         </span>';
            }

            return [
                'checkbox' => $role->name !== 'Super Admin' ? 
                    '<div class="form-check">
                        <input type="checkbox" class="form-checkbox rounded text-primary" value="' . $role->id . '">
                    </div>' : '',
                'number' => $index + 1,
                'name' => '<div class="flex items-center"><span class="font-semibold text-gray-800 dark:text-white">' . $role->name . '</span>' . $badge . '</div>',
                'users_count' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    <i class="mgc_user_3_line"></i>
                                    ' . $role->users_count . ' Users
                                  </span>',
                'permissions_count' => '<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                          <i class="mgc_shield_line"></i>
                                          ' . $role->permissions_count . ' Permissions
                                        </span>',
                'actions' => $role->name !== 'Super Admin' ? 
                    '<div class="flex gap-2">
                        <button class="btn-manage-permissions inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 hover:shadow-md transition-all duration-200 group"
                            data-role-id="' . $role->id . '"
                            data-role-name="' . $role->name . '">
                            <i class="mgc_settings_4_line transition-transform duration-200"></i>
                            Kelola Permission
                        </button>
                    </div>' : 
                    '<span class="text-xs text-gray-500 italic">Protected</span>',
            ];
        });

        return response()->json($rolesJson);
    }

    /**
     * Store a newly created role.
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

            // Create role with guard_name (required by Spatie)
            $role = Role::create([
                'name' => $validated['name'],
                'guard_name' => 'web'
            ]);

            // Sync permissions if provided
            if (!empty($validated['permissions'])) {
                // Get Permission objects from IDs
                $permissions = Permission::whereIn('id', $validated['permissions'])->get();
                $role->syncPermissions($permissions);
            }

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->performedOn($role)
                ->withProperties(['permissions' => $validated['permissions'] ?? []])
                ->log('Membuat role baru: ' . $role->name);

            if ($request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Role berhasil ditambahkan.',
                    'redirect' => route('role-permission.index')
                ]);
            }

            return redirect()->route('role-permission.index')->with('success', 'Role berhasil ditambahkan.');

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
     * Update the specified role.
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
                // Get Permission objects from IDs
                $permissions = Permission::whereIn('id', $validated['permissions'])->get();
                $role->syncPermissions($permissions);
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

            if ($request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Role berhasil diperbarui.',
                    'redirect' => route('role-permission.index')
                ]);
            }

            return redirect()->route('role-permission.index')->with('success', 'Role berhasil diperbarui.');

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
     * Remove the specified role.
     */
    public function destroy(Role $role)
    {
        // Prevent deleting Super Admin, Kasir, Gudang
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
     * Bulk delete roles
     */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Tidak ada data yang dikirim.'], 400);
        }

        try {
            DB::beginTransaction();

            $protectedRoles = ['Super Admin', 'Kasir', 'Gudang'];
            
            // Get roles to delete (exclude protected roles)
            $roles = Role::whereIn('id', $ids)
                         ->whereNotIn('name', $protectedRoles)
                         ->get();

            $deletedCount = 0;
            $skippedCount = 0;

            foreach ($roles as $role) {
                if ($role->users()->count() > 0) {
                    $skippedCount++;
                    continue;
                }

                activity()
                    ->causedBy(auth()->user())
                    ->log('Menghapus role: ' . $role->name);

                $role->delete();
                $deletedCount++;
            }

            DB::commit();

            $message = "Berhasil menghapus {$deletedCount} role.";
            if ($skippedCount > 0) {
                $message .= " {$skippedCount} role dilewati karena masih memiliki user.";
            }

            return response()->json([
                'success' => true,
                'message' => $message
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
     * Get permissions for a specific role
     */
    public function getPermissions(Role $role)
    {
        $rolePermissions = $role->permissions->pluck('id')->toArray();
        $allPermissions = Permission::orderBy('category')->orderBy('name')->get();
        $permissionsByCategory = $allPermissions->groupBy('category');

        // Build hierarchy for AJAX consumption
        $permissionsHierarchy = [];
        foreach ($allPermissions as $perm) {
            $category = $perm->category ?? 'Lainnya';
            $nameParts = explode('.', $perm->name);
            $group = $nameParts[0];
            if (!isset($permissionsHierarchy[$category])) {
                $permissionsHierarchy[$category] = [
                    'groups' => [],
                ];
            }
            if (!isset($permissionsHierarchy[$category]['groups'][$group])) {
                $permissionsHierarchy[$category]['groups'][$group] = [];
            }
            $permissionsHierarchy[$category]['groups'][$group][] = $perm;
        }
        foreach ($permissionsHierarchy as $cat => &$data) {
            $data['use_groups'] = count($data['groups']) > 1;
        }
        unset($data);

        return response()->json([
            'success' => true,
            'role' => $role,
            'rolePermissions' => $rolePermissions,
            'permissionsByCategory' => $permissionsByCategory,
            'permissionsHierarchy' => $permissionsHierarchy
        ]);
    }

    /**
     * Assign permissions to role
     */
    public function assignPermissions(Request $request, Role $role)
    {
        // Prevent modifying Super Admin permissions
        if ($role->name === 'Super Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Permissions untuk Super Admin tidak dapat diubah.'
            ], 403);
        }

        $validated = $request->validate([
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            DB::beginTransaction();

            $oldPermissions = $role->permissions->pluck('id')->toArray();
            
            // Sync permissions - empty array will remove all permissions
            $permissionIds = $validated['permissions'] ?? [];
            if (!empty($permissionIds)) {
                // Get Permission objects from IDs
                $permissions = Permission::whereIn('id', $permissionIds)->get();
                $role->syncPermissions($permissions);
            } else {
                // Remove all permissions if empty
                $role->syncPermissions([]);
            }

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->performedOn($role)
                ->withProperties([
                    'old_permissions' => $oldPermissions,
                    'new_permissions' => $permissionIds
                ])
                ->log('Mengubah permissions untuk role: ' . $role->name);

            return response()->json([
                'success' => true,
                'message' => 'Permissions berhasil diperbarui.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error assigning permissions: ' . $e->getMessage(), [
                'role_id' => $role->id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui permissions: ' . $e->getMessage()
            ], 500);
        }
    }
}

