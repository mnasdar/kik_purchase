<?php

namespace App\Models\Config;

use App\Models\Purchase\PurchaseRequestItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class Classification
 * Model untuk mengelola data klasifikasi barang/jasa
 * 
 * @package App\Models\Config
 */
class Classification extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Tabel yang terhubung dengan model ini
     * 
     * @var string
     */
    protected $table = 'classifications';

    /**
     * Kolom yang dapat diisi secara massal
     * 
     * @var array
     */
    protected $fillable = ['name'];

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
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relasi one-to-many dengan PurchaseRequestItem
     * Satu klasifikasi dapat memiliki banyak item purchase request
     * 
     * @return HasMany
     */
    public function purchaseRequestItems(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class, 'classification_id');
    }
}
