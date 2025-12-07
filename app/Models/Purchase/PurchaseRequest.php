<?php

namespace App\Models\Purchase;

use App\Models\User;
use App\Models\Config\Location;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class PurchaseRequest
 * Model untuk mengelola data purchase request (permintaan pembelian)
 * 
 * @package App\Models\Purchase
 */
class PurchaseRequest extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Tabel yang terhubung dengan model ini
     * 
     * @var string
     */
    protected $table = 'purchase_requests';

    /**
     * Kolom yang dapat diisi secara massal
     * 
     * @var array
     */
    protected $fillable = [
        'request_type',
        'pr_number',
        'location_id',
        'approved_date',
        'notes',
        'created_by',
        'current_stage',
    ];

    /**
     * Kolom yang disembunyikan dari output
     * 
     * @var array
     */
    protected $hidden = ['deleted_at'];

    /**
     * Kolom yang perlu di-cast ke tipe data tertentu
     * 
     * @var array
     */
    protected $casts = [
        'approved_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relasi many-to-one dengan Location
     * Purchase request dibuat untuk satu lokasi
     * 
     * @return BelongsTo
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    /**
     * Relasi many-to-one dengan User
     * Purchase request dibuat oleh satu user
     * 
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relasi one-to-many dengan PurchaseRequestItem
     * Satu purchase request dapat memiliki banyak item
     * 
     * @return HasMany
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class, 'purchase_request_id');
    }

    /**
     * Relasi one-to-many dengan PurchaseTracking
     * Satu purchase request dapat memiliki banyak tracking
     * 
     * @return HasMany
     */
    public function trackings(): HasMany
    {
        return $this->hasMany(PurchaseTracking::class, 'purchase_request_id');
    }
}
