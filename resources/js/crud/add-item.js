import $ from 'jquery';

$(document).ready(function () {
    const $form = $("#addItemForm");
    const $saveBtn = $("#btnSave");
    const $loader = $saveBtn.find(".loader");
    const $modal = $("#addModal");

    // ✅ Tampilkan error validasi
    function displayValidationErrors(errors) {
        $("[id^='error-']").text("");
        $(".form-input").removeClass("border-red-500");

        $.each(errors, function (field, messages) {
            $(`#error-${field}`).text(messages[0]);
            $(`[name="${field}"]`).addClass("border-red-500");
        });
    }

    // ✅ Reset form
    function resetForm() {
        $form[0].reset();
        $("[id^='error-']").text("");
        $(".form-input").removeClass("border-red-500");
    }

    // ✅ Buka modal
    function openModal() {
        $modal.removeClass("hidden");
        $("body").addClass("overflow-hidden");
    }

    // ✅ Tutup modal
    function closeModal() {
        $modal.addClass("hidden");
        $("body").removeClass("overflow-hidden");
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
                $('#error-edit-name').text('');
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data berhasil diperbarui',
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
