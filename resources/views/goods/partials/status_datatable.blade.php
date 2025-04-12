<tbody id="statusTableBody" class="divide-y divide-gray-200 dark:divide-gray-700">
    @forelse($data as $item)
        <tr id="row-{{ $item->id }}"
            class="odd:bg-white even:bg-gray-100 hover:bg-gray-200 dark:odd:bg-gray-800 dark:even:bg-gray-700 dark:hover:bg-gray-600">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                {{ $loop->iteration }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                {{ $item->name }}
                @if($item->is_new)
                    <span
                        class="ml-2 inline-block px-2 py-1 text-xs font-semibold text-white bg-success rounded-full">New</span>
                @elseif($item->is_update)
                    <span
                        class="ml-2 inline-block px-2 py-1 text-xs font-semibold text-white bg-warning rounded-full">Update</span>
                @endif
            </td>
            <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 flex justify-end gap-2">
                <div>
                    <button class="btn bg-warning p-2 text-white btn-edit" edit-data-id="{{ $item->id }}"
                        data-fc-target="editModal" data-fc-type="modal" type="button">
                        <i class="mgc_edit_2_line text-base"></i>
                    </button>
                </div>
                <div>
                    <button class="btn bg-danger p-2 text-white btn-delete" delete-data-id="{{ $item->id }}"
                        data-fc-target="deleteModal" data-fc-type="modal" type="button">
                        <i class="mgc_delete_2_line text-base"></i>
                    </button>
                </div>
            </td>
        </tr>
    @empty
        <!-- Tampilkan pesan jika tidak ada data -->
        <tr id="noResultsRow">
            <td colspan="3" class="text-center px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                Data yang dicari tidak ada.
            </td>
        </tr>
    @endforelse
</tbody>
