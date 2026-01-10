/**
 * Modul Roles - Create
 * Mengelola form create role baru
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showSuccess, showError } from "../../../core/notification.js";

/**
 * Load permissions dari server dengan struktur menu
 */
async function loadPermissions(selectedIds = []) {
    try {
        const response = await fetch(route("roles.permissionsStructured"));
        const data = await response.json();
        const structured = data.structured || [];

        let html = "";

        // Render permissions organized by menu structure
        structured.forEach((menu) => {
            const menuSlug = (menu.menu || "Other").toLowerCase().replace(/\s+/g, '-');
            
            // Menu header dengan icon
            html += `
                <div class="space-y-3" data-menu="${menuSlug}">
                    <div class="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 sticky top-0 z-10">
                        <div class="flex items-center gap-3">
                            <i class="${menu.icon} text-lg text-blue-600 dark:text-blue-400"></i>
                            <label class="font-semibold text-sm text-blue-900 dark:text-blue-100 flex-1 cursor-pointer">
                                <input type="checkbox" 
                                    class="menu-select-all w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer mr-2"
                                    data-menu="${menuSlug}">
                                <span>${menu.menu}</span>
                            </label>
                        </div>
                    </div>
            `;

            // Check if has submenus
            if (menu.submenus && menu.submenus.length > 0) {
                // Render submenus
                menu.submenus.forEach((submenu) => {
                    const submenuSlug = (submenu.submenu || "Other").toLowerCase().replace(/\s+/g, '-');
                    
                    html += `
                        <div class="ml-4 pl-3 border-l-2 border-blue-300 dark:border-blue-700 space-y-2" data-submenu="${submenuSlug}">
                            <div class="px-3 py-2 rounded-lg bg-blue-50 dark:bg-slate-700/40">
                                <label class="font-medium text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-2 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100 transition-colors">
                                    <input type="checkbox" 
                                        class="submenu-select-all w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                        data-menu="${menuSlug}"
                                        data-submenu="${submenuSlug}">
                                    <span class="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                                    ${submenu.submenu}
                                </label>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                    `;

                    if (submenu.permissions && submenu.permissions.length > 0) {
                        submenu.permissions.forEach((permission) => {
                            const isChecked = selectedIds.includes(permission.id) ? "checked" : "";
                            html += `
                                <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                                    <input type="checkbox" name="permissions[]" 
                                        value="${permission.id}" 
                                        class="permission-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                        data-menu="${menuSlug}"
                                        data-submenu="${submenuSlug}"
                                        ${isChecked}>
                                    <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        <strong>${getActionLabel(permission.name)}</strong>
                                    </span>
                                </label>
                            `;
                        });
                    } else {
                        html += `
                            <p class="text-xs text-gray-500 dark:text-gray-400 py-2 px-2 col-span-2 italic">
                                Tidak ada permission
                            </p>
                        `;
                    }

                    html += `
                            </div>
                        </div>
                    `;
                });
            } else if (menu.permissions && menu.permissions.length > 0) {
                // Render permissions directly without submenus
                html += `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                `;

                menu.permissions.forEach((permission) => {
                    const isChecked = selectedIds.includes(permission.id) ? "checked" : "";
                    html += `
                        <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                            <input type="checkbox" name="permissions[]" 
                                value="${permission.id}" 
                                class="permission-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                data-menu="${menuSlug}"
                                ${isChecked}>
                            <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                <strong>${permission.display_name || permission.name}</strong>
                            </span>
                        </label>
                    `;
                });

                html += `
                    </div>
                `;
            }

            html += `
                </div>
            `;
        });

        $("#permissionsContainer").html(html);
        
        // Initialize menu/submenu checkboxes
        initMenuCheckboxes();
    } catch (error) {
        console.error("Error loading permissions:", error);
        $("#permissionsContainer").html(
            '<p class="text-red-500 text-sm">Gagal memuat permissions</p>'
        );
    }
}

/**
 * Get human-readable action label
 */
function getActionLabel(permissionName) {
    const actions = {
        '.view': '👁️ Lihat',
        '.create': '➕ Buat',
        '.edit': '✏️ Edit',
        '.delete': '🗑️ Hapus',
        '.approve': '✅ Approve',
        '.export': '📤 Export',
    };

    for (const [key, label] of Object.entries(actions)) {
        if (permissionName.includes(key)) {
            return label;
        }
    }

    return '🔐 ' + permissionName;
}

/**
 * Initialize menu/submenu checkbox states and event handlers
 */
function initMenuCheckboxes() {
    // Update all menu/submenu checkboxes based on current state
    $(".menu-select-all").each(function () {
        updateMenuCheckboxState($(this).data("menu"));
    });

    $(".submenu-select-all").each(function () {
        updateSubmenuCheckboxState($(this).data("menu"), $(this).data("submenu"));
    });

    // Handle menu checkbox click (select/deselect all in menu)
    $(document).off("change", ".menu-select-all").on("change", ".menu-select-all", function () {
        const menu = $(this).data("menu");
        const isChecked = $(this).prop("checked");
        
        // Select/deselect all permissions in this menu
        $(`.permission-checkbox[data-menu="${menu}"]`).prop("checked", isChecked);
        
        // Update all submenu checkboxes in this menu
        $(`.submenu-select-all[data-menu="${menu}"]`).each(function() {
            $(this).prop("checked", isChecked).prop("indeterminate", false);
        });
        
        updateMenuCheckboxState(menu);
    });

    // Handle submenu checkbox click (select/deselect all in submenu)
    $(document).off("change", ".submenu-select-all").on("change", ".submenu-select-all", function () {
        const menu = $(this).data("menu");
        const submenu = $(this).data("submenu");
        const isChecked = $(this).prop("checked");
        
        // Select/deselect all permissions in this submenu
        $(`.permission-checkbox[data-menu="${menu}"][data-submenu="${submenu}"]`).prop("checked", isChecked);
        
        // Update menu checkbox state
        updateMenuCheckboxState(menu);
    });

    // Handle individual permission checkbox click
    $(document).off("change", ".permission-checkbox").on("change", ".permission-checkbox", function () {
        const menu = $(this).data("menu");
        const submenu = $(this).data("submenu");
        
        if (submenu) {
            updateSubmenuCheckboxState(menu, submenu);
        }
        updateMenuCheckboxState(menu);
    });
}

