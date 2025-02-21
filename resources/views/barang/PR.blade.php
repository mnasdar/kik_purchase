@extends('layouts.vertical', ['title' => 'PR (Purchase Request)', 'sub_title' => 'Pages', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite([
        'node_modules/gridjs/dist/theme/mermaid.min.css',
        'node_modules/flatpickr/dist/flatpickr.min.css',
        'node_modules/@simonwep/pickr/dist/themes/classic.min.css',
        'node_modules/@simonwep/pickr/dist/themes/monolith.min.css',
        'node_modules/@simonwep/pickr/dist/themes/nano.min.css',
    ])
@endsection

@section('content')
    <div class="grid grid-cols-12">
        <div class="col-span-12">
            <div class="card">
                <div class="card-header">
                    <div class="flex justify-between items-center">
                        <h4 class="card-title">Data Tables Purchase Request (PR)</h4>

                        <button type="button" class="btn bg-primary text-white my-3" data-fc-type="modal">
                            <i class="mgc_add_fill text-base me-4"></i> Add Item
                        </button>

                        <div class="w-full h-full mt-5 fixed top-0 left-0 z-50 transition-all duration-500 fc-modal hidden">
                            <div
                                class="sm:max-w-lg fc-modal-open:opacity-100 duration-500 opacity-0 ease-out transition-all sm:w-full m-3 sm:mx-auto flex flex-col bg-white border shadow-sm rounded-md dark:bg-slate-800 dark:border-gray-700">
                                <div class="flex justify-between items-center py-2.5 px-4 border-b dark:border-gray-700">
                                    <h3 class="font-medium text-gray-800 dark:text-white text-lg">
                                        Modal Title
                                    </h3>
                                    <button
                                        class="inline-flex flex-shrink-0 justify-center items-center h-8 w-8 dark:text-gray-200"
                                        data-fc-dismiss type="button">
                                        <span class="material-symbols-rounded">close</span>
                                    </button>
                                </div>
                                <div class="px-4 py-8 overflow-y-auto">
                                    <form class="valid-form">
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div class="form-group">
                                                <label for="inputPRNumber" class="text-gray-800 text-sm font-medium inline-block mb-2">PR Number</label>
                                                <input type="text" class="form-input" id="inputPRNumber" required>
                                            </div>
                                            <div class="form-group col-span-2">
                                                <label for="inputLocation" class="text-gray-800 text-sm font-medium inline-block mb-2">Location</label>
                                                <input type="text" class="form-input" id="inputLocation" required>
                                            </div>
                                            <div class="form-group col-span-2">
                                                <label for="inputItemDesc" class="text-gray-800 text-sm font-medium inline-block mb-2">ItemDesc</label>
                                                <input type="text" class="form-input" id="inputItemDesc" required>
                                            </div>
                                            <div class="form-group">
                                                <label for="inputApprovedDate" class="text-gray-800 text-sm font-medium inline-block mb-2">ApprovedDate</label>
                                                <input type="text" class="form-input" id="datepicker-humanfd" required>
                                            </div>
                                            <div class="form-group">
                                                <label for="inputQuantity" class="text-gray-800 text-sm font-medium inline-block mb-2">Quantity</label>
                                                <input type="text" class="form-input" id="inputQuantity" required>
                                            </div>
                                            <div class="form-group">
                                                <label for="inputPRAmount" class="text-gray-800 text-sm font-medium inline-block mb-2">PRAmount</label>
                                                <input type="text" class="form-input" id="inputPRAmount" required>
                                            </div>
                                        </div>
                                        <button type="submit" class="btn bg-primary text-white my-3">Sign in</button>
                                    </form>
                                </div>
                                <div class="flex justify-end items-center gap-4 p-4 border-t dark:border-slate-700">
                                    <button
                                        class="btn dark:text-gray-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:dark:bg-slate-700 transition-all"
                                        data-fc-dismiss type="button">Close</button>
                                    <a class="btn bg-primary text-white" href="javascript:void(0)">Save</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">This All Of Purchase Request (PR) Data, You
                        Can Search and Sort items by Ascending or Descending, Data will be showing 10 items per pages</p>

                    <div id="table-purchase-request"></div>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('script')
    @vite(['resources/js/pages/table-gridjs.js', 'resources/js/pages/highlight.js', 'resources/js/pages/form-validation.js','resources/js/pages/form-flatpickr.js'])
@endsection
