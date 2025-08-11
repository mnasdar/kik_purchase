import{a as $,b as m}from"./gridjs.module-3ea5c5ab.js";import{$ as e}from"./jquery-2823516c.js";import{S as x}from"./sweetalert2.all-5f085df9.js";import{s as T}from"./index-88056f3d.js";import"./_commonjsHelpers-725317a4.js";import"./parse-c3570fb2.js";function _({modalId:t,formId:c,tableId:a,routeName:r,mapGridData:i,gridColumns:s,pageLimit:y=5,prefix:b}){const f=e(t),p=e(c),o=e(a),n=p.find("input[name='search']");function l(){f.removeClass("hidden").addClass("flex")}function h(){f.addClass("hidden").removeClass("flex"),o.empty(),n.focus()}f.find("[data-fc-dismiss]").on("click",h);function C({gridData:k}){const d=document.querySelector(a);if(!d)return;for(;d.firstChild;)d.removeChild(d.firstChild);const u=document.createElement("div");d.appendChild(u),new $({columns:s,data:k,pagination:{limit:y},search:!0,sort:!0}).render(u)}return p.on("submit",function(k){k.preventDefault();const d=n.val();let u="";b?u=T(r,[b,d]):u=T(r,d);const w={};if(p.find("[name]").each(function(){const g=e(this).attr("name");w[g]=e(this).val()}),!w.search||w.search.trim()===""){x.fire({icon:"warning",title:"Input kosong",text:"Silakan isi keyword pencarian terlebih dahulu."});return}e.ajax({url:u,method:"GET",data:w,beforeSend:function(){o.empty().append('<p class="text-center py-4 text-gray-500">Memuat data...</p>')},success:function(g){if(!g.length){o.html('<p class="text-center py-4 text-gray-400">Data tidak ditemukan.</p>'),l();return}const S=g.map(i);C({gridData:S}),l(),n.val("")},error:function(){o.html('<p class="text-center text-red-500">Gagal memuat data.</p>')}})}),{closeModal:h,openModal:l}}function D({tableBodySelector:t,rowTemplate:c,onSelected:a=()=>{},closeModal:r}){let i=e(t+" tr").length;e(document).on("click",".btn-pilih",function(){const s=e(this).data("search");i++,e(t).append(c(s,i)),a(s,i),typeof r=="function"&&r()}),e(document).on("click",".btn-hapus",function(){e(this).closest("tr").remove()}),e(document).on("click",".btn-proses",function(){if(e("#poTableBody tr").length===0)return x.fire({icon:"warning",title:"Tidak ada produk",text:"Silakan tambahkan data terlebih dahulu."});e("#btnProses").trigger("click")})}function M({formId:t,data_id:c}){const a=e(t),r=a.find('button[type="submit"]'),i=r.find(".loader"),s=r.find("span:last");a.on("submit",function(y){y.preventDefault();const b=a.attr("action"),f=a.attr("method")||"POST",p=new FormData(this);e("#poTableBody tr").each(function(o){const n=e(this).data(c);n&&p.append(`items[${o}][po_number]`,n)}),x.fire({title:"Apakah Anda yakin?",text:"Data akan disimpan ke sistem.",icon:"warning",showCancelButton:!0,confirmButtonText:"Ya, simpan!",cancelButtonText:"Batal",customClass:{confirmButton:"btn bg-primary text-white w-xs me-2 mt-2",cancelButton:"btn bg-danger text-white w-xs mt-2"},buttonsStyling:!1}).then(function(o){o.isConfirmed&&(a.find('p[id^="error-"]').text(""),i.removeClass("hidden"),s.addClass("opacity-50"),e.ajax({url:b,method:f,data:p,contentType:!1,processData:!1,success:function(n){x.fire({title:"Sukses!",text:"Data berhasil disimpan.",icon:"success",customClass:{confirmButton:"btn bg-primary text-white w-xs mt-2"},buttonsStyling:!1}).then(()=>{window.location.href=n.redirect||"/index"})},error:function(n){if(n.status===422){const l=n.responseJSON.errors;Object.keys(l).forEach(h=>{e(`#error-${h}`).text(l[h][0])}),console.log(n.responseJSON)}else x.fire("Gagal","Terjadi kesalahan. Silakan coba lagi.","error")},complete:function(){i.addClass("hidden"),s.removeClass("opacity-50")}}))})})}function v(t){return new Intl.NumberFormat("id-ID").format(t)}const{closeModal:j}=_({modalId:"#hasilCariModal",formId:"#formCari",tableId:"#hasilCari-table",routeName:"dari-vendor.search",pageLimit:5,mapGridData:t=>[t.number,`<button class="btn-pilih bg-blue-500 text-white py-1 px-3 rounded text-sm" data-search='${JSON.stringify(t)}'>Pilih</button>`,t.status,t.po_number,t.approved_date,t.supplier_name,t.qty,t.unit_price,t.amount,t.sla],gridColumns:[{name:"#",width:"60px"},{name:"Aksi",width:"100px",formatter:t=>m("div",{innerHTML:t})},{name:"Status",width:"130px",formatter:t=>m("div",{innerHTML:t})},{name:"PO Number",width:"200px",formatter:t=>m("div",{innerHTML:t})},{name:"Date",width:"120px"},{name:"Supplier Name",width:"200px"},{name:"Qty",width:"90px",formatter:t=>m("div",{innerHTML:t})},{name:"Unit Price",width:"200px",formatter:t=>m("div",{innerHTML:t})},{name:"Amount",width:"200px",formatter:t=>m("div",{innerHTML:t})},{name:"SLA",width:"100px",formatter:t=>m("div",{innerHTML:t})}]});D({tableBodySelector:"#poTableBody",closeModal:j,rowTemplate:(t,c)=>{const a=v(t.total),r=v(t.harga),i=v(t.jumlah);return`
            <tr data-po_number="${t.nomor_po}">
            <td class="whitespace-nowrap py-4 ps-4 pe-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                <b>${c}.</b>
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${t.status}
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${t.po_number}
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${t.approved_date}
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${t.supplier_name}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 harga-produk">
                <div class="items-center py-1 px-3 rounded text-sm font-medium bg-blue-100 text-blue-800">
                    <div class="flex justify-between items-center">
                        <span>Rp. </span><span>${r}</span>
                    </div>
                </div>
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${i}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 harga-produk">
                <div class="items-center py-1 px-3 rounded text-sm font-medium bg-blue-100 text-blue-800">
                    <div class="flex justify-between items-center">
                        <span>Rp. </span><span>${a}</span>
                    </div>
                </div>
            </td>
            <td class="whitespace-nowrap py-4 px-3 text-center text-sm font-medium">
                <a href="javascript:void(0);" class="btn-hapus ms-0.5">
                    <i class="mgc_delete_line text-xl"></i>
                </a>
            </td>
        </tr>
        `}});M({formId:"#form-proses",data_id:"po_number"});
