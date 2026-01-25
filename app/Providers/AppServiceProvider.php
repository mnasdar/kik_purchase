<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Blade::directive('numeric', function ($money) {
            return "<?php echo number_format($money); ?>";
        });

        /**
         * ===== Authorization Blade Directives =====
         */

        // @can('permission.name') ... @endcan (sudah built-in Laravel)
        // Tetapi kita tambahkan dengan custom handling

        /**
         * Check if user has permission
         * Usage: @haspermission('permission.name')
         */
        Blade::directive('haspermission', function ($permission) {
            return "<?php if (auth()->check() && auth()->user()->hasPermissionTo({$permission})): ?>";
        });

        Blade::directive('endhaspermission', function () {
            return "<?php endif; ?>";
        });

        /**
         * Check if user has any of permissions
         * Usage: @hasanypermission('permission1|permission2|permission3')
         */
        Blade::directive('hasanypermission', function ($permissions) {
            return "<?php \$permissions = explode('|', {$permissions}); if (auth()->check() && \\App\\Helpers\\AuthorizationHelper::hasPermission(\$permissions)): ?>";
        });

        Blade::directive('endhasanypermission', function () {
            return "<?php endif; ?>";
        });

        /**
         * Check if user has all permissions
         * Usage: @hasallpermissions('permission1|permission2|permission3')
         */
        Blade::directive('hasallpermissions', function ($permissions) {
            return "<?php \$permissions = explode('|', {$permissions}); if (auth()->check() && \\App\\Helpers\\AuthorizationHelper::hasAllPermissions(\$permissions)): ?>";
        });

        Blade::directive('endhasallpermissions', function () {
            return "<?php endif; ?>";
        });

        /**
         * Check if user has role
         * Usage: @hasrole('Role Name')
         */
        Blade::directive('hasrole', function ($role) {
            return "<?php if (auth()->check() && auth()->user()->hasRole({$role})): ?>";
        });

        Blade::directive('endhasrole', function () {
            return "<?php endif; ?>";
        });

        /**
         * Check if user is super admin
         * Usage: @issuperadmin ... @endissuperadmin
         */
        Blade::directive('issuperadmin', function () {
            return "<?php if (\\App\\Helpers\\AuthorizationHelper::isSuperAdmin()): ?>";
        });

        Blade::directive('endissuperadmin', function () {
            return "<?php endif; ?>";
        });

        /**
         * Guest check
         * Usage: @guest ... @endguest (built-in, but include for reference)
         */
        Blade::directive('notguest', function () {
            return "<?php if (auth()->check()): ?>";
        });

        Blade::directive('endnotguest', function () {
            return "<?php endif; ?>";
        });
    }
}
