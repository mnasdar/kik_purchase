document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("table-with-pagination-search");
    
    // Ambil URL dari data attribute pada elemen yang ada di Blade
    const searchRoute = document.getElementById("searchRoute").getAttribute("data-search-url");
    
    const noResultsRow = document.getElementById("noResultsRow");
    const statusTableBody = document.getElementById("statusTableBody");
    
    searchInput.addEventListener("input", function () {
        const query = this.value;

        fetch(`${searchRoute}?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        })
        .then(res => res.text())
        .then(html => {
            // Reset tabel
            statusTableBody.innerHTML = html;
        })
        .catch(err => console.error("Search error:", err));
    });
});
