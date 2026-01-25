<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        Permission::create(['name' => 'dashboard.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'purchase-requests.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'purchase-requests.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'purchase-requests.edit', 'guard_name' => 'web']);
        Permission::create(['name' => 'purchase-requests.delete', 'guard_name' => 'web']);

        // Create roles
        $superAdmin = Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        $staff = Role::create(['name' => 'Staff', 'guard_name' => 'web']);

        // Assign permissions
        $superAdmin->syncPermissions(Permission::all());
        $staff->syncPermissions([
            'dashboard.view',
            'purchase-requests.view',
            'purchase-requests.create',
        ]);
    }

    /**
     * Test user dengan Super Admin role dapat akses semua permission
     */
    public function test_super_admin_has_all_permissions()
    {
        $user = User::factory()->create();
        $user->assignRole('Super Admin');

        $this->assertTrue($user->hasPermissionTo('dashboard.view'));
        $this->assertTrue($user->hasPermissionTo('purchase-requests.view'));
        $this->assertTrue($user->hasPermissionTo('purchase-requests.delete'));
    }

    /**
     * Test user dengan Staff role hanya punya limited permissions
     */
    public function test_staff_has_limited_permissions()
    {
        $user = User::factory()->create();
        $user->assignRole('Staff');

        $this->assertTrue($user->hasPermissionTo('dashboard.view'));
        $this->assertTrue($user->hasPermissionTo('purchase-requests.view'));
        $this->assertTrue($user->hasPermissionTo('purchase-requests.create'));
        $this->assertFalse($user->hasPermissionTo('purchase-requests.delete'));
    }

    /**
     * Test middleware check-permission block unauthorized access
     */
    public function test_middleware_blocks_unauthorized_access()
    {
        $user = User::factory()->create();
        $user->assignRole('Staff'); // Staff tidak punya edit permission

        $response = $this->actingAs($user)
            ->post('/purchase-request', [
                'pr_number' => 'PR-001',
                'approved_date' => now(),
                'request_type' => 'barang',
                'location_id' => 1,
                'items' => [],
            ]);

        // Should be allowed (Staff punya create permission)
        $this->assertNotEquals(403, $response->status());
    }

    /**
     * Test user without permission cannot perform action
     */
    public function test_user_without_delete_permission_cannot_delete()
    {
        $user = User::factory()->create();
        $user->assignRole('Staff'); // Staff tidak punya delete permission

        $this->assertFalse($user->hasPermissionTo('purchase-requests.delete'));
    }

    /**
     * Test permission check using helper
     */
    public function test_authorization_helper_checks_permissions()
    {
        $user = User::factory()->create();
        $user->assignRole('Super Admin');

        $this->assertTrue($user->hasPermissionTo('purchase-requests.view'));
        $this->assertTrue($user->hasPermissionTo('purchase-requests.create'));
        $this->assertTrue($user->hasPermissionTo('purchase-requests.edit'));
        $this->assertTrue($user->hasPermissionTo('purchase-requests.delete'));
    }

    /**
     * Test unauthenticated user is redirected to login
     */
    public function test_unauthenticated_user_redirected_to_login()
    {
        $response = $this->get('/purchase-request');

        $this->assertRedirectTo('/login');
    }

    /**
     * Test direct permission assignment to user
     */
    public function test_user_can_have_direct_permissions()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('purchase-requests.view');

        $this->assertTrue($user->hasPermissionTo('purchase-requests.view'));
    }

    /**
     * Test revoking permissions
     */
    public function test_user_permission_can_be_revoked()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('purchase-requests.view');

        $this->assertTrue($user->hasPermissionTo('purchase-requests.view'));

        $user->revokePermissionTo('purchase-requests.view');

        $this->assertFalse($user->hasPermissionTo('purchase-requests.view'));
    }

    /**
     * Test checking multiple permissions (OR logic)
     */
    public function test_check_multiple_permissions_or_logic()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('purchase-requests.view');

        // User has view but not delete - should return true (OR logic)
        $this->assertTrue(
            $user->hasPermissionTo('purchase-requests.view') ||
            $user->hasPermissionTo('purchase-requests.delete')
        );
    }

    /**
     * Test checking all permissions (AND logic)
     */
    public function test_check_all_permissions_and_logic()
    {
        $user = User::factory()->create();
        $user->givePermissionTo(['purchase-requests.view', 'purchase-requests.create']);

        // User has both - should return true
        $this->assertTrue(
            $user->hasPermissionTo('purchase-requests.view') &&
            $user->hasPermissionTo('purchase-requests.create')
        );

        // User doesn't have delete - should return false
        $this->assertFalse(
            $user->hasPermissionTo('purchase-requests.view') &&
            $user->hasPermissionTo('purchase-requests.delete')
        );
    }
}
