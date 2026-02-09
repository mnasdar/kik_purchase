import{$ as e}from"./modal-handler-2823516c.js";import{s as f}from"./index-88056f3d.js";import{a as b,b as C}from"./notification-d92c8c7c.js";import"./_commonjsHelpers-725317a4.js";import"./parse-c3570fb2.js";import"./notification-5f085df9.js";async function x(r=[]){try{const l=(await(await fetch(f("roles.permissionsStructured"))).json()).structured||[];let o="";l.forEach(s=>{const p=(s.menu||"Other").toLowerCase().replace(/\s+/g,"-");o+=`
                <div class="space-y-3" data-menu="${p}">
                    <div class="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 sticky top-0 z-10">
                        <div class="flex items-center gap-3">
                            <i class="${s.icon} text-lg text-blue-600 dark:text-blue-400"></i>
                            <label class="font-semibold text-sm text-blue-900 dark:text-blue-100 flex-1 cursor-pointer">
                                <input type="checkbox" 
                                    class="menu-select-all w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer mr-2"
                                    data-menu="${p}">
                                <span>${s.menu}</span>
                            </label>
                        </div>
                    </div>
            `,s.submenus&&s.submenus.length>0?s.submenus.forEach(n=>{const m=(n.submenu||"Other").toLowerCase().replace(/\s+/g,"-");o+=`
                        <div class="ml-4 pl-3 border-l-2 border-blue-300 dark:border-blue-700 space-y-2" data-submenu="${m}">
                            <div class="px-3 py-2 rounded-lg bg-blue-50 dark:bg-slate-700/40">
                                <label class="font-medium text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-2 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100 transition-colors">
                                    <input type="checkbox" 
                                        class="submenu-select-all w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                        data-menu="${p}"
                                        data-submenu="${m}">
                                    <span class="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                                    ${n.submenu}
                                </label>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                    `,n.permissions&&n.permissions.length>0?n.permissions.forEach(c=>{const d=r.includes(c.id)?"checked":"";o+=`
                                <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                                    <input type="checkbox" name="permissions[]" 
                                        value="${c.id}" 
                                        class="permission-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                        data-menu="${p}"
                                        data-submenu="${m}"
                                        ${d}>
                                    <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        <strong>${_(c.name)}</strong>
                                    </span>
                                </label>
                            `}):o+=`
                            <p class="text-xs text-gray-500 dark:text-gray-400 py-2 px-2 col-span-2 italic">
                                Tidak ada permission
                            </p>
                        `,o+=`
                            </div>
                        </div>
                    `}):s.permissions&&s.permissions.length>0&&(o+=`
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                `,s.permissions.forEach(n=>{const m=r.includes(n.id)?"checked":"";o+=`
                        <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                            <input type="checkbox" name="permissions[]" 
                                value="${n.id}" 
                                class="permission-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                data-menu="${p}"
                                ${m}>
                            <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                <strong>${n.display_name||n.name}</strong>
                            </span>
                        </label>
                    `}),o+=`
                    </div>
                `),o+=`
                </div>
            `}),e("#permissionsContainer").html(o),$()}catch(t){console.error("Error loading permissions:",t),e("#permissionsContainer").html('<p class="text-red-500 text-sm">Gagal memuat permissions</p>')}}function _(r){const t={".view":"👁️ Lihat",".create":"➕ Buat",".edit":"✏️ Edit",".delete":"🗑️ Hapus",".approve":"✅ Approve",".export":"📤 Export"};for(const[a,l]of Object.entries(t))if(r.includes(a))return l;return"🔐 "+r}function $(){e(".menu-select-all").each(function(){g(e(this).data("menu"))}),e(".submenu-select-all").each(function(){v(e(this).data("menu"),e(this).data("submenu"))}),e(document).off("change",".menu-select-all").on("change",".menu-select-all",function(){const r=e(this).data("menu"),t=e(this).prop("checked");e(`.permission-checkbox[data-menu="${r}"]`).prop("checked",t),e(`.submenu-select-all[data-menu="${r}"]`).each(function(){e(this).prop("checked",t).prop("indeterminate",!1)}),g(r)}),e(document).off("change",".submenu-select-all").on("change",".submenu-select-all",function(){const r=e(this).data("menu"),t=e(this).data("submenu"),a=e(this).prop("checked");e(`.permission-checkbox[data-menu="${r}"][data-submenu="${t}"]`).prop("checked",a),g(r)}),e(document).off("change",".permission-checkbox").on("change",".permission-checkbox",function(){const r=e(this).data("menu"),t=e(this).data("submenu");t&&v(r,t),g(r)})}function g(r){const t=e(`.menu-select-all[data-menu="${r}"]`),a=e(`.permission-checkbox[data-menu="${r}"]`),l=a.length,o=a.filter(":checked").length;o===0?(t.prop("checked",!1),t.prop("indeterminate",!1)):o===l?(t.prop("checked",!0),t.prop("indeterminate",!1)):(t.prop("checked",!1),t.prop("indeterminate",!0))}function v(r,t){const a=e(`.submenu-select-all[data-menu="${r}"][data-submenu="${t}"]`),l=e(`.permission-checkbox[data-menu="${r}"][data-submenu="${t}"]`),o=l.length,s=l.filter(":checked").length;s===0?(a.prop("checked",!1),a.prop("indeterminate",!1)):s===o?(a.prop("checked",!0),a.prop("indeterminate",!1)):(a.prop("checked",!1),a.prop("indeterminate",!0))}function w(){e("#form-role")[0].reset(),e("#roleId").val(""),e("#roleMethod").val("POST"),x([]),e("p[id^='error-']").text("")}function k(){const r=e("#roleModal"),t=e("#roleModalBackdrop"),a=e("#roleModalContent");t.css("opacity","0"),a.css({transform:"scale(0.95)",opacity:"0"}),setTimeout(()=>{r.addClass("hidden").removeClass("flex").css("opacity","0")},300)}e("#btn-create-role").on("click",async function(){w(),e("#roleModalTitle").text("Tambah Role"),e("#roleModalIcon").removeClass("mgc_shield_edit_line").addClass("mgc_shield_add_line"),e("#roleMethod").val("POST");const r=e("#roleModal"),t=e("#roleModalBackdrop"),a=e("#roleModalContent");r.removeClass("hidden").addClass("flex").css("opacity","1"),requestAnimationFrame(()=>{t.css("opacity","1"),a.css({transform:"scale(1)",opacity:"1"})}),await x([])});e("#form-role").on("submit",async function(r){if(r.preventDefault(),!!e("#roleId").val())return;const l=f("roles.store"),o=new FormData(this),s=e(this).find('button[type="submit"]'),p=s.html();e("p[id^='error-']").text("");const n=o.get("name");if(!n||n.trim()===""){e("#error-name").html('<i class="mgc_info_line mr-1"></i>Nama role wajib diisi');return}if(o.getAll("permissions[]").length===0){e("#error-permissions").html('<i class="mgc_info_line mr-1"></i>Minimal 1 permission harus dipilih');return}s.prop("disabled",!0),s.html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');try{const c=await fetch(l,{method:"POST",headers:{"X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').getAttribute("content"),"X-Requested-With":"XMLHttpRequest",Accept:"application/json"},body:o}),d=await c.text();let i={};try{i=d?JSON.parse(d):{}}catch(u){console.error("Failed to parse JSON response",u,d),b("Respon server tidak valid. Silakan coba lagi.");return}if(!c.ok){i.errors?Object.keys(i.errors).forEach(u=>{const h=e(`#error-${u}`);h.length&&h.html(`<i class="mgc_alert_circle_line mr-1"></i>${i.errors[u][0]}`)}):b(i.message||"Gagal menyimpan role");return}C(i.message||"Role berhasil ditambahkan","Berhasil!").then(()=>{k(),location.reload()})}catch(c){console.error("Error:",c),b("Terjadi kesalahan saat menyimpan role")}finally{s.prop("disabled",!1),s.html(p)}});e("#roleModalClose, #roleModalCancel").on("click",function(){k()});e(document).on("click",".btn-edit-role",async function(){const r=e(this).data("role-id"),t=e(this),a=t.html();try{t.addClass("pointer-events-none opacity-60"),t.html('<i class="mgc_refresh_2_line animate-spin"></i>'),e("#form-role")[0].reset(),e("#roleMethod").val("PUT"),e("#roleModalTitle").text("Edit Role"),e("#roleModalIcon").removeClass("mgc_shield_add_line").addClass("mgc_shield_edit_line");const l=e("#roleModal"),o=e("#roleModalBackdrop"),s=e("#roleModalContent");l.removeClass("hidden").addClass("flex").css("opacity","1"),requestAnimationFrame(()=>{o.css("opacity","1"),s.css({transform:"scale(1)",opacity:"1"})});const p=await fetch(f("roles.permissions",{role:r}),{headers:{"X-Requested-With":"XMLHttpRequest",Accept:"application/json"}}),n=await p.text();let m={};try{m=n?JSON.parse(n):{}}catch(i){throw console.error("Failed to parse JSON response",i,n),new Error("Respon server tidak valid")}if(!p.ok)throw new Error(m.message||"Gagal mengambil data role");e("#roleId").val(m.role.id),e("#roleName").val(m.role.name);const d=(m.permissions||[]).map(i=>i.id);await x(d)}catch(l){console.error("Error loading role:",l),b("Gagal memuat data role"),k()}finally{t.removeClass("pointer-events-none opacity-60"),t.html(a)}});e("#form-role").on("submit",async function(r){r.preventDefault();const t=e("#roleId").val();if(!t)return;const l=f("roles.update",{role:t}),o=new FormData(this),s=e(this).find('button[type="submit"]'),p=s.html();e("p[id^='error-']").text("");const n=o.get("name");if(!n||n.trim()===""){e("#error-name").html('<i class="mgc_info_line mr-1"></i>Nama role wajib diisi');return}if(o.getAll("permissions[]").length===0){e("#error-permissions").html('<i class="mgc_info_line mr-1"></i>Minimal 1 permission harus dipilih');return}const c={};for(let[d,i]of o.entries())d==="permissions[]"?(c.permissions||(c.permissions=[]),c.permissions.push(i)):c[d]=i;s.prop("disabled",!0),s.html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');try{const d=await fetch(l,{method:"PUT",headers:{"X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').getAttribute("content"),"X-Requested-With":"XMLHttpRequest","Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(c)}),i=await d.text();let u={};try{u=i?JSON.parse(i):{}}catch(h){console.error("Failed to parse JSON response",h,i),b("Respon server tidak valid. Silakan coba lagi.");return}if(!d.ok){u.errors?Object.keys(u.errors).forEach(h=>{const y=e(`#error-${h}`);y.length&&y.html(`<i class="mgc_alert_circle_line mr-1"></i>${u.errors[h][0]}`)}):b(u.message||"Gagal mengupdate role");return}C(u.message||"Role berhasil diupdate","Berhasil!").then(()=>{k(),location.reload()})}catch(d){console.error("Error:",d),b("Terjadi kesalahan saat menyimpan role")}finally{s.prop("disabled",!1),s.html(p)}});
