@forelse($data as $item)
    <tr id="row-{{ $item->id }}"
        class="odd:bg-white even:bg-gray-100 hover:bg-gray-200 dark:odd:bg-gray-800 dark:even:bg-gray-700 dark:hover:bg-gray-600">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
            {{ $loop->iteration }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
            <span
                class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-white
                                                            @if (strtolower($item->status->name) === 'finish') bg-green-500
                                                            @elseif(strtolower($item->status->name) === 'on proses') bg-yellow-500
                                                            @else bg-gray-500 @endif">
                {{ ucwords($item->status->name) }}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-800 dark:text-gray-200">
            <a
                class="relative inline-flex flex-shrink-0 justify-center items-center h-[2rem] w-[2rem] rounded-md border font-medium bg-yellow-100 text-yellow-800 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-yellow-300 transition-all text-sm  dark:hover:bg-slate-800 dark:border-gray-700  dark:hover:text-white dark:focus:bg-slate-800 dark:focus:text-white dark:focus:ring-offset-gray-800 dark:focus:ring-yellow-200 btn-showpr"
                edit-data-id="{{ $item->id }}" data-fc-behavior="static" data-fc-target="showprModal" data-fc-type="modal">
                <i class="mgc_eye_2_fill text-2xl"></i>
                @if ($item->trackings->count() > 0)
                    <span
                        class="absolute top-0 end-0 inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-1/2 bg-rose-500 text-white">{{ $item->trackings->count() }}</span>
                @endif
            </a>
        </td>
        <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 gap-1">
            {{ $item->po_number }}
            @if ($item->is_new)
                <span class="inline-block px-2 py-1 text-xs font-semibold text-white bg-success rounded-full">New</span>
            @elseif($item->is_update)
                <span
                    class="inline-block px-2 py-1 text-xs font-semibold text-white bg-warning rounded-full">Update</span>
            @endif
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
            {{ $item->approved_date }}</td>
        <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
            {{ $item->supplier_name }}</td>
        <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
            {{ $item->quantity }}</td>
        <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
            @numeric($item->unit_price)</td>
        <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
            @numeric($item->amount)</td>
        <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
            Approved </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
            <span
                class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-white {{ $item->sla_badge }}">
                {{ $item->working_days ?? '-' }}
            </span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
            <div class="inline-flex items-center gap-1">
                <button class="btn bg-warning p-2 text-white btn-edit" edit-data-id="{{ $item->id }}"
                    data-fc-target="editModal" data-fc-type="modal" type="button">
                    <i class="mgc_edit_2_line text-base"></i>
                </button>
                <button class="btn bg-danger p-2 text-white btn-delete" delete-data-id="{{ $item->id }}"
                    data-fc-target="deleteModal" data-fc-type="modal" type="button">
                    <i class="mgc_delete_2_line text-base"></i>
                </button>
            </div>
        </td>
    </tr>
@empty
    <tr>
        <td colspan="3" class="text-center px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
            Data yang dicari tidak ada.
        </td>
    </tr>
@endforelse
