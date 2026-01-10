/**
 * Modul Users - Read & Display
 * Mengelola tabel users dan tampilan data
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showSuccess, showError, showToast } from "../../../core/notification.js";

let actionTippyInstances = [];

/**
 * Inisialisasi tabel users
 */
function initUsersTable() {
    if (!$("#table-users").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "name",
            name: "Name",
            width: "200px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "email",
            name: "Email",
            width: "250px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "role",
            name: "Role",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "verify",
            name: "Verify",
            width: "120px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "status",
            name: "Status",
            width: "120px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "actions",
            name: "Actions",
            width: "180px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];

    initGridTable({
        tableId: "#table-users",
        dataUrl: route("users.data"),
        columns: columns,
        enableCheckbox: false,
        limit: 10,
        enableFilter: false,
        onDataLoaded: () => {
            initActionTooltips();
        },
    });
}

/**
 * Init tooltips for action buttons
 */
function initActionTooltips() {
    // Destroy previous instances to avoid duplicates
    actionTippyInstances.forEach((inst) => inst.destroy());
    actionTippyInstances = [];

    // Initialize tooltips for dynamically loaded buttons
    const targets = document.querySelectorAll('#table-users [data-plugin="tippy"]');
    if (targets.length) {
        actionTippyInstances = tippy(targets);
    }
}

/**
 * Close permissions modal dengan animasi
 */
function closeUserPermissionsModal() {
    const modal = $("#userPermissionsModal");
    const backdrop = $("#userPermissionsModalBackdrop");
    const content = $("#userPermissionsModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        modal.addClass("hidden").removeClass("flex").css("opacity", "0");
    }, 300);
}

/**
 * Open permissions modal dengan animasi
 */
$(document).on("click", ".btn-permissions-user", async function () {
    const userId = $(this).data("user-id");
    const userName = $(this).data("user-name");

    $("#permissionsUserId").val(userId);
    $("#permissionsUserName").text(userName);

    const modal = $("#userPermissionsModal");
    const backdrop = $("#userPermissionsModalBackdrop");
    const content = $("#userPermissionsModalContent");

    // Show modal
    modal.removeClass("hidden").addClass("flex").css("opacity", "1");
    
    // Animate backdrop & content
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ "transform": "scale(1)", "opacity": "1" });
    });

    // Load permissions
    await loadUserPermissions(userId);
});

/**
 * Load user permissions dengan struktur menu (sesuai roles)
 */
