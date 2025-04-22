<?php

namespace App\Http\Controllers\Goods;

use App\Models\Goods\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\Goods\PurchaseOrder;
use App\Http\Controllers\Controller;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = PurchaseOrder::with('trackings')->orderByDesc('id') // urutkan dari yang terakhir diinput
            ->paginate(10);     // paginasi 10 data per halaman

        // Cek apakah status dibuat dalam 5 menit terakhir
        $data = $data->through(function ($status) {
            $status->is_new = Carbon::parse($status->created_at)->greaterThan(Carbon::now()->subMinutes(5));
            $status->is_update = Carbon::parse($status->updated_at)->greaterThan(Carbon::now()->subMinutes(5));
            return $status;
        });

        $status = Status::where('type','Barang')->get();

        $num=1;
        

        return view('goods.purchase-order', compact(['data','status','num']));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(PurchaseOrder $purchaseOrder)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PurchaseOrder $purchaseOrder)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchaseOrder $purchaseOrder)
    {
        //
    }
}
