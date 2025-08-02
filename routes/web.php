<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoutingController;
use App\Http\Controllers\Config\StatusController;
use App\Http\Controllers\Config\ClassificationController;
use App\Http\Controllers\Barang\PurchaseOrderController;
use App\Http\Controllers\Barang\OnsiteController;
use App\Http\Controllers\Barang\PurchaseRequestController;
use App\Http\Controllers\Barang\PurchaseTrackingController;

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

Route::group(['prefix' => '/', 'middleware' => 'auth'], function () {
    Route::get('', [RoutingController::class, 'index'])->name('root');
    Route::get('/home', fn() => view('index'))->name('home');
    /* ================= Barang ======================== */
    Route::prefix('barang')->group(function () {
        /* ================= Purchase Request ======================== */
        Route::resource('/purchase-request', PurchaseRequestController::class)->except(['show', 'destroy']);
        Route::delete('/purchase-request', [PurchaseRequestController::class, 'bulkDestroy'])->name('purchase-request.bulkDestroy');

        /* ================= Purchase Order ======================== */
        Route::get('/purchase-order/showpr', [PurchaseOrderController::class, 'showpr'])->name('purchase-order.showpr');
        Route::resource('/purchase-order', PurchaseOrderController::class)->except(['destroy']);
        Route::delete('/purchase-order', [PurchaseOrderController::class, 'bulkDestroy'])->name('purchase-order.bulkDestroy');

        /* ================= Purchase Tracking ======================== */
        Route::resource('/purchase-tracking', PurchaseTrackingController::class)->only('store');
        Route::delete('/purchase-tracking', [PurchaseTrackingController::class, 'bulkDestroy'])->name('purchase-tracking.bulkDestroy');

        /* ================= PO Onsite ======================== */
        Route::get('/po-onsite/search/{keyword}', [OnsiteController::class, 'search'])->name('po-onsite.search');
        Route::delete('/po-onsite', [OnsiteController::class, 'bulkDestroy'])->name('po-onsite.bulkDestroy');
        Route::resource('/po-onsite', OnsiteController::class)->except(['destroy']);

    });
    Route::prefix('config')->group(function () {
        /* ================= Status ======================== */
        Route::delete('/status', [StatusController::class, 'bulkDestroy'])->name('status.bulkDestroy');
        Route::resource('/status', StatusController::class)->except(['create', 'show', 'delete']);

        /* ================= Classification ======================== */
        Route::delete('/classification', [ClassificationController::class, 'bulkDestroy'])->name('classification.bulkDestroy');
        Route::resource('/classification', ClassificationController::class)->except(['create', 'show', 'delete']);
    });


    Route::get('{first}/{second}/{third}', [RoutingController::class, 'thirdLevel'])->name('third');
    Route::get('{first}/{second}', [RoutingController::class, 'secondLevel'])->name('second');
    Route::get('{any}', [RoutingController::class, 'root'])->name('any');
});
