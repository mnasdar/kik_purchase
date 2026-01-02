<?php

namespace App\Models\Purchase;

use App\Models\Config\Classification;
use Illuminate\Database\Eloquent\Model;
use App\Models\Purchase\PurchaseOrderItem;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class PurchaseRequestItem
 * Model untuk mengelola item/detail dari purchase request
 * 
 * @package App\Models\Purchase
 */
class PurchaseRequestItem extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Tabel yang terhubung dengan model ini
     * 
     * @var string
     */
    protected $table = 'purchase_request_items';

    /**
     * Kolom yang dapat diisi secara massal
     * 
     * @var array
     */
    protected $fillable = [
        'classification_id',
        'purchase_request_id',
        'item_desc',
        'uom',
        'unit_price',
        'quantity',
        'amount',
        'sla_pr_to_po_target',
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
        'unit_price' => 'decimal:2',
        'amount' => 'decimal:2',
        'sla_pr_to_po_target' => 'integer',
        'current_stage' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relasi many-to-one dengan Classification
     * Setiap item belong to satu klasifikasi
     * 
     * @return BelongsTo
     */
    public function classification(): BelongsTo
    {
        return $this->belongsTo(Classification::class, 'classification_id');
    }

    /**
     * Relasi many-to-one dengan PurchaseRequest
     * Setiap item belong to satu purchase request
     * 
     * @return BelongsTo
     */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class, 'purchase_request_id');
    }
    /**
     * Relasi one-to-many dengan PurchaseOrderItem
     * Satu item purchase request dapat muncul di banyak item purchase order
     * 
     * @return HasMany
     */
    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class, 'purchase_request_item_id');
    }
    /**

     * Get stage labels mapping
     * 
     * @return array
     */
    public static function getStageLabels(): array
    {
        return [
            1 => 'PR Created',
            2 => 'PO Linked',
            3 => 'PO Onsite',
            4 => 'Invoice Received',
            5 => 'Invoice Submitted',
            6 => 'Payment',
            7 => 'Completed',
            8 => 'Completed',
            9 => 'Completed',
        ];
    }

    /**
     * Get stage colors mapping
     * 
     * @return array
     */
    public static function getStageColors(): array
    {
        return [
            1 => 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            2 => 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
            3 => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            4 => 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            5 => 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            6 => 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
            7 => 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            8 => 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            9 => 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        ];
    }
    /**
     * Get current stage label
     * 
     * @return string
     */
    public function getStageLabelAttribute(): string
    {
        $stage = (int) ($this->current_stage ?? 0);
        return self::getStageLabels()[$stage] ?? 'Unknown';
    }

    /**
     * Get current stage color
     * 
     * @return string
     */
    public function getStageColorAttribute(): string
    {
        $stage = (int) ($this->current_stage ?? 0);
        return self::getStageColors()[$stage] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }

    /**
     * Get stage badge HTML
     * 
     * @return string
     */
    public function getStageBadgeAttribute(): string
    {
        return '<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ' . $this->stage_color . '">
                    <i class="mgc_box_3_line"></i>
                    ' . $this->stage_label . '
                </span>';
    }
}
