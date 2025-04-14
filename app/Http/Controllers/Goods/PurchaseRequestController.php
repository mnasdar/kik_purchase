<?php

namespace App\Http\Controllers\Goods;

use DateTime;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use App\Models\Goods\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Goods\Classification;
use App\Models\Goods\PurchaseRequest;
use App\Models\Goods\PurchaseTracking;

class PurchaseRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = PurchaseRequest::with('status', 'classification')->orderByDesc('id') // urutkan dari yang terakhir diinput
            ->paginate(10);     // paginasi 10 data per halaman

        // Cek apakah status dibuat dalam 5 menit terakhir
        $data = $data->through(function ($status) {
            $status->is_new = Carbon::parse($status->created_at)->greaterThan(Carbon::now()->subMinutes(5));
            $status->is_update = Carbon::parse($status->updated_at)->greaterThan(Carbon::now()->subMinutes(5));
            return $status;
        });

        $status = Status::all();
        $classification = Classification::all();

        return view('goods.purchase-request', compact(['data', 'status', 'classification']));
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
        $validated = $request->validate([
            'pr_number' => 'required|string',
            'status_id' => 'required',
            'classification_id' => 'required',
            'location' => 'required|string|max:255',
            'item_desc' => 'required|string|max:255',
            'uom' => 'required|string|max:20',
            'approved_date' => 'required|date|before_or_equal:today',
            'unit_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'amount' => 'required|numeric|min:0',
        ]);
        // Konversi string ke integer (jika diperlukan)
        $validated['status_id'] = (int) $validated['status_id'];
        $validated['classification_id'] = (int) $validated['classification_id'];
        
        PurchaseTracking::firstOrCreate([
            'pr_number' => $validated['pr_number'],
        ]);
        $purchaseRequest = PurchaseRequest::create([
            'pr_number' => $validated['pr_number'],
            'status_id' => $validated['status_id'],
            'classification_id' => $validated['classification_id'],
            'location' => $validated['location'],
            'item_desc' => $validated['item_desc'],
            'uom' => $validated['uom'],
            'approved_date' => $validated['approved_date'],
            'unit_price' => $validated['unit_price'],
            'quantity' => $validated['quantity'],
            'amount' => $validated['amount'],
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Status berhasil ditambahkan',
            'data' => $purchaseRequest,
            'id' => $purchaseRequest->id,
            'pr_number' => $purchaseRequest->pr_number,
            'status_id' => $purchaseRequest->status_id,
            'classification_id' => $purchaseRequest->classification_id,
            'location' => $purchaseRequest->location,
            'item_desc' => $purchaseRequest->item_desc,
            'uom' => $purchaseRequest->uom,
            'approved_date' => $purchaseRequest->approved_date,
            'unit_price' => $purchaseRequest->unit_price,
            'quantity' => $purchaseRequest->quantity,
            'amount' => $purchaseRequest->amount,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(PurchaseRequest $purchaseRequest)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PurchaseRequest $purchaseRequest)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PurchaseRequest $purchaseRequest)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchaseRequest $purchaseRequest)
    {
        //
    }
    public function search(Request $request)
    {
        $query = $request->q;

        $data = PurchaseRequest::query();

        if ($query) {
            $data->where(function ($q) use ($query) {
                $q->where('pr_number', 'like', '%' . $query . '%')
                    ->orWhere('location', 'like', '%' . $query . '%')
                    ->orWhere('item_desc', 'like', '%' . $query . '%')
                    ->orWhere('uom', 'like', '%' . $query . '%');

                // Cek jika query adalah tanggal valid (format YYYY-MM-DD)
                if (self::isValidDate($query)) {
                    $q->orWhereDate('approved_date', $query);
                }

                $q->orWhere(DB::raw("CAST(unit_price AS TEXT)"), 'like', '%' . $query . '%')
                    ->orWhere(DB::raw("CAST(quantity AS TEXT)"), 'like', '%' . $query . '%')
                    ->orWhere(DB::raw("CAST(amount AS TEXT)"), 'like', '%' . $query . '%')
                    ->orWhereHas('status', function ($s) use ($query) {
                        $s->where('name', 'like', '%' . $query . '%');
                    })
                    ->orWhereHas('classification', function ($c) use ($query) {
                        $c->where('name', 'like', '%' . $query . '%');
                    });

                if (is_numeric($query)) {
                    $q->orWhere('id', $query);
                }
            });
        }

        $data = $data->latest()->paginate(10);
        // AJAX Response
        if ($request->ajax()) {
            return response()->json([
                'table' => view('goods.partials.purchase-request_datatable', compact('data'))->render(),
                'pagination' => view('goods.partials.pagination', compact('data'))->render(),
            ]);
        }

        // Fallback View
        return view('goods.purchase-request', compact('data'));
    }
    private static function isValidDate($value, $format = 'Y-m-d')
    {
        $d = DateTime::createFromFormat($format, $value);
        return $d && $d->format($format) === $value;
    }

}
