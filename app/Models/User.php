<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Config\Location;
use App\Models\Config\Supplier;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseOrderOnsite;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\Payment;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Class User
 * Model untuk mengelola data pengguna sistem
 * 
 * @package App\Models
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    /**
     * Guard bawaan untuk Spatie Permission.
     */
    protected string $guard_name = 'web';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'location_id',
        'is_active',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'deleted_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Alias status untuk kompatibilitas legacy.
     */
    public function getStatusAttribute(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Setter status agar langsung mengisi is_active.
     */
    public function setStatusAttribute($value): void
    {
        $this->attributes['is_active'] = (bool) $value;
    }

    /**
     * Relasi many-to-one dengan Location
     * User bekerja di satu lokasi
     * 
     * @return BelongsTo
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Relasi one-to-many dengan Supplier
     * User dapat membuat banyak supplier
     * 
     * @return HasMany
     */
    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class, 'created_by');
    }

    /**
     * Relasi one-to-many dengan PurchaseRequest
     * User dapat membuat banyak purchase request
     * 
     * @return HasMany
     */
    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequest::class, 'created_by');
    }

    /**
     * Relasi one-to-many dengan PurchaseOrder
     * User dapat membuat banyak purchase order
     * 
     * @return HasMany
     */
    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'created_by');
    }

    /**
     * Relasi one-to-many dengan PurchaseOrderOnsite
     * User dapat membuat banyak purchase order onsite
     * 
     * @return HasMany
     */
    public function purchaseOrderOnsites(): HasMany
    {
        return $this->hasMany(PurchaseOrderOnsite::class, 'created_by');
    }

    /**
     * Relasi one-to-many dengan Invoice
     * User dapat membuat banyak invoice
     * 
     * @return HasMany
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'created_by');
    }

    /**
     * Relasi one-to-many dengan Payment
     * User dapat membuat banyak pembayaran
     * 
     * @return HasMany
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'created_by');
    }

    /**
     * Check if user is super admin (can access all locations)
     * 
     * @return bool
     */
    public function isSuperAdmin(): bool
    {
        return $this->location_id === null;
    }

    /**
     * Scope untuk filter query berdasarkan location user
     * 
     * @param $query
     * @param null $locationId
     * @return mixed
     */
    public function scopeForLocation($query, $locationId = null)
    {
        if ($this->isSuperAdmin()) {
            return $query;
        }

        return $query->where('location_id', $locationId ?? $this->location_id);
    }
}
