import $ from 'jquery';

$(document).ready(function () {
    const $showprModal = $('#showprModal');
    const $loaderOverlay = $('#loaderOverlay');
    // Route helper
    function routeShowpr(id) {
        return window.routes.routesShowpr.replace('__ID__', id);
    }

    // Loader
    function showLoader() {
        $loaderOverlay.removeClass('hidden').addClass('flex');
    }

    function hideLoader() {
        $loaderOverlay.removeClass('flex').addClass('hidden');
    }

    // Modal control
    function openModal() {
        $showprModal.removeClass('hidden');
        $('body').addClass('overflow-hidden');
    }

    function closeModal() {
        $showprModal.addClass('hidden');
        $('body').removeClass('overflow-hidden');
    }

    $('[data-fc-dismiss]').on('click', function () {
        // Cek kalau tombol dismiss itu berada di dalam modal addprModal
        if ($(this).closest('#addprModal').length) {
            // Reset form di dalam modal addprModal
            $('#addItemForm')[0].reset();

            // Kalau pakai plugin select2 / tomselect, reset manual select
            $('#inputpr_number').val('').trigger('change');

            // Hapus pesan error
            $('#error-pr_number').text('');
        }
    });

    var modalBody = $('#ShowprDatatableBody');
    // Kosongkan datatable dan pagination dulu
    modalBody.html('<tr><td colspan="13" class="text-center p-4">Loading...</td></tr>');

    $('.btn-showpr').on('click', function () {
        const id = $(this).attr('edit-data-id');
        if (!id) return;
        showLoader();
        $.ajax({
            url: routeShowpr(id),
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    modalBody.html(response.html);
                } else {
                    modalBody.html(`<tr><td colspan="13" class="text-center p-4">Tidak ada data.</td></tr>`);
                }
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
        $('.btn-addpr').on('click', function () {
            $('#inputpurchase_order_id').val(id);
        });
    });


    // ✅ inisiasi
    const $form = $("#addFormTracking");
    const $saveBtn = $("#btnSave");
    const $loader = $saveBtn.find(".loader");

    // ✅ Reset form
    function resetForm() {
        $form[0].reset();
        $("[id^='error-']").text("");
        $(".form-input").removeClass("border-red-500");
    }

    // ✅ Tampilkan error validasi
    function displayValidationErrors(errors) {
        $("[id^='error-']").text("");
        $(".form-input").removeClass("border-red-500");

        $.each(errors, function (field, messages) {
            $(`#error-${field}`).text(messages[0]);
            $(`[name="${field}"]`).addClass("border-red-500");
        });
    }

    // ✅ Submit Form
    $form.on("submit", function (e) {
        e.preventDefault();

        const action = $form.attr("action");
        const formData = new FormData(this);

        $loader.removeClass("hidden");
        $saveBtn.prop("disabled", true);

        $.ajax({
            url: action,
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                "X-CSRF-TOKEN": $('input[name="_token"]').val(),
                "Accept": "application/json"
            },
            success: function (response) {
                $loader.addClass("hidden");
                $saveBtn.prop("disabled", false);
                resetForm();
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data berhasil ditambahkan',
                    timer: 1500,
                    showConfirmButton: false
                });

                closeModal();
                // ⬇️ Reload halaman untuk update data
                setTimeout(() => location.reload(), 1500);
            },
            error: function (xhr) {
                $loader.addClass("hidden");
                $saveBtn.prop("disabled", false);

                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    displayValidationErrors(xhr.responseJSON.errors);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Terjadi kesalahan saat menyimpan data'
                    });
                }
            }
        });
    });
});
