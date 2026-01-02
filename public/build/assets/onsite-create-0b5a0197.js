import{$ as s}from"./jquery-2823516c.js";import{f as k}from"./index-a4e39586.js";import{s as m}from"./index-88056f3d.js";import{s as l,d as x,c as $}from"./notification-0e55581f.js";import"./_commonjsHelpers-725317a4.js";import"./parse-c3570fb2.js";import"./pembayaran-edit-5f085df9.js";let c=[];function v(e,t){const a=new Date(e),i=new Date(t);let n=0,o=new Date(a);for(;o<=i;){const d=o.getDay();d!==0&&d!==6&&n++,o.setDate(o.getDate()+1)}return n}s(document).ready(function(){s("#form-create-onsite").length&&w()});function w(){C(),D(),F(),z(),T()}function C(){k("#onsite_date",{dateFormat:"Y-m-d",altInput:!0,altFormat:"d-M-y",allowInput:!0,onChange:function(e,t,a){g()}})}function D(){s("#btn-search-po").on("click",function(){const e=s("#search-po").val().trim();if(!e){l("Masukkan nomor PO untuk mencari","warning",2e3);return}S(e)}),s("#search-po").on("keypress",function(e){e.which===13&&(e.preventDefault(),s("#btn-search-po").click())})}async function S(e){var t;try{l("Mencari PO...","info",1e3);const a=await s.ajax({url:m("po-onsite.search",{keyword:e}),method:"GET"});if(a.length===0){l("PO tidak ditemukan","warning",2e3),s("#search-results").addClass("hidden");return}O(a),l("PO ditemukan!","success",1500)}catch(a){x(((t=a==null?void 0:a.responseJSON)==null?void 0:t.message)||"Gagal mencari PO","Error!")}}function O(e){const t=s("#search-results-body");t.empty();const a=c.map(n=>n.id),i=e.filter(n=>!a.includes(n.id));if(i.length===0){const n=c.length>0?"Semua item dari PO ini sudah dipilih":"Tidak ada data ditemukan";t.html(`
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <i class="mgc_information_line text-3xl mb-2"></i>
                    <p>${n}</p>
                </td>
            </tr>
        `),s("#search-results").removeClass("hidden");return}i.forEach(n=>{const o=n.has_onsite?`<span class="badge bg-success text-white text-xs">Ada (${n.onsites_count})</span>`:'<span class="badge bg-slate-400 text-white text-xs">Belum</span>',d=`
            <tr>
                <td class="px-4 py-3 text-center">
                    <input type="checkbox" class="item-checkbox form-checkbox rounded text-primary" 
                        value="${n.id}" data-item='${JSON.stringify(n)}'>
                </td>
                <td class="px-4 py-3 text-sm">${n.po_number}</td>
                <td class="px-4 py-3 text-sm">${n.pr_number}</td>
                <td class="px-4 py-3 text-sm">${n.item_desc}</td>
                <td class="px-4 py-3 text-sm text-center">${n.uom}</td>
                <td class="px-4 py-3 text-sm text-right">${n.quantity}</td>
                <td class="px-4 py-3 text-sm">${o}</td>
            </tr>
        `;t.append(d)}),s("#search-results").removeClass("hidden"),P()}function g(){const e=s("#onsite_date").val();!e||c.length===0||(c.forEach(t=>{if(t.approved_date){const a=y(t.approved_date);if(!a){t.sla_realization=0;return}const i=v(a,e);t.sla_realization=i}else t.sla_realization=0}),h())}function F(){s("#form-create-onsite").on("submit",async function(e){var d,u;if(e.preventDefault(),c.length===0){l("Pilih minimal 1 item PO terlebih dahulu","warning",2e3);return}const t=s("#onsite_date").val();if(!t){l("Pilih tanggal onsite terlebih dahulu","warning",2e3);return}const a=y(t),i=c.map(r=>{const p=r.sla_realization||0;return{purchase_order_items_id:r.id,onsite_date:a,sla_po_to_onsite_realization:p}}),n=s("#btn-submit"),o=n.html();n.prop("disabled",!0).html('<i class="mgc_loading_line animate-spin"></i> Menyimpan...'),N();try{let r=0,p=0;for(const b of i)try{await s.ajax({url:m("po-onsite.store"),method:"POST",data:b,headers:{"X-CSRF-TOKEN":s('meta[name="csrf-token"]').attr("content")}}),r++}catch(_){p++,console.error("Error saving item:",_)}if(r>0)l(`${r} data onsite berhasil disimpan!`,"success",2e3),setTimeout(()=>{window.location.href=m("po-onsite.index")},500);else throw new Error("Gagal menyimpan semua data")}catch(r){r.status===422&&((d=r.responseJSON)!=null&&d.errors)&&I(r.responseJSON.errors),x((r==null?void 0:r.message)||((u=r==null?void 0:r.responseJSON)==null?void 0:u.message)||"Gagal menyimpan data onsite","Gagal!"),n.prop("disabled",!1).html(o)}})}function y(e){if(!e)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;if(e.includes("T")||e.includes("Z"))try{const a=new Date(e);if(!isNaN(a.getTime())){const i=a.getFullYear(),n=String(a.getMonth()+1).padStart(2,"0"),o=String(a.getDate()).padStart(2,"0");return`${i}-${n}-${o}`}}catch(a){console.error("Error parsing ISO date:",e,a)}const t=e.split("-");if(t.length===3){const a={Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};if(a[t[1]]){const i=t[0].padStart(2,"0"),n=a[t[1]];return`${t[2].length===2?"20"+t[2]:t[2]}-${n}-${i}`}}return console.error("Unable to convert date format:",e),null}function E(e){if(!e)return"-";try{const t=new Date(e);if(isNaN(t.getTime()))return e;const a=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],i=String(t.getDate()).padStart(2,"0"),n=a[t.getMonth()],o=String(t.getFullYear()).slice(-2);return`${i}-${n}-${o}`}catch{return e}}function I(e){const t={sla_po_to_onsite_realization:"sla_realization"};Object.keys(e).forEach(a=>{const i=t[a]||a,n=s(`#error-${i}`);n.length&&(n.text(e[a][0]).removeClass("hidden"),s(`#${i}`).addClass("border-danger"))})}function N(){s("[id^='error-']").addClass("hidden").text(""),s(".form-input, .form-select").removeClass("border-danger")}function P(){s("#select-all-items").off("change").on("change",function(){const e=s(this).is(":checked");s(".item-checkbox").prop("checked",e),f()}),s(".item-checkbox").off("change").on("change",function(){const e=s(".item-checkbox").length===s(".item-checkbox:checked").length;s("#select-all-items").prop("checked",e),f()})}function f(){const e=s(".item-checkbox:checked").length,t=s("#btn-select-multiple");e>0?(t.removeClass("hidden"),s("#selected-count").text(e)):t.addClass("hidden")}function z(){s("#btn-select-multiple").on("click",function(){const e=s(".item-checkbox:checked");if(e.length===0){l("Pilih minimal 1 item","warning",2e3);return}let t=0,a=0;e.each(function(){const i=JSON.parse(s(this).attr("data-item"));c.some(o=>o.id===i.id)?a++:(c.push(i),t++)}),h(),s("#search-results").addClass("hidden"),s("#selected-item-info").removeClass("hidden"),s("#onsite-form").removeClass("hidden"),s("#onsite_date").val()&&g(),a>0?l(`${t} item ditambahkan, ${a} item sudah ada`,"info",2e3):l(`${t} item berhasil ditambahkan!`,"success",1500)})}function h(){const e=s("#selected-items-body");e.empty(),c.forEach((t,a)=>{const i=t.approved_date?E(t.approved_date):"-",n=t.sla_po_to_onsite_target?`${t.sla_po_to_onsite_target} hari`:"-",o=t.sla_realization!==void 0&&t.sla_realization!==null?t.sla_realization:"-",d=o!=="-"?`${o} hari`:"-",u=p=>p.toString().replace(/\B(?=(\d{3})+(?!\d))/g,"."),r=`
            <tr>
            <td class="px-3 py-2 text-sm">${a+1}</td>
            <td class="px-3 py-2 text-sm font-semibold text-primary">${t.po_number}</td>
            <td class="px-3 py-2 text-sm">${t.pr_number}</td>
            <td class="px-3 py-2 text-sm">${t.supplier_name}</td>
            <td class="px-3 py-2 text-sm">${t.item_desc}</td>
            <td class="px-3 py-2 text-sm text-center">${t.uom}</td>
            <td class="px-3 py-2 text-sm text-right">${t.quantity}</td>
            <td class="px-3 py-2 text-sm text-right">${u(t.amount)}</td>
            <td class="px-3 py-2 text-sm text-center text-slate-600 dark:text-slate-400">${i}</td>
            <td class="px-3 py-2 text-sm text-center">
                <span class="font-semibold text-slate-700 dark:text-slate-300" data-id="${t.id}">
                    ${n}
                </span>
            </td>
            <td class="px-3 py-2 text-sm text-center">
                <span class="sla-display font-semibold text-primary" data-id="${t.id}">
                    ${d}
                </span>
            </td>
            <td class="px-3 py-2 text-center">
            <button type="button" class="btn-remove-item btn btn-xs bg-danger text-white hover:bg-danger-600" 
            data-index="${a}">
            <i class="mgc_delete_2_line"></i>
            </button>
            </td>
            </tr>
        `;e.append(r)}),s("#selected-items-count").text(c.length),s(".btn-remove-item").on("click",function(){const t=s(this).data("index");J(t)})}function J(e){c.splice(e,1),c.length===0?(s("#selected-item-info").addClass("hidden"),s("#onsite-form").addClass("hidden"),l("Semua item telah dihapus","info",1500)):(h(),l("Item berhasil dihapus","success",1500))}function T(){s("#btn-clear-selection").on("click",async function(){if(c.length===0)return;await $(`Anda akan menghapus semua ${c.length} item yang sudah dipilih. Tindakan ini tidak dapat dibatalkan.`,"Hapus Semua Item?")&&(c=[],s("#selected-item-info").addClass("hidden"),s("#onsite-form").addClass("hidden"),l("Semua item telah dihapus","info",1500))})}
