<div class="py-1 px-4 flex flex-col sm:flex-row items-center justify-between">
    {{-- Text Showing --}}
    <div class="text-sm inline-flex items-center text-gray-500 ms-2">
        Showing {{ $data->firstItem() ?? 0 }} to {{ $data->lastItem() ?? 0 }} of 
        <span class="font-bold me-1 ms-1">{{ $data->total() }}</span> entries
    </div>

    {{-- Navigasi --}}
    <nav class="flex items-center space-x-2">
        {{-- Previous --}}
        @if ($data->onFirstPage())
            <span class="text-gray-300 py-2 px-3 inline-flex items-center gap-2 font-medium rounded-md">«</span>
        @else
            <a href="{{ $data->previousPageUrl() }}"
               class="text-gray-400 hover:text-primary py-2 px-3 inline-flex items-center gap-2 font-medium rounded-md">
                «
            </a>
        @endif

        {{-- Halaman --}}
        @for ($i = 1; $i <= $data->lastPage(); $i++)
            @if ($i == $data->currentPage())
                <a href="#"
                   class="w-10 h-10 bg-primary text-white py-2 px-3 inline-flex items-center justify-center text-sm font-medium rounded-full">
                    {{ $i }}
                </a>
            @else
                <a href="{{ $data->url($i) }}"
                   class="w-10 h-10 text-gray-400 hover:text-primary py-2 px-3 inline-flex items-center justify-center text-sm font-medium rounded-full">
                    {{ $i }}
                </a>
            @endif
        @endfor

        {{-- Next --}}
        @if ($data->hasMorePages())
            <a href="{{ $data->nextPageUrl() }}"
               class="text-gray-400 hover:text-primary py-2 px-3 inline-flex items-center gap-2 font-medium rounded-md">
                »
            </a>
        @else
            <span class="text-gray-300 py-2 px-3 inline-flex items-center gap-2 font-medium rounded-md">»</span>
        @endif
    </nav>
</div>
