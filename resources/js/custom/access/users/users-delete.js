/**
 * Modul Users - Delete
 * Mengelola penghapusan user
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showSuccess, showError, confirmDelete } from "../../../core/notification.js";

/**
 * Open delete confirmation
 */
$(document).on("click", ".btn-delete-user", async function () {
    const userId = $(this).data("user-id");
    const userName = $(this).data("user-name");

    // Show confirmation dialog
    const confirmed = await confirmDelete(`user <strong>${userName}</strong>`);
    
    if (!confirmed) return;

    // Proceed with deletion
    try {
        const response = await fetch(route("users.destroy", { user: userId }), {
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Gagal menghapus user");
        }

        showSuccess("User berhasil dihapus", "Berhasil!").then(() => {
            location.reload();
        });
    } catch (error) {
        console.error("Error:", error);
        showError(error.message || "Terjadi kesalahan saat menghapus user");
    }
});
