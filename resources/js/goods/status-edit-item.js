import $ from 'jquery';

$(document).ready(function () {
    const $loaderOverlay = $('#loaderOverlay');
    const $editModal = $('#editModal');
    const $form = $('#editItemForm');
    const $submitBtn = $('#btnUpdate');
    const $loader = $submitBtn.find('.loader');

    // 🔁 Fungsi route dinamis
    function routeEdit(id) {
        return window.routes.statusEdit.replace('__ID__', id);
    }

    function routeUpdate(id) {
        return window.routes.statusUpdate.replace('__ID__', id);
    }

    function showLoader() {
        $loaderOverlay.removeClass('hidden');
    }

    function hideLoader() {
        $loaderOverlay.addClass('hidden');
    }

    function openModal() {
        $editModal.removeClass('hidden');
        $('body').addClass('overflow-hidden');
    }

    function closeModal() {
        $editModal.addClass('hidden');
        $('body').removeClass('overflow-hidden');
    }

    // 🔧 Event tombol edit
    $('.btn-edit').on('click', function () {
        const id = $(this).attr('edit-data-id');
        showLoader();

        $.ajax({
            url: routeEdit(id),
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                $('#editName').val(data.name);
                $form.attr('action', routeUpdate(data.id));
                hideLoader();
                openModal();
            },
            error: function () {
                hideLoader();
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Gagal mengambil data! Silakan coba lagi.'
                });
            }
        });
    });

    // 🔧 Submit form update
    $form.on('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const actionUrl = $form.attr('action');

        $submitBtn.prop('disabled', true);
        $loader.removeClass('hidden');

        $.ajax({
            url: actionUrl,
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': formData.get('_token'),
                'Accept': 'application/json'
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                $('#error-edit-name').text('');
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data berhasil diperbarui',
                    timer: 1500,
                    showConfirmButton: false
                });

                closeModal();
                setTimeout(() => location.reload(), 1500);
            },
            error: function (xhr) {
                if (xhr.status === 422) {
                    const errors = xhr.responseJSON.errors || {};
                    $('#error-edit-name').text(errors.name?.[0] || '');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Terjadi kesalahan saat memperbarui data.'
                    });
                }
            },
            complete: function () {
                $submitBtn.prop('disabled', false);
                $loader.addClass('hidden');
            }
        });
    });
});
