/**
 * Modul Roles - Delete
 * Mengelola penghapusan role
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { confirmAction, showSuccess, showError } from "../../../core/notification.js";

/**
 * Handle delete role button click
 */
$(document).on("click", ".btn-delete-role", async function () {
    const roleId = $(this).data("role-id");
    const roleName = $(this).data("role-name");

    const confirmed = await confirmAction(
        `Apakah Anda yakin ingin menghapus role "${roleName}"?`,
        "Hapus Role?",
        {
            confirmButtonText: "Ya, hapus",
            cancelButtonText: "Batal",
            icon: "warning",
        }
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(route("roles.destroy", { role: roleId }), {
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Gagal menghapus role");
        }

        showSuccess(
            data.message || "Role berhasil dihapus",
            "Berhasil!"
        ).then(() => {
            location.reload();
        });
    } catch (error) {
        console.error("Error:", error);
        showError(error.message || "Terjadi kesalahan saat menghapus role");
    }
});
