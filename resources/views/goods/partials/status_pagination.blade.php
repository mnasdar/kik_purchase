<nav class="flex items-center space-x-2">
    {{-- Tombol Previous --}}
    @if($data->onFirstPage())
        <span class="text-gray-300 p-4 inline-flex items-center gap-2 font-medium rounded-md">«</span>
    @else
        <a href="{{ $data->previousPageUrl() }}"
            class="text-gray-400 hover:text-primary p-4 inline-flex items-center gap-2 font-medium rounded-md">
            <span aria-hidden="true">«</span>
        </a>
    @endif

    {{-- Tombol Halaman --}}
    @for($i = 1; $i <= $data->lastPage(); $i++)
        @if($i == $data->currentPage())
            <a class="w-10 h-10 bg-primary text-white p-4 inline-flex items-center text-sm font-medium rounded-full"
                href="#">{{ $i }}</a>
        @else
            <a class="w-10 h-10 text-gray-400 hover:text-primary p-4 inline-flex items-center text-sm font-medium rounded-full"
                href="{{ $data->url($i) }}">{{ $i }}</a>
        @endif
    @endfor

    {{-- Tombol Next --}}
    @if($data->hasMorePages())
        <a href="{{ $data->nextPageUrl() }}"
            class="text-gray-400 hover:text-primary p-4 inline-flex items-center gap-2 font-medium rounded-md">
            <span aria-hidden="true">»</span>
        </a>
    @else
        <span class="text-gray-300 p-4 inline-flex items-center gap-2 font-medium rounded-md">»</span>
    @endif
</nav>
