import{$ as e}from"./jquery-2823516c.js";import{f as I}from"./index-a4e39586.js";import{I as _}from"./id-ec13cc1f.js";import{s as w}from"./index-88056f3d.js";import{s as y,d as N}from"./notification-0e55581f.js";import"./_commonjsHelpers-725317a4.js";import"./parse-c3570fb2.js";import"./pembayaran-edit-5f085df9.js";I.localize(_);e(document).ready(function(){L()});function L(){O(),A()}function O(){const o=e("#select-all-checkbox"),s=e(".row-checkbox"),d=e("#invoice-form-container"),p=e("#invoice-form"),u=e("#btn-cancel");o.on("change",function(){s.prop("checked",this.checked),b()}),s.on("change",function(){f(),b()});function f(){const a=s.length,n=s.filter(":checked").length;n===0?o.prop("checked",!1).prop("indeterminate",!1):n===a?o.prop("checked",!0).prop("indeterminate",!1):o.prop("checked",!1).prop("indeterminate",!0)}function b(){const a=s.filter(":checked");if(a.length===0){d.addClass("hidden");return}d.removeClass("hidden"),h(a)}function h(a){const n=e("#form-items-container"),r=e("#selected-items-summary");n.empty(),r.empty();let l=0;a.each(function(c){const m=e(this),x=m.data("po-number"),S=m.data("supplier"),C=m.data("item-desc"),D=parseFloat(m.data("unit-price"))||0,T=parseFloat(m.data("quantity"))||0,$=parseFloat(m.data("amount"))||0;l+=$;const F=`
                <div class="p-3 bg-white dark:bg-slate-800 rounded border border-blue-100 dark:border-blue-800">
                    <div class="text-sm space-y-1">
                        <div>
                            <strong class="text-primary">${x}</strong> - ${S}
                            <br>
                            <span class="text-slate-600 dark:text-slate-400">${C}</span>
                        </div>
                        <div class="flex justify-between gap-4 pt-2 border-t border-blue-100 dark:border-blue-700">
                            <span class="text-slate-600 dark:text-slate-400">Unit Price: <strong>Rp ${D.toLocaleString("id-ID",{maximumFractionDigits:0})}</strong></span>
                            <span class="text-slate-600 dark:text-slate-400">Qty: <strong>${T.toLocaleString("id-ID",{maximumFractionDigits:0})}</strong></span>
                            <span class="text-primary font-semibold">Amount: <strong>Rp ${$.toLocaleString("id-ID",{maximumFractionDigits:0})}</strong></span>
                        </div>
                    </div>
                </div>
            `;r.append(F)});const t=`
            <div class="p-4 bg-success/10 dark:bg-success/20 rounded border border-success/30 dark:border-success/40">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-800 dark:text-white">Total Amount:</span>
                    <span class="text-lg font-bold text-success">Rp ${l.toLocaleString("id-ID",{maximumFractionDigits:0})}</span>
                </div>
            </div>
        `;r.append(t);let i="";a.each(function(c){const x=e(this).data("onsite-id");i+=`<input type="hidden" name="onsite_ids[]" value="${x}">`});const g=`
            <div class="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-slate-800">
                <div class="mb-6">
                    <h5 class="font-semibold text-gray-800 dark:text-white mb-2">Data Invoice</h5>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        Inputan di bawah ini akan berlaku untuk semua ${a.length} data yang dipilih
                    </p>
                </div>

                ${i}

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Invoice Number -->
                    <div>
                        <label class="form-label">Nomor Invoice</label>
                        <input type="text" 
                            name="invoice_number" 
                            class="form-input invoice-number-input" 
                            placeholder="Masukkan nomor invoice">
                    </div>

                    <!-- Tanggal Diterima -->
                    <div>
                        <label class="form-label">Tanggal Diterima <span class="text-red-500">*</span></label>
                        <input type="text" 
                            name="received_date" 
                            class="form-input date-picker-field" 
                            placeholder="Pilih tanggal"
                            required>
                    </div>

                    <!-- SLA Target -->
                    <div>
                        <label class="form-label">Target SLA (Hari) <span class="text-red-500">*</span></label>
                        <input type="number" 
                            name="sla_target" 
                            class="form-input sla-target-input" 
                            value=""
                            min="1"
                            max="365"
                            placeholder="Jumlah hari"
                            required>
                    </div>
                </div>
            </div>
        `;n.append(g);const v=n.find(".date-picker-field");I(v[0],{dateFormat:"Y-m-d",locale:"id",altInput:!0,altFormat:"d-M-Y",allowInput:!0})}u.on("click",function(){s.prop("checked",!1),f(),d.addClass("hidden")}),p.on("submit",function(a){a.preventDefault();const n=e(this),r=n.find("input[name='onsite_ids[]']").map(function(){return e(this).val()}).get(),l=n.find("input[name='invoice_number']").val(),t=n.find("input[name='received_date']").val(),i=n.find("input[name='sla_target']").val();if(!t||!t.trim()){y("Tanggal diterima tidak boleh kosong","warning",2e3);return}if(!i||parseInt(i)<1){y("SLA Target harus minimal 1 hari","warning",2e3);return}let g=t;if(t.includes("-")){const c=t.split("-");c.length===3&&c[0].length<=2&&(g=`${c[2]}-${c[1].padStart(2,"0")}-${c[0].padStart(2,"0")}`)}const v={invoices:r.map(c=>({onsite_id:c,invoice_number:l&&l.trim()?l.trim():null,received_date:g,sla_target:parseInt(i)}))};console.log("Sending invoice data:",v),k(v,n)});function k(a,n){const r=p.find('button[type="submit"]'),l=r.html();r.prop("disabled",!0).html('<i class="mgc_loader_2_line animate-spin"></i> Menyimpan...'),e.ajax({url:w("dari-vendor.store-multiple"),method:"POST",contentType:"application/json",data:JSON.stringify(a),headers:{"X-CSRF-TOKEN":e('meta[name="csrf-token"]').attr("content")},success:function(t){console.log("Success response:",t),y(t.message||"Invoice berhasil disimpan!","success",2e3),n.trigger("reset"),s.prop("checked",!1),f(),d.addClass("hidden"),setTimeout(()=>{window.location.href=w("dari-vendor.index")},1500)},error:function(t){console.error("Error response:",t);let i="Gagal menyimpan invoice";t.responseJSON&&(t.responseJSON.message?i=t.responseJSON.message:t.responseJSON.errors&&(i=Object.values(t.responseJSON.errors).flat().join(", "))),N(i,"Error!")},complete:function(){r.prop("disabled",!1).html(l)}})}}function A(){const o=e("#search-po-table"),s=e("table tbody"),d=s.find("tr[data-onsite-id]"),p=s.find("tr:not([data-onsite-id])");o.on("keyup",function(){const u=e(this).val().toLowerCase().trim();if(u===""){d.show(),p.hide();return}let f=0;d.each(function(){const b=e(this),h=b.find(".row-checkbox"),k=(h.data("po-number")||"").toString().toLowerCase(),a=(h.data("pr-number")||"").toString().toLowerCase();`${k} ${a}`.includes(u)?(b.show(),f++):b.hide()}),f===0?p.show():p.hide()}),o.on("keydown",function(u){u.key==="Escape"&&(o.val("").trigger("keyup"),o.blur())})}
