<?php

namespace App\Models\Goods;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseTracking extends Model
{
    use HasFactory;
    protected $fillable = [
        'pr_number',
        'po_number',
        'receipt_number',
    ];
    public static function boot()
{
    parent::boot();

    static::saving(function ($model) {
        // Cek apakah ini adalah operasi update
        $isUpdating = $model->exists;

        // Cek jika PR Number sudah digunakan, tapi tidak untuk update
        if (!empty($model->pr_number) && static::where('pr_number', $model->pr_number)
            ->where('id', '!=', $model->id) // Exclude the current record
            ->exists()) {
            throw new \Exception("PR Number sudah digunakan.");
        }

        // Cek jika PO Number sudah digunakan, tapi tidak untuk update
        if (!empty($model->po_number) && static::where('po_number', $model->po_number)
            ->where('id', '!=', $model->id) // Exclude the current record
            ->exists()) {
            throw new \Exception("PO Number sudah digunakan.");
        }

        // Cek jika Receipt Number sudah digunakan, tapi tidak untuk update
        if (!empty($model->receipt_number) && static::where('receipt_number', $model->receipt_number)
            ->where('id', '!=', $model->id) // Exclude the current record
            ->exists()) {
            throw new \Exception("Receipt Number sudah digunakan.");
        }
    });
}

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class, 'pr_number', 'pr_number');
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_number', 'po_number');
    }

}
