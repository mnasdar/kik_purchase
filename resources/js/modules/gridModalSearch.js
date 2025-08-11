import $ from "jquery";
import Swal from "sweetalert2";
import { Grid, h } from "gridjs";
import { route } from "ziggy-js";

function initGridModalSearch({
    modalId,
    formId,
    tableId,
    routeName,
    mapGridData,
    gridColumns,
    pageLimit = 5,
    prefix,
}) {
    const $modal = $(modalId);
    const $form = $(formId);
    const $table = $(tableId);
    const $input = $form.find("input[name='search']");

    function openModal() {
        $modal.removeClass("hidden").addClass("flex");
    }

    function closeModal() {
        $modal.addClass("hidden").removeClass("flex");
        $table.empty();
        $input.focus();
    }

    $modal.find("[data-fc-dismiss]").on("click", closeModal);

    function initGridTable({ gridData }) {
        const container = document.querySelector(tableId);
        if (!container) return;

        while (container.firstChild)
            container.removeChild(container.firstChild);

        const newGridWrapper = document.createElement("div");
        container.appendChild(newGridWrapper);

        new Grid({
            columns: gridColumns,
            data: gridData,
            pagination: { limit: pageLimit },
            search: true,
            sort: true,
        }).render(newGridWrapper);
    }

    $form.on("submit", function (e) {
        e.preventDefault();

        const keyword = $input.val();
        let url = "";
        if (!prefix) {
            url = route(routeName, keyword);
        } else {
            url = route(routeName, [prefix, keyword]);
        }

        const formData = {};
        $form.find("[name]").each(function () {
            const name = $(this).attr("name");
            formData[name] = $(this).val();
        });

        if (!formData["search"] || formData["search"].trim() === "") {
            Swal.fire({
                icon: "warning",
                title: "Input kosong",
                text: "Silakan isi keyword pencarian terlebih dahulu.",
            });
            return;
        }

        $.ajax({
            url,
            method: "GET",
            data: formData,
            beforeSend: function () {
                $table
                    .empty()
                    .append(
                        '<p class="text-center py-4 text-gray-500">Memuat data...</p>'
                    );
            },
            success: function (data) {
                if (!data.length) {
                    $table.html(
                        '<p class="text-center py-4 text-gray-400">Data tidak ditemukan.</p>'
                    );
                    openModal();
                    return;
                }

                const gridData = data.map(mapGridData);
                initGridTable({ gridData });
                openModal();
                $input.val("");
            },
            error: function () {
                $table.html(
                    '<p class="text-center text-red-500">Gagal memuat data.</p>'
                );
            },
        });
    });

    return { closeModal, openModal };
}

export default initGridModalSearch;
