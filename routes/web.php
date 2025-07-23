<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoutingController;
use App\Http\Controllers\Barang\StatusController;
use App\Http\Controllers\Barang\PurchaseOrderController;
use App\Http\Controllers\Barang\ClassificationController;
use App\Http\Controllers\Barang\PurchaseRequestController;
use App\Http\Controllers\Goods\PurchaseOrderController as POController;
use App\Http\Controllers\Goods\PurchaseTrackingController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

require __DIR__ . '/auth.php';

Route::group(['prefix' => '/', 'middleware'=>'auth'], function () {
    Route::get('', [RoutingController::class, 'index'])->name('root');
    Route::get('/home', fn()=>view('index'))->name('home');
    /* ================= Goods ======================== */
    Route::prefix('barang')->group(function () {
        Route::resource('/purchase-request', PurchaseRequestController::class);
        Route::delete('/purchase-request', [PurchaseRequestController::class, 'bulkDestroy']);
        Route::resource('/purchase-order', PurchaseOrderController::class);
        Route::delete('/purchase-order', [PurchaseOrderController::class, 'bulkDestroy']);
    });
    
    Route::prefix('goods')->group(function () {
        Route::get('/purchase-orders/search', [POController::class, 'search'])->name('purchase-orders.search');
        Route::get('/purchase-orders/{purchase_order}/showpr', [POController::class, 'showpr'])->name('purchase-order.showpr');
        Route::resource('/purchase-orders', POController::class)->except(['create','show']);
        Route::resource('/purchase-tracking', PurchaseTrackingController::class)->only('store');
        // Route::get('/status/search', [StatusController::class, 'search'])->name('status.search');
        // Route::resource('/status', StatusController::class)->except(['create','show']);
        // Route::get('/classification/search', [ClassificationController::class, 'search'])->name('classification.search');
        // Route::resource('/classification', ClassificationController::class)->except(['create','show']);
    });
    
    
    Route::get('{first}/{second}/{third}', [RoutingController::class, 'thirdLevel'])->name('third');
    Route::get('{first}/{second}', [RoutingController::class, 'secondLevel'])->name('second');
    Route::get('{any}', [RoutingController::class, 'root'])->name('any');
});