async function loadUserPermissions(userId) {
    try {
        const response = await fetch(route("users.permissionsStructured", { user: userId }));
        const data = await response.json();

        const rolePermissions = data.rolePermissions || [];
        const customPermissions = data.customPermissions || [];
        const structured = data.structured || [];
        const customIds = customPermissions.map((p) => p.id);

        // Render role permissions (read-only) dengan struktur menu
        let rolePermHtml = "";
        
        structured.forEach((menu) => {
            let menuHasPermissions = false;
            let menuPermsHtml = "";

            if (menu.submenus && menu.submenus.length > 0) {
                // Menu dengan sub-menus
                menu.submenus.forEach((submenu) => {
                    const submenuPerms = submenu.permissions.filter((p) =>
                        rolePermissions.some((rp) => rp.id === p.id)
                    );

                    if (submenuPerms.length > 0) {
                        menuHasPermissions = true;
                        menuPermsHtml += `
                            <div class="ml-4 space-y-1">
                                <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    ${submenu.submenu}
                                </p>
                        `;

                        submenuPerms.forEach((perm) => {
                            menuPermsHtml += `
                                <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
                                    <div class="w-4 h-4 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center flex-shrink-0">
                                        <i class="mgc_check_line text-white text-xs"></i>
                                    </div>
                                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        ${getActionLabel(perm.name)} ${perm.display_name || perm.name}
                                    </span>
                                </div>
                            `;
                        });

                        menuPermsHtml += `</div>`;
                    }
                });
            } else if (menu.permissions && menu.permissions.length > 0) {
                // Menu tanpa sub-menus
                const menuPerms = menu.permissions.filter((p) =>
                    rolePermissions.some((rp) => rp.id === p.id)
                );

                if (menuPerms.length > 0) {
                    menuHasPermissions = true;

                    menuPerms.forEach((perm) => {
                        menuPermsHtml += `
                            <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
                                <div class="w-4 h-4 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center flex-shrink-0">
                                    <i class="mgc_check_line text-white text-xs"></i>
                                </div>
                                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    ${getActionLabel(perm.name)} ${perm.display_name || perm.name}
                                </span>
                            </div>
                        `;
                    });
                }
            }

            if (menuHasPermissions) {
                rolePermHtml += `
                    <div class="mb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="${menu.icon} text-blue-600 dark:text-blue-400"></i>
                            <h5 class="text-sm font-bold text-gray-800 dark:text-gray-100">${menu.menu}</h5>
                        </div>
                        ${menuPermsHtml}
                    </div>
                `;
            }
        });

        if (rolePermHtml === "") {
            rolePermHtml = `
                <div class="flex items-center justify-center py-6 text-center">
                    <div>
                        <i class="mgc_inbox_line text-2xl text-gray-400 dark:text-gray-600 mb-2 block"></i>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            User tidak memiliki role atau role tidak memiliki permissions
                        </p>
                    </div>
                </div>
            `;
        }
        $("#rolePermissionsContainer").html(rolePermHtml);

        // Render custom permissions dengan struktur menu (editable)
        let customPermHtml = "";

        structured.forEach((menu) => {
            const menuSlug = (menu.menu || "Other").toLowerCase().replace(/\s+/g, '-');
            let hasEditablePerms = false;
            let submenuHtml = "";

            if (menu.submenus && menu.submenus.length > 0) {
                // Menu dengan sub-menus
                menu.submenus.forEach((submenu) => {
                    const submenuSlug = (submenu.submenu || "Other").toLowerCase().replace(/\s+/g, '-');
                    const editablePerms = submenu.permissions.filter((p) => {
                        return !rolePermissions.some((rp) => rp.id === p.id);
                    });

                    if (editablePerms.length > 0) {
                        hasEditablePerms = true;

                        submenuHtml += `
                            <div class="ml-4 pl-3 border-l-2 border-purple-300 dark:border-purple-700 space-y-2" data-submenu="${submenuSlug}">
                                <div class="px-3 py-2 rounded-lg bg-purple-50 dark:bg-slate-700/40">
                                    <label class="font-medium text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2 cursor-pointer hover:text-purple-900 dark:hover:text-purple-100 transition-colors">
                                        <input type="checkbox" 
                                            class="submenu-select-all w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                            data-menu="${menuSlug}"
                                            data-submenu="${submenuSlug}">
                                        <span class="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                                        ${submenu.submenu}
                                    </label>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                        `;

                        editablePerms.forEach((perm) => {
                            const isChecked = customIds.includes(perm.id) ? "checked" : "";
                            submenuHtml += `
                                <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-purple-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                                    <input type="checkbox" name="permissions[]" 
                                        value="${perm.id}" 
                                        class="permission-checkbox w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                        data-menu="${menuSlug}"
                                        data-submenu="${submenuSlug}"
                                        ${isChecked}>
                                    <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        <strong>${getActionLabel(perm.name)}</strong>
                                    </span>
                                </label>
                            `;
                        });

                        submenuHtml += `
                                </div>
                            </div>
                        `;
                    }
                });
            } else if (menu.permissions && menu.permissions.length > 0) {
                // Menu tanpa sub-menus
                const editablePerms = menu.permissions.filter((p) => {
                    return !rolePermissions.some((rp) => rp.id === p.id);
                });

                if (editablePerms.length > 0) {
                    hasEditablePerms = true;

                    submenuHtml += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">`;

                    editablePerms.forEach((perm) => {
                        const isChecked = customIds.includes(perm.id) ? "checked" : "";
                        submenuHtml += `
                            <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-purple-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                                <input type="checkbox" name="permissions[]" 
                                    value="${perm.id}" 
                                    class="permission-checkbox w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                    data-menu="${menuSlug}"
                                    ${isChecked}>
                                <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                    <strong>${getActionLabel(perm.name)}</strong>
                                </span>
                            </label>
                        `;
                    });

                    submenuHtml += `</div>`;
                }
            }

            if (hasEditablePerms) {
                customPermHtml += `
                    <div class="space-y-3" data-menu="${menuSlug}">
                        <div class="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 sticky top-0 z-10">
                            <div class="flex items-center gap-3">
                                <i class="${menu.icon} text-lg text-purple-600 dark:text-purple-400"></i>
                                <label class="font-semibold text-sm text-purple-900 dark:text-purple-100 flex-1 cursor-pointer">
                                    <input type="checkbox" 
                                        class="menu-select-all w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer mr-2"
                                        data-menu="${menuSlug}">
                                    <span>${menu.menu}</span>
                                </label>
                            </div>
                        </div>
                        ${submenuHtml}
                    </div>
                `;
            }
        });

        if (customPermHtml === "") {
            customPermHtml = `
                <div class="flex items-center justify-center py-6 text-center">
                    <div>
                        <i class="mgc_checkbox_line text-2xl text-gray-400 dark:text-gray-600 mb-2 block"></i>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Semua permissions sudah tercakup dari role
                        </p>
                    </div>
                </div>
            `;
        }

        $("#customPermissionsContainer").html(customPermHtml);
        
        // Initialize menu/submenu checkboxes
        initUserMenuCheckboxes();
    } catch (error) {
        console.error("Error loading permissions:", error);
        const errorHtml = `
            <div class="flex items-center justify-center py-8">
                <div class="text-center">
                    <i class="mgc_alert_circle_line text-3xl text-red-500 dark:text-red-400 mb-2 block"></i>
                    <p class="text-sm text-red-600 dark:text-red-400 font-medium">
                        Gagal memuat permissions
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Silakan coba lagi
                    </p>
                </div>
            </div>
        `;
        $("#rolePermissionsContainer").html(errorHtml);
        $("#customPermissionsContainer").html(errorHtml);
    }
}

/**
 * Get human-readable action label
 */
