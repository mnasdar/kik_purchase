import{$ as e}from"./modal-handler-2823516c.js";import{s as k}from"./index-88056f3d.js";import{a as b,b as v}from"./notification-d92c8c7c.js";import"./_commonjsHelpers-725317a4.js";import"./parse-c3570fb2.js";import"./notification-5f085df9.js";async function x(t=[]){try{const l=(await(await fetch(k("roles.permissionsStructured"))).json()).structured||[];let o="";l.forEach(a=>{const c=(a.menu||"Other").toLowerCase().replace(/\s+/g,"-");o+=`
                <div class="space-y-3" data-menu="${c}">
                    <div class="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 sticky top-0 z-10">
                        <div class="flex items-center gap-3">
                            <i class="${a.icon} text-lg text-blue-600 dark:text-blue-400"></i>
                            <label class="font-semibold text-sm text-blue-900 dark:text-blue-100 flex-1 cursor-pointer">
                                <input type="checkbox" 
                                    class="menu-select-all w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer mr-2"
                                    data-menu="${c}">
                                <span>${a.menu}</span>
                            </label>
                        </div>
                    </div>
            `,a.submenus&&a.submenus.length>0?a.submenus.forEach(n=>{const d=(n.submenu||"Other").toLowerCase().replace(/\s+/g,"-");o+=`
                        <div class="ml-4 pl-3 border-l-2 border-blue-300 dark:border-blue-700 space-y-2" data-submenu="${d}">
                            <div class="px-3 py-2 rounded-lg bg-blue-50 dark:bg-slate-700/40">
                                <label class="font-medium text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-2 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100 transition-colors">
                                    <input type="checkbox" 
                                        class="submenu-select-all w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                        data-menu="${c}"
                                        data-submenu="${d}">
                                    <span class="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                                    ${n.submenu}
                                </label>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                    `,n.permissions&&n.permissions.length>0?n.permissions.forEach(i=>{const p=t.includes(i.id)?"checked":"";o+=`
                                <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                                    <input type="checkbox" name="permissions[]" 
                                        value="${i.id}" 
                                        class="permission-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                        data-menu="${c}"
                                        data-submenu="${d}"
                                        ${p}>
                                    <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        <strong>${$(i.name)}</strong>
                                    </span>
                                </label>
                            `}):o+=`
                            <p class="text-xs text-gray-500 dark:text-gray-400 py-2 px-2 col-span-2 italic">
                                Tidak ada permission
                            </p>
                        `,o+=`
                            </div>
                        </div>
                    `}):a.permissions&&a.permissions.length>0&&(o+=`
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                `,a.permissions.forEach(n=>{const d=t.includes(n.id)?"checked":"";o+=`
                        <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                            <input type="checkbox" name="permissions[]" 
                                value="${n.id}" 
                                class="permission-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                data-menu="${c}"
                                ${d}>
                            <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                <strong>${n.display_name||n.name}</strong>
                            </span>
                        </label>
                    `}),o+=`
                    </div>
                `),o+=`
                </div>
            `}),e("#permissionsContainer").html(o),C()}catch(r){console.error("Error loading permissions:",r),e("#permissionsContainer").html('<p class="text-red-500 text-sm">Gagal memuat permissions</p>')}}function $(t){const r={".view":"👁️ Lihat",".create":"➕ Buat",".edit":"✏️ Edit",".delete":"🗑️ Hapus",".approve":"✅ Approve",".export":"📤 Export"};for(const[s,l]of Object.entries(r))if(t.includes(s))return l;return"🔐 "+t}function C(){e(".menu-select-all").each(function(){h(e(this).data("menu"))}),e(".submenu-select-all").each(function(){f(e(this).data("menu"),e(this).data("submenu"))}),e(document).off("change",".menu-select-all").on("change",".menu-select-all",function(){const t=e(this).data("menu"),r=e(this).prop("checked");e(`.permission-checkbox[data-menu="${t}"]`).prop("checked",r),e(`.submenu-select-all[data-menu="${t}"]`).each(function(){e(this).prop("checked",r).prop("indeterminate",!1)}),h(t)}),e(document).off("change",".submenu-select-all").on("change",".submenu-select-all",function(){const t=e(this).data("menu"),r=e(this).data("submenu"),s=e(this).prop("checked");e(`.permission-checkbox[data-menu="${t}"][data-submenu="${r}"]`).prop("checked",s),h(t)}),e(document).off("change",".permission-checkbox").on("change",".permission-checkbox",function(){const t=e(this).data("menu"),r=e(this).data("submenu");r&&f(t,r),h(t)})}function h(t){const r=e(`.menu-select-all[data-menu="${t}"]`),s=e(`.permission-checkbox[data-menu="${t}"]`),l=s.length,o=s.filter(":checked").length;o===0?(r.prop("checked",!1),r.prop("indeterminate",!1)):o===l?(r.prop("checked",!0),r.prop("indeterminate",!1)):(r.prop("checked",!1),r.prop("indeterminate",!0))}function f(t,r){const s=e(`.submenu-select-all[data-menu="${t}"][data-submenu="${r}"]`),l=e(`.permission-checkbox[data-menu="${t}"][data-submenu="${r}"]`),o=l.length,a=l.filter(":checked").length;a===0?(s.prop("checked",!1),s.prop("indeterminate",!1)):a===o?(s.prop("checked",!0),s.prop("indeterminate",!1)):(s.prop("checked",!1),s.prop("indeterminate",!0))}function w(){e("#form-role")[0].reset(),e("#roleId").val(""),e("#roleMethod").val("POST"),x([]),e("p[id^='error-']").text("")}function y(){const t=e("#roleModal"),r=e("#roleModalBackdrop"),s=e("#roleModalContent");r.css("opacity","0"),s.css({transform:"scale(0.95)",opacity:"0"}),setTimeout(()=>{t.addClass("hidden").removeClass("flex").css("opacity","0")},300)}e("#btn-create-role").on("click",async function(){w(),e("#roleModalTitle").text("Tambah Role"),e("#roleModalIcon").removeClass("mgc_shield_edit_line").addClass("mgc_shield_add_line"),e("#roleMethod").val("POST");const t=e("#roleModal"),r=e("#roleModalBackdrop"),s=e("#roleModalContent");t.removeClass("hidden").addClass("flex").css("opacity","1"),requestAnimationFrame(()=>{r.css("opacity","1"),s.css({transform:"scale(1)",opacity:"1"})}),await x([])});e("#form-role").on("submit",async function(t){if(t.preventDefault(),!!e("#roleId").val())return;const l=k("roles.store"),o=new FormData(this),a=e(this).find('button[type="submit"]'),c=a.html();e("p[id^='error-']").text("");const n=o.get("name");if(!n||n.trim()===""){e("#error-name").html('<i class="mgc_info_line mr-1"></i>Nama role wajib diisi');return}if(o.getAll("permissions[]").length===0){e("#error-permissions").html('<i class="mgc_info_line mr-1"></i>Minimal 1 permission harus dipilih');return}a.prop("disabled",!0),a.html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');try{const i=await fetch(l,{method:"POST",headers:{"X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').getAttribute("content"),"X-Requested-With":"XMLHttpRequest",Accept:"application/json"},body:o}),p=await i.text();let u={};try{u=p?JSON.parse(p):{}}catch(m){console.error("Failed to parse JSON response",m,p),b("Respon server tidak valid. Silakan coba lagi.");return}if(!i.ok){u.errors?Object.keys(u.errors).forEach(m=>{const g=e(`#error-${m}`);g.length&&g.html(`<i class="mgc_alert_circle_line mr-1"></i>${u.errors[m][0]}`)}):b(u.message||"Gagal menyimpan role");return}v(u.message||"Role berhasil ditambahkan","Berhasil!").then(()=>{y(),location.reload()})}catch(i){console.error("Error:",i),b("Terjadi kesalahan saat menyimpan role")}finally{a.prop("disabled",!1),a.html(c)}});e("#roleModalClose, #roleModalCancel").on("click",function(){y()});