/**
 * Update menu checkbox state based on its permissions
 */
function updateMenuCheckboxState(menu) {
    const menuCheckbox = $(`.menu-select-all[data-menu="${menu}"]`);
    const permissionCheckboxes = $(`.permission-checkbox[data-menu="${menu}"]`);
    
    const total = permissionCheckboxes.length;
    const checked = permissionCheckboxes.filter(":checked").length;
    
    if (checked === 0) {
        menuCheckbox.prop("checked", false);
        menuCheckbox.prop("indeterminate", false);
    } else if (checked === total) {
        menuCheckbox.prop("checked", true);
        menuCheckbox.prop("indeterminate", false);
    } else {
        menuCheckbox.prop("checked", false);
        menuCheckbox.prop("indeterminate", true);
    }
}

/**
 * Update submenu checkbox state based on its permissions
 */
function updateSubmenuCheckboxState(menu, submenu) {
    const submenuCheckbox = $(`.submenu-select-all[data-menu="${menu}"][data-submenu="${submenu}"]`);
    const permissionCheckboxes = $(`.permission-checkbox[data-menu="${menu}"][data-submenu="${submenu}"]`);
    
    const total = permissionCheckboxes.length;
    const checked = permissionCheckboxes.filter(":checked").length;
    
    if (checked === 0) {
        submenuCheckbox.prop("checked", false);
        submenuCheckbox.prop("indeterminate", false);
    } else if (checked === total) {
        submenuCheckbox.prop("checked", true);
        submenuCheckbox.prop("indeterminate", false);
    } else {
        submenuCheckbox.prop("checked", false);
        submenuCheckbox.prop("indeterminate", true);
    }
}

/**
 * Reset modal form
 */
function resetRoleForm() {
    $("#form-role")[0].reset();
    $("#roleId").val("");
    $("#roleMethod").val("POST");
    loadPermissions([]);
    $("p[id^='error-']").text("");
}

/**
 * Close role modal dengan animasi
 */
function closeRoleModal() {
    const modal = $("#roleModal");
    const backdrop = $("#roleModalBackdrop");
    const content = $("#roleModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        modal.addClass("hidden").removeClass("flex").css("opacity", "0");
    }, 300);
}

/**
 * Open modal create role dengan animasi
 */
$("#btn-create-role").on("click", async function () {
    resetRoleForm();
    $("#roleModalTitle").text("Tambah Role");
    $("#roleModalIcon").removeClass("mgc_shield_edit_line").addClass("mgc_shield_add_line");
    $("#roleMethod").val("POST");

    const modal = $("#roleModal");
    const backdrop = $("#roleModalBackdrop");
    const content = $("#roleModalContent");

    // Show modal
    modal.removeClass("hidden").addClass("flex").css("opacity", "1");
    
    // Animate backdrop & content
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ "transform": "scale(1)", "opacity": "1" });
    });

    await loadPermissions([]);
});

/**
 * Handle role form submission (Create)
 */
$("#form-role").on("submit", async function (e) {
    e.preventDefault();

    const roleId = $("#roleId").val();
    const isCreate = !roleId;
    
    // Only handle create in this module
    if (!isCreate) return;

    const url = route("roles.store");
    const formData = new FormData(this);
    const submitBtn = $(this).find('button[type="submit"]');
    const originalBtnText = submitBtn.html();

    // Clear previous errors
    $("p[id^='error-']").text("");

    // Client-side validation
    const name = formData.get("name");
    if (!name || name.trim() === "") {
        $("#error-name").html('<i class="mgc_info_line mr-1"></i>Nama role wajib diisi');
        return;
    }

    const permissions = formData.getAll("permissions[]");
    if (permissions.length === 0) {
        $("#error-permissions").html('<i class="mgc_info_line mr-1"></i>Minimal 1 permission harus dipilih');
        return;
    }

    // Show loading state
    submitBtn.prop("disabled", true);
    submitBtn.html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
            body: formData,
        });

        const responseText = await response.text();
        let data = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error("Failed to parse JSON response", parseError, responseText);
            showError("Respon server tidak valid. Silakan coba lagi.");
            return;
        }

        if (!response.ok) {
            if (data.errors) {
                Object.keys(data.errors).forEach((field) => {
                    const errorEl = $(`#error-${field}`);
                    if (errorEl.length) {
                        errorEl.html(`<i class="mgc_alert_circle_line mr-1"></i>${data.errors[field][0]}`);
                    }
                });
            } else {
                showError(data.message || "Gagal menyimpan role");
            }
            return;
        }

        showSuccess(
            data.message || "Role berhasil ditambahkan",
            "Berhasil!"
        ).then(() => {
            closeRoleModal();
            location.reload();
        });
    } catch (error) {
        console.error("Error:", error);
        showError("Terjadi kesalahan saat menyimpan role");
    } finally {
        submitBtn.prop("disabled", false);
        submitBtn.html(originalBtnText);
    }
});

/**
 * Modal close buttons
 */
$("#roleModalClose, #roleModalCancel").on("click", function () {
    closeRoleModal();
});

// Export functions for use in other modules
export { loadPermissions, closeRoleModal };
