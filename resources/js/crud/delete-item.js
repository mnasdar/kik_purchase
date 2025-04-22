import $ from 'jquery';

$(document).ready(function () {
    const $deleteModal = $("#deleteModal");
    const $confirmDeleteBtn = $("#confirmDelete");
    let deleteId = null;

    // ✅ Fungsi buka modal delete
    function openDeleteModal(id) {
        deleteId = id;
        $deleteModal.removeClass("hidden");
    }

    // ✅ Fungsi tutup modal delete
    function closeDeleteModal() {
        $deleteModal.addClass("hidden");
        deleteId = null;
    }

    // ✅ Tombol delete → buka modal
    $(".btn-delete").on("click", function () {
        const id = $(this).attr("delete-data-id");
        openDeleteModal(id);
    });

    // ✅ Tombol "Hapus" → lakukan request DELETE
    $confirmDeleteBtn.on("click", function (e) {
        e.preventDefault();
        if (!deleteId) return;

        const deleteUrl = window.routes.routesDestroy.replace("__ID__", deleteId);

        $.ajax({
            url: deleteUrl,
            type: "POST",
            data: {
                _method: "DELETE",
                _token: $('input[name="_token"]').val(),
            },
            headers: {
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            },
            success: function () {
                closeDeleteModal();
                Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Data berhasil dihapus",
                    timer: 1500,
                    showConfirmButton: false
                });

                setTimeout(() => location.reload(), 1500);
            },
            error: function (xhr) {
                closeDeleteModal();

                let message = "Terjadi kesalahan saat menghapus data.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }

                Swal.fire({
                    icon: "error",
                    title: "Gagal menghapus",
                    text: message,
                });
            }
        });
    });
});
