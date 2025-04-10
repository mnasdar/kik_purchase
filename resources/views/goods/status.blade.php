@extends('layouts.vertical', ['title' => 'Status', 'sub_title' => 'Pages', 'mode' => $mode ?? '', 'demo' => $demo ?? ''])

@section('css')
@endsection

@section('content')
    <div class="grid grid-cols-12">
        <div class="col-span-12">
            <div class="card">
                <div class="card-header">
                    <div class="flex md:flex-row flex-col justify-between items-start md:items-center">
                        <h4 class="card-title">Data Tables Status</h4>
                        <div class="flex flex-row gap-2">
                            <button type="button" class="btn bg-primary text-white my-3" data-fc-type="modal">
                                <i class="mgc_add_fill text-base me-0 md:md-4"></i>
                                <span class="hidden md:inline">Add Item</span>
                            </button>
                            {{-- Modal Add Item --}}
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
                                    <form action="{{ route('status.store') }}" id="addItemForm" method="POST">
                                        @csrf
                                        <div class="px-4 py-8 overflow-y-auto">
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div class="form-group col-span-2">
                                                    <label for="inputName"
                                                        class="text-gray-800 text-sm font-medium inline-block mb-2">Name</label>
                                                    <input type="text" class="form-input" name="name" id="inputName">
                                                    {{-- Custom error message --}}
                                                    <p id="error-name" class="text-red-500 text-sm mt-1"></p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex justify-end items-center gap-4 p-4 border-t dark:border-slate-700">
                                            <button
                                                class="btn dark:text-gray-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:dark:bg-slate-700 transition-all"
                                                data-fc-dismiss type="button">Close</button>
                                            <button type="submit" class="btn bg-primary text-white flex items-center gap-2"
                                                id="btnSave">
                                                <span
                                                    class="loader hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                <span>Simpan</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <p class="text-sm text-slate-700 dark:text-slate-400 mb-4">This All Of Status Data,
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
                                                <th scope="col"
                                                    class="w-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    ID</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Name</th>
                                                <th
                                                    class="w-1 whitespace-nowrap px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody id="statusTableBody" class="divide-y divide-gray-200 dark:divide-gray-700">
                                            @foreach ($data as $item)
                                                <tr id="row-{{ $item->id }}"
                                                    class="odd:bg-white even:bg-gray-100 hover:bg-gray-200 dark:odd:bg-gray-800 dark:even:bg-gray-700 dark:hover:bg-gray-600">
                                                    <td
                                                        class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                                        {{ $loop->iteration }}</td>
                                                    <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                                                        {{ $item->name }}</td>
                                                    <td
                                                        class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 flex justify-end gap-2">
                                                        <button class="btn btn-edit bg-warning p-2 text-white"
                                                            data-fc-type="tooltip" data-fc-placement="left"
                                                            data-id="{{ $item->id }}" data-name="{{ $item->name }}">
                                                            <i class="mgc_edit_2_line text-base"></i>
                                                        </button>
                                                        <div class="bg-warning hidden px-2 py-1 rounded transition-all text-white opacity-0 z-50"
                                                            role="tooltip">
                                                            Edit
                                                            <div data-fc-arrow
                                                                class="bg-warning w-2.5 h-2.5 rotate-45 -z-10 rounded-[1px]">
                                                            </div>
                                                        </div>
                                                        <button class="btn bg-danger p-2 text-white" data-fc-type="tooltip"
                                                            data-fc-placement="right">
                                                            <i class="mgc_delete_2_line text-base"></i>
                                                        </button>
                                                        <div class="bg-danger hidden px-2 py-1 rounded transition-all text-white opacity-0 z-50"
                                                            role="tooltip">
                                                            Delete
                                                            <div data-fc-arrow
                                                                class="bg-danger w-2.5 h-2.5 rotate-45 -z-10 rounded-[1px]">
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            @endforeach
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

    {{-- Modal Edit --}}
    <div id="editModal" class="fc-modal hidden fixed top-0 left-0 w-full h-full z-50">
        <div class="sm:max-w-lg m-3 sm:mx-auto bg-white dark:bg-slate-800 border shadow rounded-md flex flex-col">
            <div class="flex justify-between items-center px-4 py-2.5 border-b dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-800 dark:text-white">Edit Status</h3>
                <button class="inline-flex flex-shrink-0 justify-center items-center h-8 w-8 dark:text-gray-200"
                    data-fc-dismiss type="button">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>

            <form id="editItemForm" method="POST">
                @csrf
                @method('put')

                <div class="px-4 py-8 overflow-y-auto">
                    <div class="grid grid-cols-1 gap-6">
                        <div>
                            <label for="editName"
                                class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 inline-block">Name</label>
                            <input type="text" id="editName" name="name" class="form-input" required>
                            <p id="error-edit-name" class="text-sm text-red-500 mt-1"></p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-4 p-4 border-t dark:border-slate-700">
                    <button type="button"
                        class="btn border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        data-fc-dismiss>
                        Cancel
                    </button>
                    <button type="submit" class="btn bg-primary text-white flex items-center gap-2" id="btnUpdate">
                        <span
                            class="loader hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Update</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
@endsection
@section('script')
    @vite(['resources/js/pages/table-gridjs.js', 'resources/js/pages/highlight.js', 'resources/js/goods/status-add-item.js', 'resources/js/goods/status-edit-remove-item.js'])
@endsection
