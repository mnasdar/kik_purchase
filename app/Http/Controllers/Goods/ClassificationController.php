<?php

namespace App\Http\Controllers\Goods;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Http\Controllers\Controller;
use App\Models\Goods\Classification;

class ClassificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = Classification::orderBy('type','asc') // urutkan dari yang terakhir diinput
            ->paginate(10);     // paginasi 10 data per halaman

        // Cek apakah Classification dibuat dalam 5 menit terakhir
        $data = $data->through(function ($classification) {
            $classification->is_new = Carbon::parse($classification->created_at)->greaterThan(Carbon::now()->subMinutes(5));
            $classification->is_update = Carbon::parse($classification->updated_at)->greaterThan(Carbon::now()->subMinutes(5));
            return $classification;
        });

        return view('goods.classification', compact(['data',]));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
            'type' => 'required|string',
        ]);

        $classification = Classification::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'classification berhasil ditambahkan',
            'data' => $classification,
            'id' => $classification->id,
            'name' => $classification->name,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Classification $classification)
    {
        return response()->json($classification);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Classification $classification)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'name' => 'required|string|min:3|max:255',
        ]);

        $classification->update($validated);

        return response()->json([
            'message' => 'Data berhasil diperbarui.',
            'data' => $classification
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Classification $classification)
    {
        $classification->delete();
        return response()->json(['message' => 'Data berhasil dihapus.']);
    }
    public function search(Request $request)
    {
        $query = $request->q;

        // Filter berdasarkan pencarian
        $data = Classification::when($query, function ($q) use ($query) {
            $q->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%'])
            ->orWhereRaw('LOWER(type) LIKE ?', ['%' . strtolower($query) . '%']);
        })->orderBy('type','asc')->paginate(10);

        // Kembalikan partial untuk AJAX
        if ($request->ajax()) {
            return response()->json([
                'table' => view('goods.partials.classification_datatable', compact('data'))->render(),
                'pagination' => view('goods.partials.pagination', compact('data'))->render(),
            ]);
        }

        // Jika non-AJAX
        return view('goods.classification', compact('data'));
    }
}
