import $ from 'jquery';

$(document).ready(function () {
    const searchInput = $('#table-with-pagination-search');
    const statusTableBody = $('#DatatableBody');
    const paginationLinks = $('#paginationLinks');
    const searchRoute = $('#searchRoute').data('search-url'); // Pastikan ini sudah ada jika diperlukan

    function fetchData(url = searchRoute, query = '') {
        $.ajax({
            url: url,
            method: 'GET',
            data: { q: query },
            beforeSend: function () {
                // Optional: tampilkan indikator loading
            },
            success: function (response) {
                // Isi ulang tabel dan paginasi
                statusTableBody.html(response.table);
                paginationLinks.html(response.pagination);
            },
            error: function (xhr) {
                console.error("Fetch error:", xhr);
            }
        });
    }

    // Ketika input berubah, cari data
    searchInput.on('input', function () {
        const query = $(this).val();
        fetchData(searchRoute, query);
    });

    // Event delegation untuk pagination
    $(document).on('click', '#paginationLinks a', function (e) {
        e.preventDefault();
        const query = searchInput.val();
        const url = $(this).attr('href');
        fetchData(url, query);
    });
});
