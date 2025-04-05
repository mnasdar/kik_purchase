@extends('layouts.vertical', ['title' => 'PR (Purchase Request)', 'sub_title' => 'Pages', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
    @vite(['node_modules/gridjs/dist/theme/mermaid.min.css', 'node_modules/flatpickr/dist/flatpickr.min.css', 'node_modules/@simonwep/pickr/dist/themes/classic.min.css', 'node_modules/@simonwep/pickr/dist/themes/monolith.min.css', 'node_modules/@simonwep/pickr/dist/themes/nano.min.css'])
@endsection

@section('content')
    <div class="grid grid-cols-12">
        <div class="col-span-12">
            <div class="card">
                <div class="card-header">
                    <div class="flex md:flex-row flex-col justify-between items-start md:items-center">
                        <h4 class="card-title">Data Tables Purchase Request (PR)</h4>
                        <div class="flex flex-row gap-2">
                            <button type="button" class="btn bg-primary text-white my-3" data-fc-type="modal">
                                <i class="mgc_add_fill text-base me-0 md:md-4"></i>
                                <span class="hidden md:inline">Add Item</span>
                            </button>
                            <div
                                class="w-full h-full mt-5 fixed top-0 left-0 z-50 transition-all duration-500 fc-modal hidden">
                                <div
                                    class="sm:max-w-lg fc-modal-open:opacity-100 duration-500 opacity-0 ease-out transition-all sm:w-full m-3 sm:mx-auto flex flex-col bg-white border shadow-sm rounded-md dark:bg-slate-800 dark:border-gray-700">
                                    <div
                                        class="flex justify-between items-center py-2.5 px-4 border-b dark:border-gray-700">
                                        <h3 class="font-medium text-gray-800 dark:text-white text-lg">
                                            Add Item PR
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
                                                    <label for="inputPRNumber"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">PR
                                                        Number</label>
                                                    <input type="text" class="form-input" id="inputPRNumber" required>
                                                </div>
                                                <div class="form-group">
                                                    <label for="status-select"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">status</label>
                                                    <div class="p-0">
                                                        <select id="status-select" class="search-select">
                                                            <option value="orange">On Progress</option>
                                                            <option value="White">Proses Approve</option>
                                                            <option value="Purple">Done</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="form-group col-span-2">
                                                    <label for="classification-select"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">Classification</label>
                                                    <div class="p-0">
                                                        <select id="classification-select" class="search-select">
                                                            <option value="orange">Pengadaan Part Lift</option>
                                                            <option value="White">Pangadaan Material Support Kerja Engineering</option>
                                                            <option value="Purple">Wisma Kalla</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                <div class="form-group">
                                                    <label for="inputApprovedDate"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">ApprovedDate</label>
                                                    <input type="text" class="form-input" id="datepicker-humanfd"
                                                        required>
                                                </div>
                                                <div class="form-group">
                                                    <label for="location-select"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">Location</label>
                                                    <div class="p-0">
                                                        <select id="location-select" class="search-select">
                                                            <option value="orange">Mall MARI</option>
                                                            <option value="White">Mall NIPAH</option>
                                                            <option value="Purple">Wisma Kalla</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="form-group col-span-2">
                                                    <label for="inputItemDesc"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">ItemDesc</label>
                                                    <input type="text" class="form-input" id="inputItemDesc" required>
                                                </div>
                                                <div class="form-group">
                                                    <label for="inputUom"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">UOM</label>
                                                    <input type="text" class="form-input" id="inputUom" required>
                                                </div>
                                                <div class="form-group">
                                                    <label for="inputQuantity"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">Quantity</label>
                                                    <input type="text" class="form-input" id="inputQuantity" required>
                                                </div>
                                                <div class="form-group">
                                                    <label for="inputPRAmount"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">PRAmount</label>
                                                    <input type="text" class="form-input" id="inputPRAmount" required>
                                                </div>
                                            </div>
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
                            <button type="button" href="#" class="btn bg-success text-white my-3"
                                data-fc-type="modal">
                                <i class="mgc_file_import_fill text-base me-0 md:md-4"></i>
                                <span class="hidden md:inline">Import File</span>
                            </button>
                            <div
                                class="w-full h-full mt-5 fixed top-0 left-0 z-50 transition-all duration-500 fc-modal hidden">
                                <div
                                    class="sm:max-w-lg fc-modal-open:opacity-100 duration-500 opacity-0 ease-out transition-all sm:w-full m-3 sm:mx-auto flex flex-col bg-white border shadow-sm rounded-md dark:bg-slate-800 dark:border-gray-700">
                                    <div
                                        class="flex justify-between items-center py-2.5 px-4 border-b dark:border-gray-700">
                                        <h3 class="font-medium text-gray-800 dark:text-white text-lg">
                                            Import File PR
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
                                                <div class="form-group col-span-2">
                                                    <input type="file"
                                                        class="form-input file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-600 dark:file:text-blue-100 dark:hover:file:bg-blue-500 "
                                                        id="inputPRNumber" required>
                                                </div>
                                            </div>
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
                </div>
                <div class="p-6">
                    <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">This All Of Purchase Request (PR) Data,
                        You
                        Can Search and Sort items by Ascending or Descending, Data will be showing 10 items per pages
                    </p>

                    <div class="overflow-x-auto">
                        <div class="min-w-full inline-block align-middle">
                            <div
                                class="border rounded-lg divide-y divide-gray-200 dark:border-gray-700 dark:divide-gray-700">
                                <div class="py-3 px-4">
                                    <div class="relative max-w-xs">
                                        <label for="table-with-pagination-search" class="sr-only">Search</label>
                                        <input type="text" name="table-with-pagination-search"
                                            id="table-with-pagination-search" class="form-input ps-11"
                                            placeholder="Search for items">
                                        <div class="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-4">
                                            <svg class="h-3.5 w-3.5 text-gray-400" xmlns="http://www.w3.org/2000/svg"
                                                width="16" height="16" fill="currentColor" viewbox="0 0 16 16">
                                                <path
                                                    d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z">
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="overflow-hidden">
                                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead class="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                {{-- <th scope="col" class="py-3 px-4 pe-0">
                                                    <div class="flex items-center h-5">
                                                        <input id="table-pagination-checkbox-all" type="checkbox"
                                                            class="form-checkbox rounded">
                                                        <label for="table-pagination-checkbox-all"
                                                            class="sr-only">Checkbox</label>
                                                    </div>
                                                </th> --}}
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    ID</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Status</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Classification</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    PR Number</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Location</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Item Desc</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    UOM</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Approve Date</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Unit Price</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Quantity</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Amount</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Status</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    SLA</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase">
                                                    Action</th>

                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                            <tr>
                                                {{-- <td class="py-3 ps-4">
                                                    <div class="flex items-center h-5">
                                                        <input id="table-pagination-checkbox-1" type="checkbox"
                                                            class="form-checkbox rounded">
                                                        <label for="table-pagination-checkbox-1"
                                                            class="sr-only">Checkbox</label>
                                                    </div>
                                                </td> --}}
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                                    01</td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    <span
                                                        class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs bg-green-500 font-medium text-white">Finish</span>
                                                </td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    Pengadaan Part Lift</td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    KIK0000007320</td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    HEAD OFFICE KIK</td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    MAP FILE (SPRING FILE WARNA BIRU 1, HITAM 1, KUNING 1) </td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    Lumpsum </td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    16-Jan-2024</td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    15000000
                                                </td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    3
                                                </td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    240000
                                                </td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    Approved
                                                </td>
                                                <td
                                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                    <span
                                                        class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs bg-green-500 font-medium text-white">4</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="py-1 px-4">
                                    <nav class="flex items-center space-x-2">
                                        <a class="text-gray-400 hover:text-primary p-4 inline-flex items-center gap-2 font-medium rounded-md"
                                            href="#">
                                            <span aria-hidden="true">«</span>
                                            <span class="sr-only">Previous</span>
                                        </a>
                                        <a class="w-10 h-10 bg-primary text-white p-4 inline-flex items-center text-sm font-medium rounded-full"
                                            href="#" aria-current="page">1</a>
                                        <a class="w-10 h-10 text-gray-400 hover:text-primary p-4 inline-flex items-center text-sm font-medium rounded-full"
                                            href="#">2</a>
                                        <a class="w-10 h-10 text-gray-400 hover:text-primary p-4 inline-flex items-center text-sm font-medium rounded-full"
                                            href="#">3</a>
                                        <a class="text-gray-400 hover:text-primary p-4 inline-flex items-center gap-2 font-medium rounded-md"
                                            href="#">
                                            <span class="sr-only">Next</span>
                                            <span aria-hidden="true">»</span>
                                        </a>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('script')
    @vite(['resources/js/pages/table-gridjs.js', 'resources/js/pages/highlight.js', 'resources/js/pages/form-validation.js', 'resources/js/pages/form-flatpickr.js', 'resources/js/pages/form-select.js'])
@endsection
