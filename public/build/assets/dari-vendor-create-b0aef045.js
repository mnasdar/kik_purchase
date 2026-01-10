import{$ as n}from"./jquery-2823516c.js";import{f as S}from"./index-a4e39586.js";import{I}from"./id-ec13cc1f.js";import{s as k}from"./index-88056f3d.js";import{b as y,a as D}from"./gridjs.module-3ea5c5ab.js";import{d as C,s as v}from"./notification-0e55581f.js";import"./_commonjsHelpers-725317a4.js";import"./parse-c3570fb2.js";import"./pembayaran-edit-5f085df9.js";S.localize(I);const u=new Set,h=new Map;n(document).ready(function(){T()});function T(){F(),O()}function F(){n.ajax({url:k("dari-vendor.get-onsites"),method:"GET",success:function(e){const a=[{id:"checkbox",name:y("div",{innerHTML:'<input type="checkbox" id="select-all-checkbox" class="form-checkbox rounded text-primary">'}),width:"60px",sort:!1,formatter:t=>y("div",{innerHTML:t})},{id:"po_number",name:"PO Number",width:"120px"},{id:"pr_number",name:"PR Number",width:"120px"},{id:"supplier",name:"Supplier",width:"150px"},{id:"item_desc",name:"Item Description",width:"200px"},{id:"unit_price",name:"Unit Price",width:"120px",sort:!1},{id:"quantity",name:"Qty",width:"100px",sort:!1},{id:"amount",name:"Amount",width:"120px",sort:!1},{id:"onsite_date",name:"Onsite Date",width:"120px"}],i=e.map(t=>[t.checkbox,t.po_number,t.pr_number,t.supplier,t.item_desc,t.unit_price,t.quantity,t.amount,t.onsite_date]);new D({columns:a,data:i,pagination:{limit:10},search:{enabled:!0,ignoreHiddenColumns:!1},sort:!0}).render(document.querySelector("#table-onsites")),setTimeout(()=>{N(),_()},300);const d=document.querySelector("#table-onsites");d&&new MutationObserver(()=>{_(),g()}).observe(d,{childList:!0,subtree:!0})},error:function(e){console.error("Error loading onsites:",e),C("Gagal memuat data PO Onsite","Error!")}})}function O(){const e=n("#toggle-table"),a=n("#selection-card-body");if(!e.length||!a.length)return;const i='<span class="flex items-center gap-2"><i class="mgc_minimize_line text-lg"></i><span>Sembunyikan tabel</span></span>',r='<span class="flex items-center gap-2"><i class="mgc_arrow_down_line text-lg"></i><span>Tampilkan tabel</span></span>';e.on("click",function(){const d=a.hasClass("hidden");a.toggleClass("hidden",!d),n(this).html(d?i:r)})}function N(){const e=n("#invoice-form-container"),a=n("#invoice-form"),i=n("#btn-cancel");n(document).on("change","#select-all-checkbox",function(){const t=n(this).is(":checked");n("input.row-checkbox").each(function(){const s=n(this);s.prop("checked",t),w(s,t)}),r(),g()}),n(document).on("change","input.row-checkbox",function(){const t=n(this),c=t.is(":checked");w(t,c),r(),g()});function r(){const t=n("input.row-checkbox"),c=t.length,s=t.filter(":checked").length,l=n("#select-all-checkbox");s===0?l.prop("checked",!1).prop("indeterminate",!1):s===c?l.prop("checked",!0).prop("indeterminate",!1):l.prop("checked",!1).prop("indeterminate",!0)}i.on("click",function(){u.clear(),h.clear(),n("input.row-checkbox").prop("checked",!1),r(),g()}),a.on("submit",function(t){t.preventDefault();const c=n(this),s=Array.from(u),l=c.find("input[name='invoice_number']").val(),o=c.find("input[name='received_date']").val(),p=c.find("input[name='sla_target']").val();if(!o||!o.trim()){v("Tanggal diterima tidak boleh kosong","warning",2e3);return}if(!p||parseInt(p)<1){v("SLA Target harus minimal 1 hari","warning",2e3);return}let b=o;if(o.includes("-")){const m=o.split("-");m.length===3&&m[0].length<=2&&(b=`${m[2]}-${m[1].padStart(2,"0")}-${m[0].padStart(2,"0")}`)}const f={invoices:s.map(m=>({onsite_id:m,invoice_number:l&&l.trim()?l.trim():null,received_date:b,sla_target:parseInt(p)}))};console.log("Sending invoice data:",f),d(f,c)});function d(t,c){const s=a.find('button[type="submit"]'),l=s.html();s.prop("disabled",!0).html('<i class="mgc_loader_2_line animate-spin"></i> Menyimpan...'),n.ajax({url:k("dari-vendor.store-multiple"),method:"POST",contentType:"application/json",data:JSON.stringify(t),headers:{"X-CSRF-TOKEN":n('meta[name="csrf-token"]').attr("content")},success:function(o){console.log("Success response:",o),v(o.message||"Invoice berhasil disimpan!","success",2e3),c.trigger("reset"),n("input.row-checkbox").prop("checked",!1),r(),e.addClass("hidden"),setTimeout(()=>{window.location.href=k("dari-vendor.index")},1500)},error:function(o){console.error("Error response:",o);let p="Gagal menyimpan invoice";o.responseJSON&&(o.responseJSON.message?p=o.responseJSON.message:o.responseJSON.errors&&(p=Object.values(o.responseJSON.errors).flat().join(", "))),C(p,"Error!")},complete:function(){s.prop("disabled",!1).html(l)}})}}function g(){const e=n("#invoice-form-container");if(u.size===0){e.addClass("hidden");return}e.removeClass("hidden"),A()}function A(){const e=n("#form-items-container"),a=n("#selected-items-summary");e.empty(),a.empty();let i=0;Array.from(h.values()).forEach(s=>{const l=s.po_number;s.pr_number;const o=s.supplier,p=s.item_desc,b=s.onsite_date||"-",f=parseFloat(s.unit_price)||0,m=parseFloat(s.quantity)||0,x=parseFloat(s.amount)||0;i+=x;const $=`
            <div class="p-3 bg-white dark:bg-slate-800 rounded border border-blue-100 dark:border-blue-800">
                <div class="text-sm space-y-1">
                    <div>
                        <strong class="text-primary">${l}</strong> - ${o}
                        <br>
                        <span class="text-slate-600 dark:text-slate-400">${p}</span>
                    </div>
                    <div class="flex justify-between gap-4 pt-2 border-t border-blue-100 dark:border-blue-700">
                        <span class="text-slate-600 dark:text-slate-400">Onsite: <strong>${b}</strong></span>
                        <span class="text-slate-600 dark:text-slate-400">Unit Price: <strong>Rp ${f.toLocaleString("id-ID",{maximumFractionDigits:0})}</strong></span>
                        <span class="text-slate-600 dark:text-slate-400">Qty: <strong>${m.toLocaleString("id-ID",{maximumFractionDigits:0})}</strong></span>
                        <span class="text-primary font-semibold">Amount: <strong>Rp ${x.toLocaleString("id-ID",{maximumFractionDigits:0})}</strong></span>
                    </div>
                </div>
            </div>
        `;a.append($)});const r=`
        <div class="p-4 bg-success/10 dark:bg-success/20 rounded border border-success/30 dark:border-success/40">
            <div class="flex justify-between items-center">
                <span class="font-semibold text-gray-800 dark:text-white">Total Amount:</span>
                <span class="text-lg font-bold text-success">Rp ${i.toLocaleString("id-ID",{maximumFractionDigits:0})}</span>
            </div>
        </div>
    `;a.append(r);let d="";u.forEach(s=>{d+=`<input type="hidden" name="onsite_ids[]" value="${s}">`});const t=`
        <div class="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-slate-800">
            <div class="mb-6">
                <h5 class="font-semibold text-gray-800 dark:text-white mb-2">Data Invoice</h5>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                    Inputan di bawah ini akan berlaku untuk semua ${u.size} data yang dipilih
                </p>
            </div>

            ${d}

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
    `;e.append(t);const c=e.find(".date-picker-field");S(c[0],{dateFormat:"Y-m-d",locale:"id",altInput:!0,altFormat:"d-M-Y",allowInput:!0})}function _(){const e=n("input.row-checkbox");e.each(function(){const i=n(this),r=i.data("onsite-id");u.has(r)&&i.prop("checked",!0)});const a=n("#select-all-checkbox");if(a.length){const i=e.length,r=e.filter(":checked").length;r===0?a.prop("checked",!1).prop("indeterminate",!1):r===i?a.prop("checked",!0).prop("indeterminate",!1):a.prop("checked",!1).prop("indeterminate",!0)}}function w(e,a){const i=e.data("onsite-id");a?(u.add(i),h.set(i,{po_number:e.data("po-number"),pr_number:e.data("pr-number"),supplier:e.data("supplier"),item_desc:e.data("item-desc"),unit_price:e.data("unit-price"),quantity:e.data("quantity"),amount:e.data("amount"),onsite_date:e.data("onsite-date")})):(u.delete(i),h.delete(i))}
