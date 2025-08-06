<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoutingController;
use App\Http\Controllers\Purchase\OnsiteController;
use App\Http\Controllers\Config\StatusController;
use App\Http\Controllers\Config\LocationController;
use App\Http\Controllers\Purchase\PurchaseOrderController;
use App\Http\Controllers\Config\ClassificationController;
use App\Http\Controllers\Purchase\PurchaseRequestController;
use App\Http\Controllers\Purchase\PurchaseTrackingController;
// use App\Http\Controllers\Jasa\PurchaseOrderController as JasaPOController;
// use App\Http\Controllers\Jasa\OnsiteController as JasaOnsiteController;
// use App\Http\Controllers\Jasa\PurchaseRequestController as JasaPRController;
// use App\Http\Controllers\Jasa\PurchaseTrackingController as JasaTrackingController;

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
    Route::prefix('{prefix}')->group(function () {
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
        Route::delete('/klasifikasi', [ClassificationController::class, 'bulkDestroy'])->name('klasifikasi.bulkDestroy');
        Route::resource('/klasifikasi', ClassificationController::class)->except(['create', 'show', 'delete']);

        /* ================= Location ======================== */
        Route::delete('/unit-kerja', [LocationController::class, 'bulkDestroy'])->name('unit-kerja.bulkDestroy');
        Route::resource('/unit-kerja', LocationController::class)->except(['create', 'show', 'delete']);
    });
    Route::get('{first}/{second}/{third}', [RoutingController::class, 'thirdLevel'])->name('third');
    Route::get('{first}/{second}', [RoutingController::class, 'secondLevel'])->name('second');
    Route::get('{any}', [RoutingController::class, 'root'])->name('any');
});
