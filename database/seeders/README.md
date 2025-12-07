# Database Seeding Instructions

## Overview
Seeder ini akan membuat:
1. **Permissions** - 60+ permissions dengan kategori
2. **Roles** - 5 roles dengan permission assignments
3. **Users** - 5 default users dengan role assignments

## Struktur Roles & Permissions

### 1. Super Admin
- **Email:** superadmin@purchasing.com
- **Password:** password
- **Permissions:** Semua permissions (full access)
- **Location:** null (tidak terikat lokasi)

### 2. Kasir
- **Email:** kasir@purchasing.com
- **Password:** password
- **Permissions:**
  - Dashboard view
  - Invoice management (view, create, edit, delete)
  - Payment management (view, create, edit, delete)
  - Purchase orders (view only)
  - Suppliers (view only)
  - Reports (view only)

### 3. Gudang
- **Email:** gudang@purchasing.com
- **Password:** password
- **Permissions:**
  - Dashboard view
  - Purchase requests (full CRUD)
  - Purchase orders (full CRUD)
  - Purchase tracking (view, update)
  - PO Onsite (full CRUD)
  - Suppliers (view only)
  - Classifications (view only)
  - Reports (view only)

### 4. Manager
- **Email:** manager@purchasing.com
- **Password:** password
- **Permissions:**
  - Dashboard view
  - Purchase requests (view, approve)
  - Purchase orders (view only)
  - Invoices (view only)
  - Payments (view only)
  - Reports (view, export)
  - Users (view only)
  - Activity log (view)

### 5. Staff
- **Email:** staff@purchasing.com
- **Password:** password
- **Permissions:**
  - Dashboard view
  - Purchase requests (view, create)
  - Suppliers (view only)

## Permission Categories

1. **Dashboard** - Dashboard access
2. **User Management** - Users CRUD & permissions
3. **Role Management** - Roles CRUD
4. **Configuration** - Locations, Suppliers, Classifications
5. **Purchase** - Purchase Requests, Orders, Tracking, Onsite
6. **Invoice** - Invoices & Payments
7. **Reports** - Viewing & exporting reports
8. **System** - Activity logs

## Running the Seeders

### Fresh Migration + Seed (Recommended)
```bash
php artisan migrate:fresh --seed
```

### Run Specific Seeders Only
```bash
# Run all seeders
php artisan db:seed

# Run specific seeders
php artisan db:seed --class=PermissionSeeder
php artisan db:seed --class=RoleSeeder
```

### Reset Permissions Cache
```bash
php artisan permission:cache-reset
```

## Post-Seeding Verification

### Check Permissions
```bash
php artisan tinker

# List all permissions
\Spatie\Permission\Models\Permission::count();
\Spatie\Permission\Models\Permission::pluck('name', 'category');

# Check specific permission
\Spatie\Permission\Models\Permission::where('name', 'users.view')->first();
```

### Check Roles
```bash
php artisan tinker

# List all roles
\Spatie\Permission\Models\Role::with('permissions')->get();

# Check Super Admin permissions
\Spatie\Permission\Models\Role::findByName('Super Admin')->permissions->count();

# Check user role
\App\Models\User::where('email', 'superadmin@purchasing.com')->first()->roles;
```

### Login Test
1. Navigate to login page
2. Use any of the credentials above
3. Verify dashboard access
4. Test permissions based on role

## Permission Structure

Each permission follows the pattern: `{module}.{action}`

Examples:
- `users.view` - Can view users list
- `users.create` - Can create new users
- `users.edit` - Can edit users
- `users.delete` - Can delete users
- `users.permissions` - Can manage custom permissions

## Custom Fields in Permissions Table

- `name` - Permission identifier (e.g., users.view)
- `display_name` - Human-readable name (e.g., View Users)
- `description` - Detailed description
- `category` - Group permissions by module
- `guard_name` - Authentication guard (default: web)

## Notes

1. **Protected Roles:** Super Admin, Kasir, Gudang cannot be deleted via UI
2. **Location Assignment:** All users except Super Admin are assigned to location_id = 1
3. **Email Verification:** All seeded users are pre-verified
4. **Password:** Default password is 'password' for all users
5. **Soft Deletes:** Users use soft deletes, can be restored

## Troubleshooting

### Issue: "Table 'permissions' doesn't exist"
```bash
php artisan migrate
```

### Issue: "Role already exists"
```bash
php artisan migrate:fresh --seed
```

### Issue: "Permission cache not cleared"
```bash
php artisan permission:cache-reset
php artisan optimize:clear
```

### Issue: "Location not found"
Ensure LocationSeeder runs before RoleSeeder:
```bash
php artisan db:seed --class=LocationSeeder
php artisan db:seed --class=RoleSeeder
```

## Development Tips

### Add New Permission
1. Add to PermissionSeeder permissions array
2. Run seeder: `php artisan db:seed --class=PermissionSeeder`
3. Assign to appropriate roles in RoleSeeder
4. Clear cache: `php artisan permission:cache-reset`

### Add New Role
1. Add role definition in RoleSeeder
2. Define permissions array
3. Run seeder: `php artisan db:seed --class=RoleSeeder`

### Test Custom Permissions
```php
$user = User::find(1);
$user->givePermissionTo('users.view');
$user->hasPermissionTo('users.view'); // true
```