function getActionLabel(permissionName) {
    const actions = {
        '.view': '👁️',
        '.create': '➕',
        '.edit': '✏️',
        '.delete': '🗑️',
        '.approve': '✅',
        '.export': '📤',
    };

    for (const [key, label] of Object.entries(actions)) {
        if (permissionName.includes(key)) {
            return label;
        }
    }

    return '🔐';
}

/**
 * Initialize user menu/submenu checkbox states and event handlers
 */
function initUserMenuCheckboxes() {
    // Update all menu/submenu checkboxes based on current state
    $(".menu-select-all").each(function () {
        updateUserMenuCheckboxState($(this).data("menu"));
    });

    $(".submenu-select-all").each(function () {
        updateUserSubmenuCheckboxState($(this).data("menu"), $(this).data("submenu"));
    });

    // Handle menu checkbox click
    $(document).off("change", ".menu-select-all").on("change", ".menu-select-all", function () {
        const menu = $(this).data("menu");
        const isChecked = $(this).prop("checked");
        
        $(`.permission-checkbox[data-menu="${menu}"]`).prop("checked", isChecked);
        $(`.submenu-select-all[data-menu="${menu}"]`).each(function() {
            $(this).prop("checked", isChecked).prop("indeterminate", false);
        });
        
        updateUserMenuCheckboxState(menu);
    });

    // Handle submenu checkbox click
    $(document).off("change", ".submenu-select-all").on("change", ".submenu-select-all", function () {
        const menu = $(this).data("menu");
        const submenu = $(this).data("submenu");
        const isChecked = $(this).prop("checked");
        
        $(`.permission-checkbox[data-menu="${menu}"][data-submenu="${submenu}"]`).prop("checked", isChecked);
        
        updateUserMenuCheckboxState(menu);
    });

    // Handle individual permission checkbox click
    $(document).off("change", ".permission-checkbox").on("change", ".permission-checkbox", function () {
        const menu = $(this).data("menu");
        const submenu = $(this).data("submenu");
        
        if (submenu) {
            updateUserSubmenuCheckboxState(menu, submenu);
        }
        updateUserMenuCheckboxState(menu);
    });
}

/**
 * Update user menu checkbox state
 */
function updateUserMenuCheckboxState(menu) {
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
 * Update user submenu checkbox state
 */
function updateUserSubmenuCheckboxState(menu, submenu) {
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
 * Handle permissions form submission
 */
$("#form-user-permissions").on("submit", async function (e) {
    e.preventDefault();

    const userId = $("#permissionsUserId").val();
    const formData = new FormData(this);
    const submitBtn = $(this).find('button[type="submit"]');
    const originalBtnText = submitBtn.html();

    // Show loading state
    submitBtn.prop("disabled", true);
    submitBtn.html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');

    try {
        const response = await fetch(
            route("users.updatePermissions", { user: userId }),
            {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                body: formData,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Gagal mengupdate permissions");
        }

        showSuccess("Permissions berhasil diupdate", "Berhasil!").then(() => {
            closeUserPermissionsModal();
            location.reload();
        });
    } catch (error) {
        console.error("Error:", error);
        showError(error.message || "Terjadi kesalahan saat menyimpan permissions");
    } finally {
        submitBtn.prop("disabled", false);
        submitBtn.html(originalBtnText);
    }
});

/**
 * Permissions modal close buttons
 */
$("#userPermissionsModalClose, #userPermissionsModalCancel").on("click", function () {
    closeUserPermissionsModal();
});

/**
 * Toggle role permissions visibility
 */
$(document).on("click", "#toggleRolePermissions", function () {
    const wrapper = $("#rolePermissionsWrapper");
    const icon = $("#toggleRoleIcon");
    const text = $("#toggleRoleText");
    const isMinimized = wrapper.hasClass("minimized");

    if (isMinimized) {
        // Expand
        wrapper.removeClass("minimized").css("max-height", "288px");
        icon.removeClass("mgc_maximize_line").addClass("mgc_minimize_line");
        text.text("Minimize");
    } else {
        // Minimize
        wrapper.addClass("minimized").css("max-height", "0");
        icon.removeClass("mgc_minimize_line").addClass("mgc_maximize_line");
        text.text("Expand");
    }
});

/**
 * Refresh table data
 */
function refreshTable() {
    const grid = $("#table-users").data('grid');
    if (!grid) return;

    showToast('Memuat data...', 'info', 1000);

    $.ajax({
        url: route("users.data"),
        method: "GET",
        success: function (data) {
            const gridData = data.map((item) => [
                item.number,
                item.name,
                item.email,
                item.role,
                item.verify,
                item.status,
                item.actions,
            ]);

            grid.updateConfig({
                data: gridData,
            }).forceRender();

            setTimeout(() => {
                initActionTooltips();
            }, 300);

            showToast('Data berhasil direfresh', 'success', 1500);
        },
        error: function (xhr) {
            console.error("Error loading data:", xhr);
            showToast('Gagal memuat data', 'error', 2000);
        },
    });
}

/**
 * Refresh button
 */
$("#btn-refresh").off("click").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    refreshTable();
});

// Initialize
$(document).ready(function () {
    initUsersTable();
});

