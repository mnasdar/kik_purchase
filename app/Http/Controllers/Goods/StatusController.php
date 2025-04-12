<?php

namespace App\Http\Controllers\Goods;

use App\Models\Goods\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Http\Controllers\Controller;

class StatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = Status::orderByDesc('id') // urutkan dari yang terakhir diinput
            ->paginate(10);     // paginasi 10 data per halaman

        // Cek apakah status dibuat dalam 5 menit terakhir
        $data = $data->through(function ($status) {
            $status->is_new = Carbon::parse($status->created_at)->greaterThan(Carbon::now()->subMinutes(5));
            $status->is_update = Carbon::parse($status->updated_at)->greaterThan(Carbon::now()->subMinutes(5));
            return $status;
        });

        return view('goods.status', compact(['data',]));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255|unique:statuses,name',
        ]);

        $status = Status::create([
            'name' => $validated['name'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status berhasil ditambahkan',
            'data' => $status,
            'id' => $status->id,
            'name' => $status->name,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Status $status)
    {
        return response()->json($status);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Status $status)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255|unique:statuses,name,' . $status->id,
        ]);

        $status->update($validated);

        return response()->json([
            'message' => 'Data berhasil diperbarui.',
            'data' => $status
        ]);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Status $status)
    {
        $status->delete();
        return response()->json(['message' => 'Status berhasil dihapus.']);
    }
    public function search(Request $request)
    {
        $keyword = $request->query('q');
        
        $data = Status::where('name', 'like', '%' . $keyword . '%')
            ->orderByDesc('id')
            ->get()
            ->map(function ($status) {
                $status->is_new = Carbon::parse($status->created_at)->greaterThan(Carbon::now()->subMinutes(5));
                $status->is_update = Carbon::parse($status->updated_at)->greaterThan(Carbon::now()->subMinutes(5));
                return $status;
            });
    
        // Jika tidak ada hasil, kembalikan data kosong
        if ($data->isEmpty()) {
            return view('goods.partials.status_datatable', ['data' => []])->render();
        }
    
        return view('goods.partials.status_datatable', compact('data'))->render();
    }
}
