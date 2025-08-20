(()=>{var e={};e.id=469,e.ids=[469],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},2615:e=>{"use strict";e.exports=require("http")},8791:e=>{"use strict";e.exports=require("https")},5315:e=>{"use strict";e.exports=require("path")},8621:e=>{"use strict";e.exports=require("punycode")},6162:e=>{"use strict";e.exports=require("stream")},7360:e=>{"use strict";e.exports=require("url")},1568:e=>{"use strict";e.exports=require("zlib")},9489:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>x,originalPathname:()=>m,pages:()=>c,routeModule:()=>p,tree:()=>d}),r(4539),r(1506),r(5866);var s=r(3191),a=r(8716),l=r(7922),n=r.n(l),i=r(5231),o={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>i[e]);r.d(t,o);let d=["",{children:["services",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,4539)),"/Users/joecheung/Documents/GitHub/mingcare-intranet/app/services/page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,4998))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,1506)),"/Users/joecheung/Documents/GitHub/mingcare-intranet/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,5866,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,4998))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["/Users/joecheung/Documents/GitHub/mingcare-intranet/app/services/page.tsx"],m="/services/page",x={require:r,loadChunk:()=>Promise.resolve()},p=new s.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/services/page",pathname:"/services",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},9777:(e,t,r)=>{Promise.resolve().then(r.bind(r,2730))},8505:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,2994,23)),Promise.resolve().then(r.t.bind(r,6114,23)),Promise.resolve().then(r.t.bind(r,9727,23)),Promise.resolve().then(r.t.bind(r,9671,23)),Promise.resolve().then(r.t.bind(r,1868,23)),Promise.resolve().then(r.t.bind(r,4759,23))},4555:()=>{},2730:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>y});var s=r(326),a=r(7577);r(962);var l=r(5047),n=r(5442);let i=[{value:"ES-護送服務(陪診)",label:"ES-護送服務(陪診)"},{value:"HC-家居服務",label:"HC-家居服務"},{value:"NC-護理服務(專業⼈員)",label:"NC-護理服務(專業⼈員)"},{value:"PC-到⼾看顧(輔助⼈員)",label:"PC-到⼾看顧(輔助⼈員)"},{value:"RA-復康運動(輔助⼈員)",label:"RA-復康運動(輔助⼈員)"},{value:"RT-復康運動(OTA輔助⼈員)",label:"RT-復康運動(OTA輔助⼈員)"},{value:"RT-復康運動(專業⼈員)",label:"RT-復康運動(專業⼈員)"},{value:"上門評估服務",label:"上門評估服務"},{value:"傷口護理",label:"傷口護理"},{value:"免費服務體驗",label:"免費服務體驗"}],o=[{value:"MC社區券(醫點）",label:"MC社區券(醫點）"},{value:"MC街客",label:"MC街客"},{value:"Steven140",label:"Steven140"},{value:"Steven200",label:"Steven200"},{value:"Steven醫點",label:"Steven醫點"}],d=[{value:"Candy Ho",label:"Candy Ho"},{value:"Joe Cheung",label:"Joe Cheung"},{value:"Kanas Leung",label:"Kanas Leung"}];async function c(e,t=1,r=50){try{let s=n.O.from("billing_salary_data").select("*",{count:"exact"});e.dateRange.start&&e.dateRange.end&&(s=s.gte("service_date",e.dateRange.start).lte("service_date",e.dateRange.end)),e.serviceType&&(s=s.eq("service_type",e.serviceType)),e.projectCategory&&(s=s.eq("project_category",e.projectCategory)),e.projectManager&&(s=s.eq("project_manager",e.projectManager)),e.careStaffName&&(s=s.ilike("care_staff_name",`%${e.careStaffName}%`)),e.selectedCustomerIds&&e.selectedCustomerIds.length>0?s=s.in("customer_id",e.selectedCustomerIds):e.searchTerm&&e.searchTerm.length>=2&&(s=s.or(`customer_name.ilike.%${e.searchTerm}%,phone.ilike.%${e.searchTerm}%,customer_id.ilike.%${e.searchTerm}%`));let a=(t-1)*r,{data:l,error:i,count:o}=await s.order("service_date",{ascending:!1}).order("start_time",{ascending:!0}).range(a,a+r-1);if(i)return console.error("Error fetching billing salary records:",i),{success:!1,error:i.message};let d=(l||[]).map(e=>({...e,profit:(e.service_fee||0)-(e.staff_salary||0)}));return{success:!0,data:{data:d,total:o||0,page:t,pageSize:r,totalPages:Math.ceil((o||0)/r)}}}catch(e){return console.error("Error in fetchBillingSalaryRecords:",e),{success:!1,error:e instanceof Error?e.message:"獲取記錄時發生錯誤"}}}async function m(e,t){try{let{data:r,error:s}=await n.O.from("billing_salary_data").update(t).eq("id",e).select().single();if(s)return console.error("Error updating billing salary record:",s),{success:!1,error:s.message};return{success:!0,data:r,message:"記錄更新成功"}}catch(e){return console.error("Error in updateBillingSalaryRecord:",e),{success:!1,error:e instanceof Error?e.message:"更新記錄時發生錯誤"}}}async function x(e){try{let{error:t}=await n.O.from("billing_salary_data").delete().eq("id",e);if(t)return console.error("Error deleting billing salary record:",t),{success:!1,error:t.message};return{success:!0,message:"記錄刪除成功"}}catch(e){return console.error("Error in deleteBillingSalaryRecord:",e),{success:!1,error:e instanceof Error?e.message:"刪除記錄時發生錯誤"}}}async function p(e){try{if(!e.trim()||e.length<1)return{success:!0,data:[]};let[t,r]=await Promise.all([n.O.from("billing_salary_data").select("customer_name, customer_id, phone, service_address").or(`customer_name.ilike.%${e}%,customer_id.ilike.%${e}%,phone.ilike.%${e}%`).not("customer_name","is",null).not("customer_id","is",null).limit(20),n.O.from("customer_personal_data").select("customer_name, customer_id, phone, service_address").or(`customer_name.ilike.%${e}%,customer_id.ilike.%${e}%,phone.ilike.%${e}%`).not("customer_name","is",null).not("customer_id","is",null).limit(20)]);t.error&&console.error("計費記錄搜尋錯誤:",t.error),r.error&&console.error("客戶資料搜尋錯誤:",r.error);let s=[...t.data||[],...r.data||[]],a=new Map;s.forEach(e=>{if(e.customer_name&&e.customer_id){let t=e.customer_id;if(a.has(t)){let r=a.get(t);!r.service_address&&e.service_address&&(r.service_address=e.service_address)}else a.set(t,{customer_name:e.customer_name,customer_id:e.customer_id,phone:e.phone||"",service_address:e.service_address||"",display_text:`${e.customer_name} (${e.customer_id})${e.phone?" - "+e.phone:""}`})}});let l=Array.from(a.values()).sort((e,t)=>e.customer_name.localeCompare(t.customer_name)).slice(0,8);return{success:!0,data:l}}catch(e){return console.error("客戶搜尋失敗:",e),{success:!1,error:e instanceof Error?e.message:"客戶搜尋失敗"}}}let u=e=>{let t=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${r}-${s}`};function h({filters:e,onEdit:t}){let[r,l]=(0,a.useState)({}),[n,i]=(0,a.useState)(!0),[o,d]=(0,a.useState)(new Date),c=e=>{let t=new Date(o);t.setMonth(o.getMonth()+("next"===e?1:-1)),d(t)},m=(()=>{let e=new Date(o.getFullYear(),o.getMonth(),1),t=new Date(e);t.setDate(t.getDate()-e.getDay());let r=[],s=new Date(t);for(let e=0;e<42;e++)r.push(new Date(s)),s.setDate(s.getDate()+1);return r})(),x=o.getMonth();return n?(0,s.jsxs)("div",{className:"flex items-center justify-center py-12",children:[s.jsx("div",{className:"inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"}),s.jsx("span",{className:"ml-3 text-text-secondary",children:"載入月曆數據中..."})]}):(0,s.jsxs)("div",{className:"space-y-6",children:[(0,s.jsxs)("div",{className:"flex justify-between items-center",children:[s.jsx("button",{onClick:()=>c("prev"),className:"p-2 rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200",children:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 19l-7-7 7-7"})})}),(0,s.jsxs)("h4",{className:"text-lg font-medium text-text-primary",children:[o.getFullYear(),"年 ",o.getMonth()+1,"月"]}),s.jsx("button",{onClick:()=>c("next"),className:"p-2 rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200",children:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 5l7 7-7 7"})})})]}),s.jsx("div",{className:"grid grid-cols-7 gap-1 mb-2",children:["日","一","二","三","四","五","六"].map(e=>s.jsx("div",{className:"p-2 text-center font-medium text-text-secondary bg-bg-secondary rounded",children:e},e))}),s.jsx("div",{className:"grid grid-cols-7 gap-1",children:m.map((e,a)=>{let l=u(e),n=e.getMonth()===x,i=l===u(new Date),o=0===e.getDay()||6===e.getDay(),d=r[l]||[],c=d.length>0?Math.max(120,120+(d.length-1)*80):120;return(0,s.jsxs)("div",{style:{minHeight:`${c}px`},className:`
                p-2 border rounded-lg
                ${n?o?"bg-blue-50 border-blue-200":"bg-bg-primary border-border-light":"bg-gray-50 text-gray-300 border-gray-200"}
                ${i?"ring-2 ring-mingcare-blue border-mingcare-blue":""}
              `,children:[s.jsx("div",{className:`
                text-sm font-bold mb-2
                ${i?"text-mingcare-blue":n?"text-text-primary":"text-gray-300"}
              `,children:e.getDate()}),n&&d.length>0&&(0,s.jsxs)("div",{className:"space-y-1",children:[d.slice(0,3).map((e,r)=>(0,s.jsxs)("div",{onClick:()=>t(e),className:"text-sm bg-white border border-gray-200 rounded p-2 shadow-sm cursor-pointer hover:shadow-md hover:border-mingcare-blue transition-all duration-200",children:[(0,s.jsxs)("div",{className:"font-medium text-gray-800 mb-1 leading-tight",children:[e.customer_name,"/",e.care_staff_name]}),s.jsx("div",{className:"text-blue-600 mb-1 leading-tight",children:e.service_type}),(0,s.jsxs)("div",{className:"text-gray-600 text-sm",children:[e.start_time,"-",e.end_time]})]},`${e.id}-${r}`)),d.length>3&&(0,s.jsxs)("div",{className:"text-sm text-text-secondary text-center py-1",children:["還有 ",d.length-3," 筆記錄..."]})]})]},a)})})]})}function g({filters:e}){let[t,r]=(0,a.useState)([]),[l,n]=(0,a.useState)([]),[i,o]=(0,a.useState)(!0),[d,p]=(0,a.useState)(null),[u,h]=(0,a.useState)({field:"service_date",direction:"desc"}),[g,b]=(0,a.useState)(1),[v,f]=(0,a.useState)(0),[y,_]=(0,a.useState)(null),[N,w]=(0,a.useState)(!1),k=async()=>{try{o(!0),p(null);let t=await c(e,1,1e4);if(t.success&&t.data){let e=t.data.data;f(t.data.total),n(e),$(e,u)}else p(t.error||"載入數據失敗")}catch(e){console.error("載入記錄失敗:",e),p("載入數據失敗，請重試")}finally{o(!1)}},$=(e,t)=>{r([...e].sort((e,r)=>{let s,a;switch(t.field){case"service_date":s=e.service_date,a=r.service_date;break;case"customer_name":s=e.customer_name,a=r.customer_name;break;case"customer_id":s=e.customer_id,a=r.customer_id;break;default:return 0}return s<a?"asc"===t.direction?-1:1:s>a?"asc"===t.direction?1:-1:0}))},S=e=>{let t=u.field===e&&"desc"===u.direction?"asc":"desc",r={field:e,direction:t};h(r),$(l,r)},C=e=>{_(e),w(!0)},D=async e=>{if(y)try{o(!0);let t=await m(y.id,e);t.success?(alert("記錄更新成功！"),await k(),w(!1),_(null)):(p(t.error||"更新記錄失敗"),alert("更新記錄失敗："+(t.error||"未知錯誤")))}catch(e){console.error("更新記錄失敗:",e),p("更新記錄失敗，請重試"),alert("更新記錄失敗，請重試")}finally{o(!1)}},M=async e=>{if(confirm("確定要刪除這筆記錄嗎？此操作無法撤銷。"))try{o(!0);let t=await x(e);t.success?await k():p(t.error||"刪除記錄失敗")}catch(e){console.error("刪除記錄失敗:",e),p("刪除記錄失敗，請重試")}finally{o(!1)}},F=(e,t=30)=>e.length>t?e.substring(0,t)+"...":e;return i?s.jsx("div",{className:"space-y-4",children:[1,2,3].map(e=>s.jsx("div",{className:"border border-border-light rounded-lg p-4 animate-pulse",children:(0,s.jsxs)("div",{className:"space-y-3",children:[(0,s.jsxs)("div",{className:"flex justify-between",children:[s.jsx("div",{className:"h-4 bg-gray-200 rounded w-1/4"}),s.jsx("div",{className:"h-4 bg-gray-200 rounded w-1/6"})]}),s.jsx("div",{className:"h-4 bg-gray-200 rounded w-3/4"}),s.jsx("div",{className:"h-4 bg-gray-200 rounded w-2/3"}),s.jsx("div",{className:"h-4 bg-gray-200 rounded w-1/2"})]})},e))}):d?(0,s.jsxs)("div",{className:"text-center py-12",children:[s.jsx("div",{className:"w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4",children:s.jsx("svg",{className:"w-8 h-8 text-red-500",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})}),s.jsx("p",{className:"text-red-600 font-medium mb-2",children:d}),s.jsx("button",{onClick:k,className:"px-4 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-colors",children:"重新載入"})]}):0===t.length?(0,s.jsxs)("div",{className:"text-center py-12",children:[s.jsx("div",{className:"w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4",children:s.jsx("svg",{className:"w-8 h-8 text-gray-400",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"})})}),s.jsx("p",{className:"text-text-primary font-medium mb-2",children:"沒有找到記錄"}),s.jsx("p",{className:"text-sm text-text-secondary",children:"請調整篩選條件或新增服務記錄"})]}):(0,s.jsxs)("div",{className:"space-y-4",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between border-b border-border-light pb-4",children:[(0,s.jsxs)("div",{className:"flex items-center space-x-2",children:[s.jsx("span",{className:"text-sm text-text-secondary font-medium",children:"排序："}),(0,s.jsxs)("button",{onClick:()=>S("service_date"),className:`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${"service_date"===u.field?"bg-mingcare-blue text-white":"bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"}`,children:[s.jsx("span",{children:"日期"}),"service_date"===u.field&&s.jsx("svg",{className:`w-4 h-4 transition-transform ${"desc"===u.direction?"rotate-180":""}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M5 15l7-7 7 7"})})]}),(0,s.jsxs)("button",{onClick:()=>S("customer_name"),className:`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${"customer_name"===u.field?"bg-mingcare-blue text-white":"bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"}`,children:[s.jsx("span",{children:"客戶名稱"}),"customer_name"===u.field&&s.jsx("svg",{className:`w-4 h-4 transition-transform ${"desc"===u.direction?"rotate-180":""}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M5 15l7-7 7 7"})})]}),(0,s.jsxs)("button",{onClick:()=>S("customer_id"),className:`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${"customer_id"===u.field?"bg-mingcare-blue text-white":"bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"}`,children:[s.jsx("span",{children:"客戶編號"}),"customer_id"===u.field&&s.jsx("svg",{className:`w-4 h-4 transition-transform ${"desc"===u.direction?"rotate-180":""}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M5 15l7-7 7 7"})})]})]}),(0,s.jsxs)("div",{className:"text-sm text-text-secondary",children:["共 ",t.length," 筆記錄"]})]}),s.jsx("div",{className:"space-y-3",children:t.map(e=>(0,s.jsxs)("div",{className:"border border-border-light rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[(0,s.jsxs)("div",{className:"flex items-center space-x-4",children:[s.jsx("span",{className:"font-medium text-text-primary",children:e.service_date}),s.jsx("span",{className:"text-sm text-text-secondary",children:e.project_category})]}),(0,s.jsxs)("div",{className:"flex items-center space-x-2",children:[s.jsx("button",{onClick:()=>C(e),className:"p-2 text-mingcare-blue hover:bg-blue-50 rounded-lg transition-colors",title:"編輯記錄",children:s.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"})})}),s.jsx("button",{onClick:()=>M(e.id),className:"p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors",title:"刪除記錄",children:s.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"})})})]})]}),(0,s.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[s.jsx("div",{className:"flex items-center space-x-2",children:(0,s.jsxs)("span",{className:"font-medium text-text-primary",children:[e.customer_name," (",e.customer_id,")"]})}),s.jsx("span",{className:"text-sm bg-mingcare-blue text-white px-3 py-1 rounded-full",children:e.service_type})]}),s.jsx("div",{className:"mb-2",children:s.jsx("span",{className:"text-sm text-text-secondary cursor-help block",title:e.service_address,children:F(e.service_address)})}),(0,s.jsxs)("div",{className:"flex items-center justify-between text-sm",children:[(0,s.jsxs)("div",{className:"flex items-center space-x-4",children:[(0,s.jsxs)("span",{className:"text-text-secondary",children:[e.start_time,"-",e.end_time]}),(0,s.jsxs)("span",{className:"font-medium text-text-primary",children:[e.service_hours,"小時"]})]}),s.jsx("span",{className:"font-medium text-text-primary",children:e.care_staff_name})]})]},e.id))}),(0,s.jsxs)("div",{className:"text-center text-sm text-text-secondary mt-6",children:["共 ",v," 筆記錄"]}),N&&y&&s.jsx(j,{isOpen:N,onClose:()=>{w(!1),_(null)},onSubmit:D,isMultiDay:!1,existingRecord:y})]})}function b({filters:e,setFilters:t,updateDateRange:r,kpiData:a,kpiLoading:l,categorySummary:n}){return(0,s.jsxs)("div",{className:"space-y-8",children:[s.jsx("div",{className:"card-apple border border-border-light fade-in-apple",children:(0,s.jsxs)("div",{className:"p-6",children:[s.jsx("h2",{className:"text-apple-heading text-text-primary mb-4",children:"選擇時段"}),(0,s.jsxs)("div",{className:"flex items-center gap-4 mb-4",children:[(0,s.jsxs)("div",{className:"flex gap-2",children:[s.jsx("button",{onClick:()=>r("thisMonth"),className:"px-4 py-2 text-sm rounded-lg border border-border-light bg-mingcare-blue text-white transition-all duration-200",children:"本月"}),s.jsx("button",{onClick:()=>r("lastMonth"),className:"px-4 py-2 text-sm rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200",children:"上月"})]}),(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx("select",{value:new Date(e.dateRange.start).getFullYear(),onChange:r=>{let s=parseInt(r.target.value),a=new Date(e.dateRange.start).getMonth(),l=new Date(s,a+1,0),n=s+"-"+String(a+1).padStart(2,"0")+"-01",i=l.getFullYear()+"-"+String(l.getMonth()+1).padStart(2,"0")+"-"+String(l.getDate()).padStart(2,"0");t(e=>({...e,dateRange:{start:n,end:i}}))},className:"px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent",children:Array.from({length:5},(e,t)=>{let r=new Date().getFullYear()-2+t;return(0,s.jsxs)("option",{value:r,children:[r,"年"]},r)})}),s.jsx("select",{value:new Date(e.dateRange.start).getMonth(),onChange:r=>{let s=new Date(e.dateRange.start).getFullYear(),a=parseInt(r.target.value),l=new Date(s,a+1,0),n=s+"-"+String(a+1).padStart(2,"0")+"-01",i=l.getFullYear()+"-"+String(l.getMonth()+1).padStart(2,"0")+"-"+String(l.getDate()).padStart(2,"0");t(e=>({...e,dateRange:{start:n,end:i}}))},className:"px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent",children:Array.from({length:12},(e,t)=>(0,s.jsxs)("option",{value:t,children:[t+1,"月"]},t))})]})]}),(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx("label",{className:"text-sm text-text-secondary",children:"時間段："}),s.jsx("input",{type:"date",value:e.dateRange.start,onChange:e=>t(t=>({...t,dateRange:{...t.dateRange,start:e.target.value}})),className:"px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"}),s.jsx("span",{className:"text-text-secondary",children:"至"}),s.jsx("input",{type:"date",value:e.dateRange.end,onChange:e=>t(t=>({...t,dateRange:{...t.dateRange,end:e.target.value}})),className:"px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent"})]}),(0,s.jsxs)("div",{className:"mt-4 text-sm text-text-secondary",children:["當前範圍：",e.dateRange.start," ~ ",e.dateRange.end]})]})}),s.jsx("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-6",children:l?(0,s.jsxs)("div",{className:"col-span-full text-center py-12",children:[s.jsx("div",{className:"inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"}),s.jsx("p",{className:"text-sm text-text-secondary mt-3",children:"計算中..."})]}):a?(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)("div",{className:"card-apple border border-border-light p-6 text-center",children:[(0,s.jsxs)("div",{className:"text-3xl font-bold text-text-primary mb-2",children:["$",a.totalRevenue.toLocaleString()]}),s.jsx("div",{className:"text-sm text-text-secondary",children:"總收入"}),0!==a.revenueGrowthRate&&(0,s.jsxs)("div",{className:`text-xs mt-2 ${a.revenueGrowthRate>=0?"text-green-600":"text-red-600"}`,children:[a.revenueGrowthRate>=0?"↗":"↘"," ",Math.abs(a.revenueGrowthRate).toFixed(1),"%"]})]}),(0,s.jsxs)("div",{className:"card-apple border border-border-light p-6 text-center",children:[(0,s.jsxs)("div",{className:"text-3xl font-bold text-text-primary mb-2",children:["$",a.totalProfit.toLocaleString()]}),s.jsx("div",{className:"text-sm text-text-secondary",children:"總利潤"}),(0,s.jsxs)("div",{className:"text-xs text-text-secondary mt-2",children:["利潤率: ",a.totalRevenue>0?(a.totalProfit/a.totalRevenue*100).toFixed(1):0,"%"]})]}),(0,s.jsxs)("div",{className:"card-apple border border-border-light p-6 text-center",children:[s.jsx("div",{className:"text-3xl font-bold text-text-primary mb-2",children:a.totalServiceHours.toFixed(1)}),s.jsx("div",{className:"text-sm text-text-secondary",children:"總服務時數"})]}),(0,s.jsxs)("div",{className:"card-apple border border-border-light p-6 text-center",children:[(0,s.jsxs)("div",{className:"text-3xl font-bold text-text-primary mb-2",children:["$",a.avgProfitPerHour.toFixed(2)]}),s.jsx("div",{className:"text-sm text-text-secondary",children:"每小時利潤"})]})]}):s.jsx("div",{className:"col-span-full text-center py-12",children:s.jsx("p",{className:"text-text-secondary",children:"選取的日期範圍內暫無數據"})})}),s.jsx("div",{className:"card-apple border border-border-light fade-in-apple",children:(0,s.jsxs)("div",{className:"p-6",children:[s.jsx("h3",{className:"text-apple-heading text-text-primary mb-6",children:"項目分類統計"}),n.length>0?(0,s.jsxs)("div",{className:"space-y-4",children:[n.slice(0,5).map((e,t)=>(0,s.jsxs)("div",{className:"flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-border-light",children:[(0,s.jsxs)("div",{className:"flex items-center",children:[s.jsx("div",{className:"w-3 h-3 bg-mingcare-blue rounded-full mr-3"}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-medium text-text-primary",children:e.category}),(0,s.jsxs)("p",{className:"text-sm text-text-secondary",children:[e.recordCount," 筆記錄 • ",e.uniqueCustomers," 位客戶"]})]})]}),(0,s.jsxs)("div",{className:"text-right",children:[(0,s.jsxs)("div",{className:"text-lg font-bold text-text-primary",children:["$",e.totalFee.toLocaleString()]}),(0,s.jsxs)("div",{className:"text-sm text-text-secondary",children:[e.totalHours.toFixed(1),"h • 利潤 $",e.totalProfit.toLocaleString()]})]})]},e.category)),n.length>5&&(0,s.jsxs)("div",{className:"text-center text-sm text-text-secondary",children:["還有 ",n.length-5," 個項目，請到詳細報表查看"]})]}):s.jsx("div",{className:"text-center py-12",children:s.jsx("p",{className:"text-text-secondary",children:"選取的日期範圍內暫無項目數據"})})]})})]})}function v({filters:e}){let[t,r]=(0,a.useState)(new Date),[l,n]=(0,a.useState)({}),[i,o]=(0,a.useState)(!1),[d,c]=(0,a.useState)(null),[m,x]=(0,a.useState)([]),[p,h]=(0,a.useState)(!1),[g,b]=(0,a.useState)(!1),[v,f]=(0,a.useState)({}),[y,N]=(0,a.useState)("all"),[w,k]=(0,a.useState)({isOpen:!1,schedule:null,dateStr:"",scheduleIndex:-1}),[$,S]=(0,a.useState)(null),C=()=>Object.values(v).reduce((e,t)=>e+t.length,0),D=()=>{let e=new Set;return Object.values(v).forEach(t=>{t.forEach(t=>{t.customer_name&&e.add(t.customer_name)})}),Array.from(e).sort()},M=()=>{if("all"===y)return v;let e={};return Object.entries(v).forEach(([t,r])=>{let s=r.filter(e=>e.customer_name===y);s.length>0&&(e[t]=s)}),e},F=async()=>{let e=M(),t=Object.values(e).reduce((e,t)=>e+t.length,0);if(0===t){"all"===y?alert("沒有待儲存的排程"):alert(`沒有 ${y} 的待儲存排程`);return}let r="all"===y?"全部":y;if(confirm(`確定要儲存 ${r} 的 ${t} 個排程到資料庫嗎？`))try{for(let[t,r]of(b(!0),Object.entries(e)))for(let e of r){let t={customer_id:e.customer_id,care_staff_name:e.care_staff_name,service_date:e.service_date,start_time:e.start_time,end_time:e.end_time,service_type:e.service_type,service_address:e.service_address,hourly_rate:e.hourly_rate,service_fee:e.service_fee,staff_salary:e.staff_salary,phone:e.phone,customer_name:e.customer_name,service_hours:e.service_hours,hourly_salary:e.hourly_salary,project_category:e.project_category,project_manager:e.project_manager},r=await fetch("/api/billing-salary-management",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!r.ok)throw Error(`儲存排程失敗: ${r.statusText}`)}"all"===y?f({}):f(t=>{let r={...t};return Object.keys(e).forEach(e=>{r[e]&&(r[e]=r[e].filter(e=>e.customer_name!==y),0===r[e].length&&delete r[e])}),r}),alert(`成功儲存 ${r} 的 ${t} 個排程到資料庫！`)}catch(e){console.error("儲存本地排程失敗:",e),alert("儲存排程時發生錯誤，請稍後再試")}finally{b(!1)}},L=(e,t)=>{f(r=>{let s={...r};return s[e]&&(s[e]=s[e].filter((e,r)=>r!==t),0===s[e].length&&delete s[e]),s})},R=(e,t,r)=>{k({isOpen:!0,schedule:r,dateStr:e,scheduleIndex:t})},z=async e=>{b(!0);try{if($){let{originalDateStr:t,originalIndex:r}=$,s=e.service_date;console.log("編輯排程 - 原日期:",t,"新日期:",s),f(a=>{let l={...a};return l[t]&&(l[t]=l[t].filter((e,t)=>t!==r),0===l[t].length&&delete l[t]),l[s]=[...l[s]||[],e],console.log("更新後的本地排程:",l),l}),alert("成功更新排班記錄"),S(null)}else if(m.length>1)m.forEach(t=>{let r={...e,service_date:t};f(e=>({...e,[t]:[...e[t]||[],r]}))}),alert(`成功添加 ${m.length} 筆排班記錄到月曆`);else{let t=e.service_date;f(r=>({...r,[t]:[...r[t]||[],e]})),alert("成功添加排班記錄到月曆")}o(!1),c(null),x([]),h(!1)}catch(e){console.error("處理排班失敗:",e),alert("處理排班失敗，請重試")}finally{b(!1)}},O=e=>{let s=new Date(t);s.setMonth(t.getMonth()+("next"===e?1:-1)),r(s)},T=e=>{let t=u(e);p?m.includes(t)?x(e=>e.filter(e=>e!==t)):x(e=>[...e,t]):(c(t),x([t]),o(!0))},P=(()=>{let e=new Date(t.getFullYear(),t.getMonth(),1),r=new Date(e);r.setDate(r.getDate()-e.getDay());let s=[],a=new Date(r);for(let e=0;e<42;e++)s.push(new Date(a)),a.setDate(a.getDate()+1);return s})(),E=t.getMonth();return(0,s.jsxs)("div",{className:"space-y-8",children:[s.jsx("div",{className:"card-apple border border-border-light fade-in-apple",children:(0,s.jsxs)("div",{className:"p-6",children:[(0,s.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[(0,s.jsxs)("div",{className:"flex items-center space-x-4",children:[s.jsx("h3",{className:"text-apple-heading text-text-primary",children:"月曆排班"}),D().length>0&&(0,s.jsxs)("div",{className:"flex items-center space-x-2",children:[s.jsx("span",{className:"text-sm text-text-secondary",children:"顯示客戶:"}),(0,s.jsxs)("select",{value:y,onChange:e=>N(e.target.value),className:"px-3 py-1 text-sm border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-mingcare-blue focus:border-transparent",children:[s.jsx("option",{value:"all",children:"全部客戶"}),D().map(e=>s.jsx("option",{value:e,children:e},e))]})]})]}),(0,s.jsxs)("div",{className:"flex items-center gap-4",children:[p&&m.length>0&&(0,s.jsxs)("div",{className:"text-sm text-text-secondary",children:["已選擇 ",m.length," 天"]}),C()>0&&s.jsx("div",{className:"text-sm text-orange-600 font-medium",children:"all"===y?`待儲存 ${C()} 個排程`:`${y}: ${Object.values(M()).reduce((e,t)=>e+t.length,0)} 個排程`}),s.jsx("button",{onClick:()=>{h(!p),x([]),c(null)},className:`px-4 py-2 rounded-lg border transition-all duration-200 ${p?"bg-mingcare-blue text-white border-mingcare-blue":"border-border-light hover:bg-bg-secondary text-text-secondary"}`,children:p?"取消多選":"多天排班"}),p&&m.length>0&&s.jsx("button",{onClick:()=>{o(!0)},className:"px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200",children:"確認排班"}),C()>0&&s.jsx("button",{onClick:F,disabled:g,className:`px-4 py-2 rounded-lg transition-all duration-200 ${g?"bg-gray-400 text-white cursor-not-allowed":"bg-orange-600 text-white hover:bg-orange-700"}`,children:g?"儲存中...":"all"===y?"確認儲存全部":`儲存 ${y}`})]})]}),(0,s.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[s.jsx("button",{onClick:()=>O("prev"),className:"p-2 rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200",children:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 19l-7-7 7-7"})})}),(0,s.jsxs)("h4",{className:"text-lg font-medium text-text-primary",children:[t.getFullYear(),"年 ",t.getMonth()+1,"月 排班表"]}),s.jsx("button",{onClick:()=>O("next"),className:"p-2 rounded-lg border border-border-light hover:bg-bg-secondary transition-all duration-200",children:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 5l7 7-7 7"})})})]}),s.jsx("div",{className:"grid grid-cols-7 gap-1 mb-2",children:["週日","週一","週二","週三","週四","週五","週六"].map(e=>s.jsx("div",{className:"p-3 text-center text-sm font-medium text-text-secondary bg-bg-secondary rounded-lg",children:e},e))}),s.jsx("div",{className:"grid grid-cols-7 gap-1",children:P.map((e,t)=>{let r=u(e),a=e.getMonth()===E,n=r===u(new Date),i=0===e.getDay()||6===e.getDay(),o=m.includes(r),d=l[r]||[],c=M()[r]||[],x=[...d,...c],p=x.length>0?Math.max(140,140+(x.length-1)*90):140;return(0,s.jsxs)("div",{onClick:()=>a&&T(e),style:{minHeight:`${p}px`},className:`
                    p-2 border-2 rounded-lg cursor-pointer
                    transition-all duration-200 hover:shadow-md
                    ${a?o?"bg-green-100 border-green-500 border-2":i?"bg-blue-50 border-blue-200":"bg-bg-primary border-border-light":"bg-gray-50 text-gray-300 border-gray-200"}
                    ${n?"ring-2 ring-mingcare-blue border-mingcare-blue":""}
                    hover:border-mingcare-blue
                  `,children:[(0,s.jsxs)("div",{className:`
                    text-lg font-bold mb-3 flex justify-between items-center
                    ${n?"text-mingcare-blue":a?"text-text-primary":"text-gray-300"}
                  `,children:[s.jsx("span",{children:e.getDate()}),a&&s.jsx("span",{className:"text-base text-green-600",children:"+"})]}),a&&(0,s.jsxs)("div",{className:"space-y-2",children:[d.map((e,t)=>(0,s.jsxs)("div",{className:"text-base bg-white border border-gray-200 rounded p-3 shadow-sm",children:[(0,s.jsxs)("div",{className:"font-medium text-gray-800 mb-2 text-base break-words leading-tight",children:[e.customer_name,"/",e.care_staff_name]}),s.jsx("div",{className:"text-blue-600 mb-2 text-base break-words leading-tight",children:e.service_type}),(0,s.jsxs)("div",{className:"text-gray-600 text-base font-medium",children:[e.start_time,"-",e.end_time]})]},`remote-${t}`)),c.map((e,t)=>(0,s.jsxs)("div",{onClick:s=>{s.stopPropagation(),R(r,t,e)},className:"text-base bg-yellow-50 border-2 border-yellow-300 rounded p-3 shadow-sm cursor-pointer hover:bg-yellow-100 transition-colors relative group",children:[s.jsx("div",{className:"absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all",children:s.jsx("span",{className:"text-blue-700 font-bold text-sm",children:"點擊編輯"})}),(0,s.jsxs)("div",{className:"font-medium text-gray-800 mb-2 text-base break-words leading-tight",children:[e.customer_name,"/",e.care_staff_name]}),s.jsx("div",{className:"text-blue-600 mb-2 text-base break-words leading-tight",children:e.service_type}),(0,s.jsxs)("div",{className:"text-gray-600 text-base font-medium",children:[e.start_time,"-",e.end_time]})]},`local-${t}`))]})]},t)})})]})}),s.jsx("div",{className:"card-apple border border-border-light fade-in-apple",children:(0,s.jsxs)("div",{className:"p-6",children:[s.jsx("h3",{className:"text-apple-heading text-text-primary mb-4",children:"排班說明"}),(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 text-sm",children:[(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx("div",{className:"w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded"}),s.jsx("span",{className:"text-text-secondary",children:"週末"})]}),(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx("div",{className:"w-4 h-4 bg-mingcare-blue rounded"}),s.jsx("span",{className:"text-text-secondary",children:"已安排服務"})]})]})]})}),i&&s.jsx(j,{isOpen:i,onClose:()=>{o(!1),c(null),x([]),h(!1),S(null)},selectedDate:d,selectedDates:m,existingRecord:$?.schedule?{id:"local-edit",created_at:new Date().toISOString(),updated_at:new Date().toISOString(),service_date:$.schedule.service_date,customer_id:$.schedule.customer_id,customer_name:$.schedule.customer_name,phone:$.schedule.phone,service_address:$.schedule.service_address,start_time:$.schedule.start_time,end_time:$.schedule.end_time,service_hours:$.schedule.service_hours,care_staff_name:$.schedule.care_staff_name,service_fee:$.schedule.service_fee,staff_salary:$.schedule.staff_salary,hourly_rate:$.schedule.hourly_rate,hourly_salary:$.schedule.hourly_salary,service_type:$.schedule.service_type,project_category:$.schedule.project_category,project_manager:$.schedule.project_manager}:null,onSubmit:z}),w.isOpen&&s.jsx(_,{isOpen:w.isOpen,schedule:w.schedule,onClose:()=>k({isOpen:!1,schedule:null,dateStr:"",scheduleIndex:-1}),onUpdate:e=>{let{dateStr:t,scheduleIndex:r}=w;f(s=>{let a={...s};return a[t]&&(a[t][r]=e),a}),k({isOpen:!1,schedule:null,dateStr:"",scheduleIndex:-1})},onDelete:()=>{let{dateStr:e,scheduleIndex:t}=w;L(e,t),k({isOpen:!1,schedule:null,dateStr:"",scheduleIndex:-1})},onEdit:()=>{let{dateStr:e,scheduleIndex:t,schedule:r}=w;r&&(console.log("開始編輯本地排程:",{originalDate:e,originalIndex:t,scheduleDate:r.service_date}),S({originalDateStr:e,originalIndex:t,schedule:r}),c(r.service_date),x([]),h(!1),k({isOpen:!1,schedule:null,dateStr:"",scheduleIndex:-1}),o(!0))}})]})}function f({filters:e,setFilters:t,updateDateRange:r,exportLoading:l,handleExport:n,reportsViewMode:d,setReportsViewMode:c,onEdit:m}){let[x,b]=(0,a.useState)([]),[v,f]=(0,a.useState)(!0),[y,j]=(0,a.useState)(""),[_,N]=(0,a.useState)([]),[w,k]=(0,a.useState)(!1),[$,S]=(0,a.useState)(!1),[C,D]=(0,a.useState)([]),M=(0,a.useRef)(null),[F,L]=(0,a.useState)({top:0,left:0,width:0}),R=()=>{if(M.current){let e=M.current.getBoundingClientRect();L({top:e.bottom+window.scrollY,left:e.left+window.scrollX,width:e.width})}},z=async e=>{if(console.log("客戶搜尋開始:",e),e.length<1){N([]),k(!1);return}try{S(!0);let t=await p(e);console.log("搜尋結果:",t),t.success&&t.data?(N(t.data),k(!0),console.log("設定建議列表:",t.data.length,"筆資料")):(N([]),k(!1))}catch(e){console.error("客戶搜尋失敗:",e),N([]),k(!1)}finally{S(!1)}},O=e=>{console.log("切換客戶選擇:",e.customer_name),D(t=>{let r;return t.some(t=>t.customer_id===e.customer_id)?(r=t.filter(t=>t.customer_id!==e.customer_id),console.log("移除客戶:",e.customer_name)):(r=[...t,e],console.log("新增客戶:",e.customer_name)),r})},T=e=>{O(e)},P=e=>{j(e),0===C.length&&t(t=>({...t,searchTerm:e})),e.length>=1?(R(),z(e)):(N([]),k(!1))};return(0,s.jsxs)("div",{className:"space-y-6 sm:space-y-8",children:[s.jsx("div",{className:"card-apple border border-border-light fade-in-apple",style:{overflow:"visible"},children:(0,s.jsxs)("div",{className:"p-4 sm:p-6",style:{overflow:"visible"},children:[s.jsx("h2",{className:"text-base sm:text-lg font-bold text-text-primary mb-4 sm:mb-6",children:"篩選條件"}),(0,s.jsxs)("div",{className:"flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6",children:[(0,s.jsxs)("div",{className:"flex items-center space-x-2 bg-white border border-border-light rounded-lg px-3 sm:px-4 py-2",children:[s.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4 text-text-secondary flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"})}),s.jsx("input",{type:"date",value:e.dateRange.start,onChange:e=>t(t=>({...t,dateRange:{...t.dateRange,start:e.target.value}})),className:"border-none outline-none bg-transparent text-xs sm:text-sm min-w-0 flex-1"}),s.jsx("span",{className:"text-text-secondary text-xs sm:text-sm",children:"-"}),s.jsx("input",{type:"date",value:e.dateRange.end,onChange:e=>t(t=>({...t,dateRange:{...t.dateRange,end:e.target.value}})),className:"border-none outline-none bg-transparent text-xs sm:text-sm min-w-0 flex-1"})]}),(0,s.jsxs)("div",{className:"flex space-x-2",children:[s.jsx("button",{onClick:()=>{let e=u(new Date);t(t=>({...t,dateRange:{start:e,end:e}}))},className:"px-3 sm:px-4 py-2 text-xs sm:text-sm border border-border-light rounded-lg hover:bg-bg-secondary transition-all duration-200 whitespace-nowrap",children:"今日"}),s.jsx("button",{onClick:()=>r("thisMonth"),className:"px-3 sm:px-4 py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-mingcare-blue text-white whitespace-nowrap",children:"本月"})]})]}),(0,s.jsxs)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 relative",children:[(0,s.jsxs)("div",{className:"relative z-20 overflow-visible sm:col-span-2 lg:col-span-1",children:[(0,s.jsxs)("div",{className:"relative customer-search-container overflow-visible",children:[s.jsx("svg",{className:"absolute left-3 top-3 w-3 h-3 sm:w-4 sm:h-4 text-text-secondary",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"})}),s.jsx("input",{ref:M,type:"text",placeholder:"搜尋客戶",value:y,onChange:e=>P(e.target.value),onFocus:()=>{console.log("輸入框被點擊"),R(),y.length>=1&&(_.length>0?k(!0):z(y))},onBlur:()=>{console.log("輸入框失去焦點"),setTimeout(()=>{k(!1)},150)},className:"w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent text-xs sm:text-sm"}),w&&!1]}),C.length>0&&s.jsx("div",{className:"mt-2 flex flex-wrap gap-2",children:C.map(e=>(0,s.jsxs)("div",{className:"inline-flex items-center bg-mingcare-blue text-white text-sm px-3 py-1 rounded-full",children:[(0,s.jsxs)("span",{className:"mr-2",children:[e.customer_name," (",e.customer_id,")"]}),s.jsx("button",{onClick:()=>T(e),className:"hover:bg-white hover:bg-opacity-20 rounded-full p-1",children:s.jsx("svg",{className:"w-3 h-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]},e.customer_id))})]}),s.jsx("div",{className:"sm:col-span-2 lg:col-span-1",children:(0,s.jsxs)("div",{className:"relative",children:[(0,s.jsxs)("select",{value:e.projectCategory||"",onChange:e=>t(t=>({...t,projectCategory:e.target.value})),className:"w-full px-3 sm:px-4 py-2 sm:py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent appearance-none bg-white pr-8 sm:pr-10 text-xs sm:text-sm",children:[s.jsx("option",{value:"",children:"選擇所屬項目"}),o.map(e=>s.jsx("option",{value:e.value,children:e.label},e.value))]}),s.jsx("svg",{className:"absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-text-secondary pointer-events-none",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 9l-7 7-7-7"})})]})}),s.jsx("div",{className:"sm:col-span-2 lg:col-span-1",children:(0,s.jsxs)("div",{className:"relative",children:[(0,s.jsxs)("select",{value:e.serviceType||"",onChange:e=>t(t=>({...t,serviceType:e.target.value})),className:"w-full px-3 sm:px-4 py-2 sm:py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent appearance-none bg-white pr-8 sm:pr-10 text-xs sm:text-sm",children:[s.jsx("option",{value:"",children:"選擇服務類型"}),i.map(e=>s.jsx("option",{value:e.value,children:e.label},e.value))]}),s.jsx("svg",{className:"absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-text-secondary pointer-events-none",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 9l-7 7-7-7"})})]})}),s.jsx("div",{className:"sm:col-span-2 lg:col-span-1",children:(0,s.jsxs)("div",{className:"relative",children:[(0,s.jsxs)("select",{value:e.careStaffName||"",onChange:e=>t(t=>({...t,careStaffName:e.target.value})),className:"w-full px-3 sm:px-4 py-2 sm:py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-mingcare-blue focus:border-transparent appearance-none bg-white pr-8 sm:pr-10 text-xs sm:text-sm",disabled:v,children:[s.jsx("option",{value:"",children:v?"載入中...":"選擇護理人員"}),x.map((e,t)=>s.jsx("option",{value:e.name_chinese,children:e.name_chinese},t))]}),s.jsx("svg",{className:"absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-text-secondary pointer-events-none",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 9l-7 7-7-7"})})]})})]})]})}),s.jsx("div",{className:"card-apple border border-border-light fade-in-apple",children:(0,s.jsxs)("div",{className:"p-6",children:[(0,s.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[s.jsx("h3",{className:"text-apple-heading text-text-primary",children:"服務記錄列表"}),(0,s.jsxs)("div",{className:"flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4",children:[(0,s.jsxs)("div",{className:"flex items-center border border-border-light rounded-lg p-1",children:[(0,s.jsxs)("button",{onClick:()=>c("list"),className:`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 ${"list"===d?"bg-mingcare-blue text-white":"text-text-secondary hover:text-text-primary hover:bg-bg-secondary"}`,children:[s.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M4 6h16M4 10h16M4 14h16M4 18h16"})}),s.jsx("span",{children:"列表"})]}),(0,s.jsxs)("button",{onClick:()=>c("calendar"),className:`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 ${"calendar"===d?"bg-mingcare-blue text-white":"text-text-secondary hover:text-text-primary hover:bg-bg-secondary"}`,children:[s.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"})}),s.jsx("span",{children:"月曆"})]})]}),s.jsx("button",{onClick:n,disabled:l,className:"px-4 sm:px-6 py-2 sm:py-3 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-xs sm:text-sm",children:l?(0,s.jsxs)(s.Fragment,{children:[s.jsx("div",{className:"animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"}),s.jsx("span",{children:"導出中..."})]}):(0,s.jsxs)(s.Fragment,{children:[s.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"})}),s.jsx("span",{children:"導出報表"})]})})]})]}),"list"===d?s.jsx(g,{filters:e}):s.jsx(h,{filters:e,onEdit:m})]})})]})}function y(){let[e,t]=(0,a.useState)(null),[r,n]=(0,a.useState)(!0),[i,o]=(0,a.useState)(!1),[d,m]=(0,a.useState)(!1),[x,p]=(0,a.useState)("reports"),[u,h]=(0,a.useState)("list"),g=(0,l.useRouter)(),[y,_]=(0,a.useState)(()=>{let e=new Date,t=new Date(e.getFullYear(),e.getMonth(),1),r=new Date(e.getFullYear(),e.getMonth()+1,0),s=e=>{let t=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${r}-${s}`};return{dateRange:{start:s(t),end:s(r)}}}),[N,w]=(0,a.useState)(null),[k,$]=(0,a.useState)([]),[S,C]=(0,a.useState)(null),[D,M]=(0,a.useState)(!1),[F,L]=(0,a.useState)(!1),[R,z]=(0,a.useState)("pdf"),[O,T]=(0,a.useState)("accounting"),[P,E]=(0,a.useState)("combined"),[B,H]=(0,a.useState)(!1),[I,W]=(0,a.useState)({}),[Y,q]=(0,a.useState)([]),[V,A]=(0,a.useState)(!0),[G,U]=(0,a.useState)({service_date:!0,customer_id:!1,customer_name:!0,phone:!1,service_address:!0,start_time:!0,end_time:!0,service_hours:!0,care_staff_name:!0,service_fee:!1,staff_salary:!1,hourly_rate:!1,hourly_salary:!1,service_type:!0,project_category:!1,project_manager:!1}),J={accounting:{name:"對數模式",description:"包含服務費用和收費相關欄位",columns:{service_date:!0,customer_name:!0,service_address:!0,start_time:!0,end_time:!0,service_hours:!0,care_staff_name:!0,service_type:!0,service_fee:!0,hourly_rate:!0,customer_id:!1,phone:!1,staff_salary:!1,hourly_salary:!1,project_category:!1,project_manager:!1}},payroll:{name:"工資模式",description:"包含護理員工資和薪酬相關欄位",columns:{service_date:!0,customer_name:!0,service_address:!0,start_time:!0,end_time:!0,service_hours:!0,care_staff_name:!1,service_type:!0,staff_salary:!0,hourly_salary:!0,customer_id:!1,phone:!1,service_fee:!1,hourly_rate:!1,project_category:!1,project_manager:!1}}},X=e=>{let t,r;let s=new Date;switch(e){case"last7days":t=new Date(s.getTime()-6048e5),r=s;break;case"last30days":t=new Date(s.getTime()-2592e6),r=s;break;case"last90days":t=new Date(s.getTime()-7776e6),r=s;break;case"thisMonth":t=new Date(s.getFullYear(),s.getMonth(),1),r=new Date(s.getFullYear(),s.getMonth()+1,0);break;case"lastMonth":t=new Date(s.getFullYear(),s.getMonth()-1,1),r=new Date(s.getFullYear(),s.getMonth(),0);break;default:return}let a=e=>{let t=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${r}-${s}`};_(e=>({...e,dateRange:{start:a(t),end:a(r)}}))},Z=e=>{T(e),U(J[e].columns)},K=async()=>{m(!0),L(!1);try{let e=await c(y,1,1e4);if(!e.success||!e.data)throw Error("無法獲取數據");let t=e.data.data;"accounting"===O&&(t=t.sort((e,t)=>{let r=(e.customer_name||"").localeCompare(t.customer_name||"","zh-TW");if(0!==r)return r;let s=new Date(e.service_date||""),a=new Date(t.service_date||"");return s.getTime()-a.getTime()}));let r=Object.entries(G).filter(([e,t])=>t).map(([e,t])=>e);"pdf"===R?"payroll"===O&&"separate"===P?(L(!1),H(!0),W({})):await et(t,r):await er(t,r),alert("導出成功")}catch(e){console.error("Export error:",e),alert("導出時發生錯誤")}finally{m(!1)}},Q=async(e,t,r)=>{try{let s=t.filter(t=>(t.care_staff_name||"未知護理人員")===e);if(0===s.length){alert("該護理員沒有記錄");return}s.sort((e,t)=>new Date(e.service_date).getTime()-new Date(t.service_date).getTime()),await ee(s,r,e),W(t=>({...t,[e]:"downloaded"}))}catch(e){console.error("下載護理員PDF時發生錯誤:",e),alert("下載護理員PDF時發生錯誤")}},ee=async(e,t,r)=>{let s={service_date:"服務日期",customer_id:"客戶編號",customer_name:"客戶姓名",phone:"客戶電話",service_address:"服務地址",start_time:"開始時間",end_time:"結束時間",service_hours:"服務時數",care_staff_name:"護理員姓名",service_fee:"服務費用",staff_salary:"護理員工資",hourly_rate:"每小時收費",hourly_salary:"每小時工資",service_type:"服務類型",project_category:"所屬項目",project_manager:"項目經理",service_time:"服務時間",duration_hours:"時數",billing_amount:"金額",customer_address:"客戶地址",notes:"備註"},a=e.length,l=e.reduce((e,t)=>{let r=parseFloat(t.service_hours||t.duration_hours||"0");return e+(isNaN(r)?0:r)},0),n=e.reduce((e,t)=>{let r=parseFloat(t.staff_salary||t.billing_amount||"0");return e+(isNaN(r)?0:r)},0),i=new Date,o=`${i.getFullYear()}-${String(i.getMonth()+1).padStart(2,"0")}-${String(i.getDate()).padStart(2,"0")}`,d=e[0],c=new Date(d?.service_date||i),m=`${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}`,x=`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${r} ${m}工資明細</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 20mm;
          }
          body {
            font-family: "PingFang TC", "Microsoft JhengHei", "SimHei", sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 14px;
            margin-bottom: 5px;
          }
          .summary {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 11px;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .summary-section {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 5px;
          }
          .summary-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            color: #495057;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .summary-item strong {
            color: #495057;
          }
          .summary-total {
            border-top: 2px solid #dee2e6;
            padding-top: 10px;
            margin-top: 10px;
            font-weight: bold;
            font-size: 15px;
            color: #007bff;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${r} ${m} 工資明細</div>
          <div class="subtitle">匯出日期: ${o}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              ${t.map(e=>`<th>${s[e]||e}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${e.map(e=>`
              <tr>
                ${t.map(t=>{let r="";switch(t){case"service_date":let s=new Date(e[t]);r=`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}-${String(s.getDate()).padStart(2,"0")}`;break;case"start_time":case"end_time":let a=e[t]||"";if(a.includes("T")||a.includes(" ")){let e=new Date(a);r=`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}else r=a;break;case"service_hours":case"duration_hours":let l=parseFloat(e[t]||"0");r=isNaN(l)?"0":l.toString();break;case"staff_salary":case"service_fee":case"hourly_rate":case"hourly_salary":case"billing_amount":let n=parseFloat(e[t]||"0");r=isNaN(n)?"$0.00":`$${n.toFixed(2)}`;break;default:r=String(e[t]||"")}return`<td>${r}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>

        <!-- 總結部分 -->
        <div class="summary-section">
          <div class="summary-title">工資總結</div>
          <div class="summary-item">
            <span><strong>服務次數:</strong></span>
            <span>${a} 次</span>
          </div>
          <div class="summary-item">
            <span><strong>總時數:</strong></span>
            <span>${l.toFixed(1)} 小時</span>
          </div>
          <div class="summary-item summary-total">
            <span><strong>總工資:</strong></span>
            <span>$${n.toFixed(2)}</span>
          </div>
        </div>
      </body>
      </html>
    `,p=window.open("","_blank");p&&(p.document.write(x),p.document.close(),p.addEventListener("load",()=>{setTimeout(()=>{p.print(),p.close()},500)}))},et=async(e,t)=>{try{let r={service_date:"服務日期",customer_id:"客戶編號",customer_name:"客戶姓名",phone:"客戶電話",service_address:"服務地址",start_time:"開始時間",end_time:"結束時間",service_hours:"服務時數",care_staff_name:"護理員姓名",service_fee:"服務費用",staff_salary:"護理員工資",hourly_rate:"每小時收費",hourly_salary:"每小時工資",service_type:"服務類型",project_category:"所屬項目",project_manager:"項目經理"},s="accounting"===O,a="",l="";if(s){let s={};e.forEach(e=>{let t=e.customer_name||"未知客戶";s[t]||(s[t]=[]),s[t].push(e)});let n=Object.keys(s).length,i=e.length,o=0,d=0;a=Object.keys(s).map((e,a)=>{let l=s[e],n=0,i=0,c=l.map(e=>(n+=parseFloat(e.service_hours||"0"),i+=parseFloat(e.service_fee||"0"),`
              <tr>
                ${t.map(t=>{let r=e[t]||"",s=["hourly_rate","hourly_salary","service_hours","service_fee","staff_salary"].includes(t);return`<td class="${s?"number":""}">${String(r)}</td>`}).join("")}
              </tr>
            `)).join(""),m=`
            <tr class="customer-subtotal">
              <td colspan="${t.length-2}" style="text-align: right; font-weight: bold; background-color: #f0f8ff; border-top: 2px solid #428bca;">
                ${e} 小結：
              </td>
              <td style="text-align: right; font-weight: bold; background-color: #f0f8ff; border-top: 2px solid #428bca;">
                ${n.toFixed(1)}
              </td>
              <td style="text-align: right; font-weight: bold; background-color: #f0f8ff; border-top: 2px solid #428bca;">
                $${i.toFixed(2)}
              </td>
            </tr>
          `;return o+=n,d+=i,`
            <div class="customer-group">
              <h3 style="color: #428bca; margin: 20px 0 10px 0; font-size: 16px; border-bottom: 1px solid #428bca; padding-bottom: 5px;">
                ${e} (${l.length} 次服務)
              </h3>
              <table>
                <thead>
                  <tr>
                    ${t.map(e=>`<th>${r[e]||e}</th>`).join("")}
                  </tr>
                </thead>
                <tbody>
                  ${c}
                  ${m}
                </tbody>
              </table>
            </div>
          `}).join(""),l=`
          <div style="margin-top: 30px; padding: 20px; border: 2px solid #428bca; background-color: #f8f9fa; page-break-inside: avoid;">
            <h3 style="text-align: center; color: #428bca; margin-bottom: 15px;">總結報告</h3>
            <div style="display: flex; justify-content: space-around; font-size: 14px;">
              <div style="text-align: center;">
                <div style="font-weight: bold; color: #428bca;">客戶總數</div>
                <div style="font-size: 18px; font-weight: bold;">${n}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-weight: bold; color: #428bca;">服務次數</div>
                <div style="font-size: 18px; font-weight: bold;">${i}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-weight: bold; color: #428bca;">總服務時數</div>
                <div style="font-size: 18px; font-weight: bold;">${o.toFixed(1)}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-weight: bold; color: #428bca;">總服務費用</div>
                <div style="font-size: 18px; font-weight: bold;">$${d.toFixed(2)}</div>
              </div>
            </div>
          </div>
        `}else if("payroll"===O){let s={};e.forEach(e=>{let t=e.care_staff_name||"未知護理人員";s[t]||(s[t]=[]),s[t].push(e)});let n=Object.keys(s).sort(),i=Object.keys(s).length,o=e.length,d=0,c=0;a=n.map((e,a)=>{let l=s[e];l.sort((e,t)=>new Date(e.service_date).getTime()-new Date(t.service_date).getTime());let n=0,i=0;return l.forEach(e=>{let t=parseFloat(e.service_hours||e.duration_hours||"0"),r=parseFloat(e.staff_salary||"0");n+=isNaN(t)?0:t,i+=isNaN(r)?0:r}),d+=n,c+=i,`
            <div class="staff-group">
              <div class="staff-header">
                <h2>${e}</h2>
                <div class="staff-info">記錄數: ${l.length}筆</div>
              </div>
              
              <table class="data-table">
                <thead>
                  <tr>
                    ${t.map(e=>`<th>${r[e]||e}</th>`).join("")}
                  </tr>
                </thead>
                <tbody>
                  ${l.map(e=>`
                    <tr>
                      ${t.map(t=>{let r=e[t]||"",s=["hourly_rate","hourly_salary","service_hours","duration_hours","service_fee","staff_salary"].includes(t),a=String(r);if("service_date"===t&&r){let e=new Date(r),t=e.getFullYear(),s=String(e.getMonth()+1).padStart(2,"0"),l=String(e.getDate()).padStart(2,"0");a=`${t}-${s}-${l}`}else if(s&&r){let e=parseFloat(r);a=isNaN(e)?"0":e.toFixed(2)}return`<td class="${s?"number":""}">${a}</td>`}).join("")}
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              
              <div class="staff-summary">
                <div class="summary-row">
                  <div class="summary-item">
                    <span class="label">服務時數:</span>
                    <span class="value">${n.toFixed(1)} 小時</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">護理員工資:</span>
                    <span class="value">$${i.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          `}).join(""),l=`
          <div class="total-summary-page">
            <div class="summary-header">
              <h2>工資總結</h2>
            </div>
            <div class="summary-stats">
              <div class="stat-row">
                <div class="stat-item">
                  <div class="stat-label">護理員數量</div>
                  <div class="stat-value">${i} 人</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">總服務時數</div>
                  <div class="stat-value">${d.toFixed(1)} 小時</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">總工資</div>
                  <div class="stat-value">$${c.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <div class="staff-summary-table">
              <h3>各護理人員明細</h3>
              <table class="summary-table">
                <thead>
                  <tr>
                    <th>護理人員</th>
                    <th>服務次數</th>
                    <th>服務時數</th>
                    <th>工資</th>
                  </tr>
                </thead>
                <tbody>
                  ${n.map(e=>{let t=s[e],r=t.reduce((e,t)=>{let r=parseFloat(t.service_hours||t.duration_hours||"0");return e+(isNaN(r)?0:r)},0),a=t.reduce((e,t)=>{let r=parseFloat(t.staff_salary||"0");return e+(isNaN(r)?0:r)},0);return`
                      <tr>
                        <td>${e}</td>
                        <td class="number">${t.length}</td>
                        <td class="number">${r.toFixed(1)}</td>
                        <td class="number">$${a.toFixed(2)}</td>
                      </tr>
                    `}).join("")}
                  <tr class="total-row">
                    <td><strong>總計</strong></td>
                    <td class="number"><strong>${o}</strong></td>
                    <td class="number"><strong>${d.toFixed(1)}</strong></td>
                    <td class="number"><strong>$${c.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `}else a=e.map(e=>`
          <tr>
            ${t.map(t=>{let r=e[t]||"",s=["hourly_rate","hourly_salary","service_hours","service_fee","staff_salary"].includes(t);return`<td class="${s?"number":""}">${String(r)}</td>`}).join("")}
          </tr>
        `).join("");let n=`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>明家居家護理服務記錄報表</title>
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body { margin: 0; }
              .customer-group {
                page-break-inside: avoid;
                page-break-after: always;
              }
              .customer-group:last-child {
                page-break-after: auto;
              }
              .staff-group {
                page-break-inside: avoid;
                page-break-after: always;
              }
              .staff-group:last-child {
                page-break-after: auto;
              }
              .total-summary-page {
                page-break-before: always;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微軟雅黑", Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              color: #333;
            }
            .header h2 {
              margin: 5px 0;
              font-size: 14px;
              color: #666;
            }
            .meta {
              text-align: center;
              margin: 10px 0;
              font-size: 11px;
              color: #888;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 5px 8px;
              text-align: left;
              word-wrap: break-word;
            }
            th {
              background-color: #428bca;
              color: white;
              font-weight: bold;
              text-align: center;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .number {
              text-align: right;
            }
            .customer-subtotal {
              background-color: #f0f8ff !important;
            }
            .staff-group {
              margin-bottom: 30px;
            }
            .staff-header {
              background-color: #e8f4fd;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #428bca;
            }
            .staff-header h2 {
              margin: 0;
              color: #2c5282;
              font-size: 18px;
            }
            .staff-info {
              color: #666;
              font-size: 14px;
              margin-top: 5px;
            }
            .staff-summary {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
              border: 1px solid #e0e0e0;
            }
            .summary-row {
              display: flex;
              justify-content: space-around;
              align-items: center;
            }
            .summary-item {
              text-align: center;
              flex: 1;
            }
            .summary-item .label {
              display: block;
              font-weight: bold;
              color: #666;
              font-size: 13px;
              margin-bottom: 5px;
            }
            .summary-item .value {
              display: block;
              font-size: 16px;
              font-weight: bold;
              color: #2c5282;
            }
            .total-summary-page {
              padding: 20px;
            }
            .summary-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #428bca;
              padding-bottom: 15px;
            }
            .summary-header h2 {
              margin: 0;
              color: #2c5282;
              font-size: 24px;
            }
            .summary-stats {
              margin-bottom: 30px;
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
            }
            .stat-row {
              display: flex;
              justify-content: space-around;
              align-items: center;
            }
            .stat-item {
              text-align: center;
              flex: 1;
            }
            .stat-label {
              font-weight: bold;
              color: #666;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .stat-value {
              font-size: 20px;
              font-weight: bold;
              color: #2c5282;
            }
            .staff-summary-table h3 {
              color: #2c5282;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .summary-table {
              margin-top: 0;
            }
            .total-row {
              background-color: #e8f4fd !important;
              font-weight: bold;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media screen {
              .print-button {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                z-index: 1000;
              }
              .print-button:hover {
                background: #0056b3;
              }
            }
            @media print {
              .print-button { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">列印 / 儲存為PDF</button>
          
          <div class="header">
            <h1>MingCare Home Health Services Limited</h1>
            <h2>明家居家護理服務記錄報表</h2>
            ${s?'<div style="color: #428bca; font-weight: bold; margin-top: 5px;">對數模式</div>':""}
            ${"payroll"===O?'<div style="color: #28a745; font-weight: bold; margin-top: 5px;">工資模式</div>':""}
          </div>
          
          <div class="meta">
            日期範圍: ${y.dateRange.start} ~ ${y.dateRange.end}<br>
            生成時間: ${new Date().toLocaleDateString("zh-TW")} ${new Date().toLocaleTimeString("zh-TW")}
          </div>
          
          ${s||"payroll"===O?a:`
          <table>
            <thead>
              <tr>
                ${t.map(e=>`<th>${r[e]||e}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${a}
            </tbody>
          </table>
          `}
          
          ${l}
          
          <div class="footer">
            <strong>明家居家護理服務有限公司 MingCare Home Health Services Limited</strong><br>
            此報表由系統自動生成，如有疑問請聯繫管理員<br>
            報表包含 ${e.length} 筆記錄，共 ${t.length} 個欄位
          </div>
        </body>
        </html>
      `,i=window.open("","_blank");if(i)i.document.write(n),i.document.close(),i.onload=()=>{setTimeout(()=>{i.focus()},500)};else{let e=new Blob([n],{type:"text/html;charset=utf-8"}),t=URL.createObjectURL(e),r=document.createElement("a");r.href=t,r.download=`mingcare_report_${y.dateRange.start}_${y.dateRange.end}.html`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(t),alert("已下載HTML文件，請在瀏覽器中打開後列印或儲存為PDF")}}catch(e){throw console.error("PDF導出錯誤:",e),alert("PDF導出失敗，請稍後再試或選擇CSV格式"),e}},er=async(e,t)=>{let r={service_date:"服務日期",customer_id:"客戶編號",customer_name:"客戶姓名",phone:"客戶電話",service_address:"服務地址",start_time:"開始時間",end_time:"結束時間",service_hours:"服務時數",care_staff_name:"護理員姓名",service_fee:"服務費用",staff_salary:"護理員工資",hourly_rate:"每小時收費",hourly_salary:"每小時工資",service_type:"服務類型",project_category:"所屬項目",project_manager:"項目經理"},s=new Blob(["\uFEFF"+[t.map(e=>r[e]||e).join(","),...e.map(e=>t.map(t=>{let r=String(e[t]||"");return r.includes(",")||r.includes('"')||r.includes("\n")?`"${r.replace(/"/g,'""')}"`:r}).join(","))].join("\n")],{type:"text/csv;charset=utf-8;"}),a=document.createElement("a"),l=URL.createObjectURL(s);a.setAttribute("href",l),a.setAttribute("download",`mingcare_report_${y.dateRange.start}_${y.dateRange.end}.csv`),a.style.visibility="hidden",document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(l)},es=async e=>{if(S)try{M(!1),C(null),alert("記錄已更新")}catch(e){console.error("更新記錄失敗:",e),alert("更新失敗")}},ea=async e=>{try{M(!1),C(null),alert("記錄已刪除")}catch(e){throw console.error("刪除記錄失敗:",e),e}};return r?s.jsx("div",{className:"min-h-screen flex items-center justify-center bg-bg-primary",children:(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("div",{className:"inline-block animate-spin rounded-full h-8 w-8 border-2 border-mingcare-blue border-t-transparent"}),s.jsx("p",{className:"text-apple-body text-text-secondary mt-4",children:"載入中..."})]})}):B?(0,s.jsxs)("div",{className:"min-h-screen bg-bg-primary overflow-auto",children:[s.jsx("header",{className:"card-apple border-b border-border-light fade-in-apple sticky top-0 z-10",children:s.jsx("div",{className:"px-6 lg:px-8",children:(0,s.jsxs)("div",{className:"flex justify-between items-center py-8",children:[(0,s.jsxs)("div",{children:[s.jsx("h1",{className:"text-apple-title text-text-primary mb-2",children:"工資明細下載"}),s.jsx("p",{className:"text-apple-body text-text-secondary",children:"選擇護理員下載其工資明細"})]}),s.jsx("button",{onClick:()=>H(!1),className:"px-4 py-2 text-mingcare-blue border border-mingcare-blue rounded-lg hover:bg-mingcare-blue hover:text-white transition-all duration-200",children:"返回報表"})]})})}),s.jsx("main",{className:"px-6 lg:px-8 py-8 pb-16",children:s.jsx("div",{className:"card-apple",children:(0,s.jsxs)("div",{className:"p-6",children:[s.jsx("h3",{className:"text-lg font-medium text-text-primary mb-6",children:"護理員工資明細"}),V?s.jsx("div",{className:"text-center py-12",children:s.jsx("p",{className:"text-text-secondary",children:"載入中..."})}):0===Y.length?s.jsx("div",{className:"text-center py-12",children:s.jsx("p",{className:"text-text-secondary",children:"沒有找到護理員資料"})}):s.jsx("div",{className:"space-y-4 max-h-none",children:Y.map(e=>{let t="downloaded"===I[e],r="downloading"===I[e],a=`${e} ${y.dateRange.start.substring(0,7)}工資明細`;return(0,s.jsxs)("div",{className:"flex items-center justify-between p-4 border border-border-light rounded-lg",children:[(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-medium text-text-primary",children:a}),(0,s.jsxs)("p",{className:"text-sm text-text-secondary mt-1",children:["期間：",y.dateRange.start," 至 ",y.dateRange.end]})]}),s.jsx("div",{className:"flex items-center space-x-3",children:t?(0,s.jsxs)(s.Fragment,{children:[s.jsx("div",{className:"px-4 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg font-medium",children:"已成功下載"}),s.jsx("button",{onClick:async()=>{W(t=>({...t,[e]:"downloading"}));try{let t=await c(y,1,1e4);if(t.success&&t.data){let r=Object.entries(G).filter(([e,t])=>t).map(([e,t])=>e);await Q(e,t.data.data,r)}}catch(t){console.error("下載失敗:",t),W(t=>({...t,[e]:"error"})),alert("下載失敗，請重試")}},disabled:r,className:"px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg font-medium hover:bg-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",children:"再次下載"})]}):s.jsx("button",{onClick:async()=>{if(!r){W(t=>({...t,[e]:"downloading"}));try{let t=await c(y,1,1e4);if(t.success&&t.data){let r=Object.entries(G).filter(([e,t])=>t).map(([e,t])=>e);await Q(e,t.data.data,r)}}catch(t){console.error("下載失敗:",t),W(t=>({...t,[e]:"error"})),alert("下載失敗，請重試")}}},disabled:r,className:`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${r?"bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed":"bg-mingcare-blue text-white hover:bg-blue-600 active:bg-blue-700"}`,children:r?"下載中...":"下載"})})]},e)})})]})})})]}):(0,s.jsxs)("div",{className:"min-h-screen bg-bg-primary",children:[s.jsx("header",{className:"card-apple border-b border-border-light fade-in-apple sticky top-0 z-10",children:s.jsx("div",{className:"px-4 sm:px-6 lg:px-8",children:(0,s.jsxs)("div",{className:"flex justify-between items-center py-4 sm:py-6 lg:py-8",children:[(0,s.jsxs)("div",{className:"flex-1 min-w-0",children:[s.jsx("h1",{className:"text-lg sm:text-xl lg:text-2xl font-bold text-text-primary mb-1 truncate",children:"護理服務管理"}),s.jsx("p",{className:"text-xs sm:text-sm text-text-secondary hidden sm:block",children:"安排護理服務、管理服務排程及記錄"})]}),s.jsx("button",{onClick:()=>g.push("/dashboard"),className:"btn-apple-secondary text-xs px-3 py-2 ml-3 flex-shrink-0",children:"返回"})]})})}),(0,s.jsxs)("main",{className:"px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8",children:[s.jsx("div",{className:"mb-6",children:s.jsx("div",{className:"border-b border-border-light",children:(0,s.jsxs)("nav",{className:"-mb-px flex overflow-x-auto scrollbar-hide",children:[s.jsx("button",{onClick:()=>p("reports"),className:`py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${"reports"===x?"border-mingcare-blue text-mingcare-blue":"border-transparent text-text-secondary hover:text-text-primary hover:border-border-light"}`,children:(0,s.jsxs)("div",{className:"flex items-center space-x-1 sm:space-x-2",children:[s.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"})}),s.jsx("span",{children:"詳細報表"})]})}),s.jsx("button",{onClick:()=>p("schedule"),className:`py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${"schedule"===x?"border-mingcare-blue text-mingcare-blue":"border-transparent text-text-secondary hover:text-text-primary hover:border-border-light"}`,children:(0,s.jsxs)("div",{className:"flex items-center space-x-1 sm:space-x-2",children:[s.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"})}),s.jsx("span",{children:"排程管理"})]})}),s.jsx("button",{onClick:()=>p("overview"),className:`py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${"overview"===x?"border-mingcare-blue text-mingcare-blue":"border-transparent text-text-secondary hover:text-text-primary hover:border-border-light"}`,children:(0,s.jsxs)("div",{className:"flex items-center space-x-1 sm:space-x-2",children:[s.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"})}),s.jsx("span",{children:"業務概覽"})]})})]})})}),"overview"===x&&s.jsx(b,{filters:y,setFilters:_,updateDateRange:X,kpiData:N,kpiLoading:i,categorySummary:k}),"schedule"===x&&s.jsx(v,{filters:y}),"reports"===x&&s.jsx(f,{filters:y,setFilters:_,updateDateRange:X,exportLoading:d,handleExport:()=>{L(!0)},reportsViewMode:u,setReportsViewMode:h,onEdit:e=>{C(e),M(!0)}})]}),D&&S&&s.jsx(j,{isOpen:D,onClose:()=>{M(!1),C(null)},onSubmit:es,onDelete:ea,existingRecord:S}),F&&s.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:(0,s.jsxs)("div",{className:"bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col",children:[s.jsx("div",{className:"p-6 border-b border-gray-200 flex-shrink-0",children:s.jsx("h3",{className:"text-lg font-medium text-text-primary",children:"導出設定"})}),(0,s.jsxs)("div",{className:"flex-1 overflow-y-auto p-6",children:[(0,s.jsxs)("div",{className:"mb-6",children:[s.jsx("label",{className:"block text-sm font-medium text-text-primary mb-3",children:"預設模式"}),s.jsx("div",{className:"space-y-3",children:Object.entries(J).map(([e,t])=>(0,s.jsxs)("label",{className:"flex items-start",children:[s.jsx("input",{type:"radio",name:"exportMode",value:e,checked:O===e,onChange:e=>Z(e.target.value),className:"mr-3 mt-1"}),(0,s.jsxs)("div",{children:[s.jsx("div",{className:"font-medium text-text-primary",children:t.name}),s.jsx("div",{className:"text-sm text-text-secondary",children:t.description})]})]},e))})]}),(0,s.jsxs)("div",{className:"mb-6",children:[s.jsx("label",{className:"block text-sm font-medium text-text-primary mb-3",children:"導出格式"}),(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsxs)("label",{className:"flex items-center",children:[s.jsx("input",{type:"radio",name:"format",value:"pdf",checked:"pdf"===R,onChange:e=>z(e.target.value),className:"mr-2"}),s.jsx("span",{children:"PDF"})]}),(0,s.jsxs)("label",{className:"flex items-center",children:[s.jsx("input",{type:"radio",name:"format",value:"csv",checked:"csv"===R,onChange:e=>z(e.target.value),className:"mr-2"}),s.jsx("span",{children:"CSV"})]})]})]}),"payroll"===O&&"pdf"===R&&(0,s.jsxs)("div",{className:"mb-6",children:[s.jsx("label",{className:"block text-sm font-medium text-text-primary mb-3",children:"工資導出方式"}),(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsxs)("label",{className:"flex items-center",children:[s.jsx("input",{type:"radio",name:"payrollType",value:"combined",checked:"combined"===P,onChange:e=>E(e.target.value),className:"mr-2"}),s.jsx("span",{children:"合併報表 (一個PDF包含所有人員)"})]}),(0,s.jsxs)("label",{className:"flex items-center",children:[s.jsx("input",{type:"radio",name:"payrollType",value:"separate",checked:"separate"===P,onChange:e=>E(e.target.value),className:"mr-2"}),s.jsx("span",{children:"個別報表 (每人單獨PDF檔案)"})]})]})]}),(0,s.jsxs)("div",{className:"mb-6",children:[(0,s.jsxs)("label",{className:"block text-sm font-medium text-text-primary mb-3",children:["選擇要導出的欄位",(0,s.jsxs)("span",{className:"text-xs text-text-secondary ml-2",children:["(",J[O].name," 預設配置，可自由調整)"]})]}),s.jsx("div",{className:"space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50",children:Object.entries({service_date:"服務日期",customer_id:"客戶編號",customer_name:"客戶姓名",phone:"客戶電話",service_address:"服務地址",start_time:"開始時間",end_time:"結束時間",service_hours:"服務時數",care_staff_name:"護理員姓名",service_fee:"服務費用",staff_salary:"護理員工資",hourly_rate:"每小時收費",hourly_salary:"每小時工資",service_type:"服務類型",project_category:"所屬項目",project_manager:"項目經理"}).map(([e,t])=>{let r=["service_date","customer_name","service_address","start_time","end_time","service_hours","care_staff_name","service_type"].includes(e);return(0,s.jsxs)("label",{className:"flex items-center",children:[s.jsx("input",{type:"checkbox",checked:G[e],onChange:t=>{U(r=>({...r,[e]:t.target.checked}))},className:"mr-2"}),(0,s.jsxs)("span",{className:`text-sm ${r?"font-medium text-mingcare-blue":""}`,children:[t,r&&s.jsx("span",{className:"text-xs text-mingcare-blue ml-1",children:"(默認)"})]})]},e)})})]})]}),(0,s.jsxs)("div",{className:"p-6 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0",children:[s.jsx("button",{onClick:()=>L(!1),className:"px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-bg-secondary transition-all duration-200",children:"取消"}),s.jsx("button",{onClick:K,disabled:Object.values(G).every(e=>!e),className:"px-4 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",children:"確認導出"})]})]})})]})}function j({isOpen:e,onClose:t,selectedDate:r,selectedDates:l=[],onSubmit:n,onDelete:c,isMultiDay:m=!1,existingRecord:x=null}){let[p,h]=(0,a.useState)(()=>x?{service_date:x.service_date,customer_id:x.customer_id,customer_name:x.customer_name,phone:x.phone,service_address:x.service_address,start_time:x.start_time,end_time:x.end_time,service_hours:x.service_hours,care_staff_name:x.care_staff_name,service_fee:x.service_fee,staff_salary:x.staff_salary,hourly_rate:x.hourly_rate||0,hourly_salary:x.hourly_salary||0,service_type:x.service_type,project_category:x.project_category,project_manager:x.project_manager}:{service_date:r||u(new Date),customer_id:"",customer_name:"",phone:"",service_address:"",start_time:"09:00",end_time:"17:00",service_hours:8,care_staff_name:"",service_fee:0,staff_salary:0,hourly_rate:0,hourly_salary:0,service_type:"",project_category:"",project_manager:""}),[g,b]=(0,a.useState)(!1),[v,f]=(0,a.useState)({}),[y,j]=(0,a.useState)(x?x.customer_name:""),[_,N]=(0,a.useState)([]),[w,k]=(0,a.useState)(!1),[$,S]=(0,a.useState)(x?x.care_staff_name:""),[C,D]=(0,a.useState)([]),[M,F]=(0,a.useState)(!1),L=m||l.length>1,R=e=>{let t={};return e.customer_name.trim()||(t.customer_name="客戶姓名不能為空"),e.phone.trim()||(t.phone="聯絡電話不能為空"),e.service_address.trim()||(t.service_address="服務地址不能為空"),e.care_staff_name.trim()||(t.care_staff_name="護理人員不能為空"),e.service_fee<=0&&(t.service_fee="服務費用必須大於 0"),e.staff_salary<0&&(t.staff_salary="員工薪資不能為負數"),e.service_hours<=0&&(t.service_hours="服務時數必須大於 0"),e.service_type||(t.service_type="請選擇服務類型"),e.project_category||(t.project_category="請選擇項目分類"),e.project_manager||(t.project_manager="請選擇項目負責人"),e.start_time>=e.end_time&&(t.end_time="結束時間必須晚於開始時間"),t},z=(e,t)=>{let[r,s]=e.split(":").map(Number),[a,l]=t.split(":").map(Number);return Math.max(0,(60*a+l-(60*r+s))/60)},O=async e=>{e.preventDefault(),b(!0);try{let e=R(p);if(Object.keys(e).length>0){f(e);return}f({});let r={service_date:p.service_date,customer_id:p.customer_id,customer_name:p.customer_name,phone:p.phone,service_address:p.service_address,start_time:p.start_time,end_time:p.end_time,service_hours:p.service_hours,care_staff_name:p.care_staff_name,service_fee:p.service_fee,staff_salary:p.staff_salary,service_type:p.service_type,project_category:p.project_category,project_manager:p.project_manager};await n(r),t()}catch(e){console.error("提交表單失敗:",e)}finally{b(!1)}},T=(e,t)=>{h(r=>{let s={...r,[e]:t};if("service_date"===e&&t&&"string"==typeof t&&t.match(/^\d{4}-\d{2}-\d{2}$/)&&(s.service_date=t),("start_time"===e||"end_time"===e)&&s.start_time&&s.end_time){let e=z(s.start_time,s.end_time);s.service_hours=Math.round(2*e)/2}return("service_fee"===e||"staff_salary"===e||"service_hours"===e)&&s.service_hours>0&&(s.hourly_rate=(s.service_fee||0)/s.service_hours,s.hourly_salary=(s.staff_salary||0)/s.service_hours),s}),"customer_name"===e?j(t):"care_staff_name"===e&&S(t)},P=async e=>{if(j(e),e.trim().length<1){N([]),k(!1);return}try{let t=await fetch("/api/search-customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({searchTerm:e})});if(t.ok){let e=await t.json();N(e.data||[]),k(!0)}}catch(e){console.error("客戶搜尋失敗:",e)}},E=e=>{T("customer_name",e.customer_name),T("customer_id",e.customer_id||""),T("phone",e.phone||""),T("service_address",e.service_address||""),j(e.customer_name),k(!1)},B=async e=>{if(S(e),e.trim().length<1){D([]),F(!1);return}try{let t=await fetch("/api/search-care-staff",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({searchTerm:e})});if(t.ok){let e=await t.json();D(e.data||[]),F(!0)}}catch(e){console.error("護理人員搜尋失敗:",e)}},H=e=>{T("care_staff_name",e.name_chinese),S(e.name_chinese),F(!1)};return e?s.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:(0,s.jsxs)("div",{className:"bg-bg-primary rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden",children:[(0,s.jsxs)("div",{className:"p-6 border-b border-border-light",children:[s.jsx("h3",{className:"text-lg font-medium text-text-primary",children:x?`編輯排班 - ${x.service_date}`:L?`批量新增排班 (${l.length} 天)`:`新增排班 - ${r}`}),L&&(0,s.jsxs)("div",{className:"mt-2 text-sm text-text-secondary",children:["選定日期：",l.sort().join(", ")]})]}),s.jsx("div",{className:"p-6 overflow-y-auto max-h-[calc(90vh-200px)]",children:(0,s.jsxs)("form",{onSubmit:O,className:"space-y-6",children:[x&&s.jsx("div",{className:"card-apple border border-border-light",children:(0,s.jsxs)("div",{className:"p-6",children:[s.jsx("h4",{className:"text-apple-heading text-text-primary mb-4",children:"服務日期"}),(0,s.jsxs)("div",{children:[(0,s.jsxs)("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:["日期 ",s.jsx("span",{className:"text-danger",children:"*"})]}),s.jsx("input",{type:"date",value:p.service_date,onChange:e=>T("service_date",e.target.value),className:`form-input-apple w-full ${v.service_date?"border-danger":""}`,required:!0}),v.service_date&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.service_date})]})]})}),s.jsx("div",{className:"card-apple border border-border-light",children:(0,s.jsxs)("div",{className:"p-6",children:[s.jsx("h4",{className:"text-apple-heading text-text-primary mb-4",children:"客戶基本資料"}),(0,s.jsxs)("div",{className:"space-y-4",children:[(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,s.jsxs)("div",{children:[(0,s.jsxs)("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:["服務類型 ",s.jsx("span",{className:"text-danger",children:"*"})]}),(0,s.jsxs)("select",{value:p.service_type,onChange:e=>T("service_type",e.target.value),className:`form-input-apple w-full ${v.service_type?"border-danger":""}`,required:!0,children:[s.jsx("option",{value:"",children:"請選擇服務類型"}),i.map(e=>s.jsx("option",{value:e.value,children:e.label},e.value))]}),v.service_type&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.service_type})]}),(0,s.jsxs)("div",{children:[(0,s.jsxs)("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:["項目分類 ",s.jsx("span",{className:"text-danger",children:"*"})]}),(0,s.jsxs)("select",{value:p.project_category,onChange:e=>T("project_category",e.target.value),className:`form-input-apple w-full ${v.project_category?"border-danger":""}`,required:!0,children:[s.jsx("option",{value:"",children:"請選擇項目分類"}),o.map(e=>s.jsx("option",{value:e.value,children:e.label},e.value))]}),v.project_category&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.project_category})]})]}),(0,s.jsxs)("div",{children:[(0,s.jsxs)("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:["項目負責人 ",s.jsx("span",{className:"text-danger",children:"*"})]}),(0,s.jsxs)("select",{value:p.project_manager,onChange:e=>T("project_manager",e.target.value),className:`form-input-apple w-full ${v.project_manager?"border-danger":""}`,required:!0,children:[s.jsx("option",{value:"",children:"請選擇項目負責人"}),d.map(e=>s.jsx("option",{value:e.value,children:e.label},e.value))]}),v.project_manager&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.project_manager})]}),(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,s.jsxs)("div",{className:"relative",children:[(0,s.jsxs)("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:["客戶姓名 ",s.jsx("span",{className:"text-danger",children:"*"})]}),s.jsx("input",{type:"text",value:y,onChange:e=>{let t=e.target.value;j(t),T("customer_name",t),t.length>=1?P(t):k(!1)},className:`form-input-apple w-full ${v.customer_name?"border-danger":""}`,placeholder:"請輸入客戶姓名或編號（≥1字元）",autoComplete:"off",required:!0}),w&&_.length>0&&s.jsx("div",{className:"absolute z-10 w-full mt-1 bg-bg-primary border border-border-light rounded-lg shadow-lg max-h-48 overflow-y-auto",children:_.map((e,t)=>(0,s.jsxs)("div",{onClick:()=>E(e),className:"px-4 py-2 hover:bg-bg-secondary cursor-pointer border-b border-border-light last:border-b-0",children:[(0,s.jsxs)("div",{className:"font-medium text-text-primary",children:[e.customer_name,e.customer_id&&(0,s.jsxs)("span",{className:"text-text-secondary ml-1",children:["（",e.customer_id,"）"]})]}),e.phone&&s.jsx("div",{className:"text-sm text-text-secondary",children:e.phone}),e.service_address&&s.jsx("div",{className:"text-sm text-text-secondary truncate",children:e.service_address})]},e.customer_id||t))}),v.customer_name&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.customer_name})]}),(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:"客戶編號"}),s.jsx("input",{type:"text",value:p.customer_id||"",readOnly:!0,className:"form-input-apple w-full bg-bg-secondary text-text-secondary cursor-not-allowed",placeholder:"選擇客戶後自動填入"})]})]}),(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:"聯絡電話"}),s.jsx("input",{type:"tel",value:p.phone,readOnly:!0,className:"form-input-apple w-full bg-bg-secondary text-text-secondary cursor-not-allowed",placeholder:"選擇客戶後自動填入"})]}),(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:"服務地址"}),s.jsx("input",{type:"text",value:p.service_address,onChange:e=>T("service_address",e.target.value),className:`form-input-apple w-full ${v.service_address?"border-danger":""}`,placeholder:"請輸入服務地址"}),v.service_address&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.service_address})]})]})]})]})}),s.jsx("div",{className:"card-apple border border-border-light",children:(0,s.jsxs)("div",{className:"p-6",children:[s.jsx("h4",{className:"text-apple-heading text-text-primary mb-4",children:"服務詳情"}),(0,s.jsxs)("div",{className:"space-y-4",children:[(0,s.jsxs)("div",{className:"relative",children:[s.jsx("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:"護理人員"}),s.jsx("input",{type:"text",value:$,onChange:e=>{let t=e.target.value;S(t),T("care_staff_name",t),t.length>=1?B(t):F(!1)},className:`form-input-apple w-full ${v.care_staff_name?"border-danger":""}`,placeholder:"輸入護理人員中文姓名或編號（≥1字元）",autoComplete:"off"}),M&&C.length>0&&s.jsx("div",{className:"absolute z-10 w-full mt-1 bg-bg-primary border border-border-light rounded-lg shadow-lg max-h-48 overflow-y-auto",children:C.map((e,t)=>s.jsx("div",{onClick:()=>H(e),className:"px-4 py-2 hover:bg-bg-secondary cursor-pointer border-b border-border-light last:border-b-0",children:(0,s.jsxs)("div",{className:"font-medium text-text-primary",children:[e.name_chinese,e.staff_id&&(0,s.jsxs)("span",{className:"text-text-secondary ml-1",children:["（",e.staff_id,"）"]})]})},e.staff_id||t))}),v.care_staff_name&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.care_staff_name})]}),(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:"開始時間"}),s.jsx("input",{type:"time",value:p.start_time,onChange:e=>T("start_time",e.target.value),className:"form-input-apple w-full",step:"1800"})]}),(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:"結束時間"}),s.jsx("input",{type:"time",value:p.end_time,onChange:e=>T("end_time",e.target.value),className:`form-input-apple w-full ${v.end_time?"border-danger":""}`,step:"1800"}),v.end_time&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.end_time})]})]}),(0,s.jsxs)("div",{children:[(0,s.jsxs)("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:["服務時數 ",s.jsx("span",{className:"text-danger",children:"*"})]}),s.jsx("input",{type:"number",value:p.service_hours||"",onChange:e=>T("service_hours",parseFloat(e.target.value)||0),className:`form-input-apple w-full ${v.service_hours?"border-danger":""}`,placeholder:"請輸入服務時數",step:"0.5",min:"0",required:!0}),v.service_hours&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.service_hours}),s.jsx("p",{className:"text-apple-caption text-text-secondary mt-1",children:"填入開始/結束時間後會自動計算，也可手動輸入"})]})]})]})}),s.jsx("div",{className:"card-apple border border-border-light",children:(0,s.jsxs)("div",{className:"p-6",children:[s.jsx("h4",{className:"text-apple-heading text-text-primary mb-4",children:"收費與工資"}),(0,s.jsxs)("div",{className:"space-y-4",children:[(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,s.jsxs)("div",{children:[(0,s.jsxs)("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:["服務費用 ",s.jsx("span",{className:"text-danger",children:"*"})]}),s.jsx("input",{type:"number",value:p.service_fee||"",onChange:e=>T("service_fee",parseFloat(e.target.value)||0),className:`form-input-apple w-full ${v.service_fee?"border-danger":""}`,placeholder:"請輸入服務費用",min:"0",step:"0.01",required:!0}),v.service_fee&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.service_fee})]}),(0,s.jsxs)("div",{children:[(0,s.jsxs)("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:["員工薪資 ",s.jsx("span",{className:"text-danger",children:"*"})]}),s.jsx("input",{type:"number",value:p.staff_salary||"",onChange:e=>T("staff_salary",parseFloat(e.target.value)||0),className:`form-input-apple w-full ${v.staff_salary?"border-danger":""}`,placeholder:"請輸入員工薪資",min:"0",max:p.service_fee||void 0,step:"0.01",required:!0}),v.staff_salary&&s.jsx("p",{className:"text-apple-caption text-danger mt-1",children:v.staff_salary}),s.jsx("p",{className:"text-apple-caption text-text-secondary mt-1",children:"員工薪資不能超過服務費用"})]})]}),(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:"每小時收費"}),s.jsx("input",{type:"number",value:p.hourly_rate.toFixed(2),readOnly:!0,className:"form-input-apple w-full bg-bg-secondary text-text-secondary cursor-not-allowed",placeholder:"自動計算"}),s.jsx("p",{className:"text-apple-caption text-text-secondary mt-1",children:"自動計算：服務費用 \xf7 服務時數"})]}),(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-apple-caption font-medium text-text-primary mb-2",children:"每小時薪資"}),s.jsx("input",{type:"number",value:p.hourly_salary.toFixed(2),readOnly:!0,className:"form-input-apple w-full bg-bg-secondary text-text-secondary cursor-not-allowed",placeholder:"自動計算"}),s.jsx("p",{className:"text-apple-caption text-text-secondary mt-1",children:"自動計算：員工薪資 \xf7 服務時數"})]})]}),(0,s.jsxs)("div",{className:"bg-green-50 border border-green-200 rounded-lg p-4",children:[(0,s.jsxs)("div",{className:"flex justify-between items-center",children:[s.jsx("label",{className:"text-apple-body font-medium text-green-800",children:"本次利潤"}),(0,s.jsxs)("div",{className:"text-apple-heading font-bold text-green-700",children:["$",((p.service_fee||0)-(p.staff_salary||0)).toFixed(2)]})]}),s.jsx("p",{className:"text-apple-caption text-green-600 mt-1",children:"計算公式：服務費用 - 員工薪資"})]}),(0,s.jsxs)("div",{className:"border-t border-border-light pt-4",children:[s.jsx("h5",{className:"text-apple-body font-medium text-text-primary mb-2",children:"費用摘要"}),(0,s.jsxs)("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4 text-sm",children:[(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("div",{className:"text-text-secondary",children:"服務費用"}),(0,s.jsxs)("div",{className:"font-medium text-text-primary",children:["$",(p.service_fee||0).toFixed(2)]})]}),(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("div",{className:"text-text-secondary",children:"員工薪資"}),(0,s.jsxs)("div",{className:"font-medium text-text-primary",children:["$",(p.staff_salary||0).toFixed(2)]})]}),(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("div",{className:"text-text-secondary",children:"利潤率"}),s.jsx("div",{className:"font-medium text-text-primary",children:(p.service_fee||0)>0?`${(((p.service_fee||0)-(p.staff_salary||0))/(p.service_fee||1)*100).toFixed(1)}%`:"0%"})]}),(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("div",{className:"text-text-secondary",children:"服務時數"}),(0,s.jsxs)("div",{className:"font-medium text-text-primary",children:[p.service_hours,"小時"]})]})]})]})]})]})})]})}),s.jsx("div",{className:"p-6 border-t border-border-light bg-bg-secondary",children:(0,s.jsxs)("div",{className:"flex justify-between",children:[s.jsx("div",{children:x&&c&&s.jsx("button",{type:"button",onClick:async()=>{if(confirm("確定要刪除這筆記錄嗎？此操作無法復原。"))try{await c(x.id),t()}catch(e){console.error("刪除失敗:",e),alert("刪除失敗，請稍後再試")}},disabled:g,className:"px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50",children:g?"刪除中...":"刪除"})}),(0,s.jsxs)("div",{className:"flex gap-3",children:[s.jsx("button",{type:"button",onClick:t,className:"px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-bg-primary transition-all duration-200",disabled:g,children:"取消"}),s.jsx("button",{type:"submit",onClick:O,disabled:g,className:"px-4 py-2 bg-mingcare-blue text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50",children:g?"處理中...":x?"儲存修改":L?"批量新增":"新增排班"})]})]})})]})}):null}function _({isOpen:e,schedule:t,onClose:r,onUpdate:a,onDelete:l,onEdit:n}){return e&&t?s.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:(0,s.jsxs)("div",{className:"bg-bg-primary rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden",children:[(0,s.jsxs)("div",{className:"p-6 border-b border-border-light",children:[s.jsx("h3",{className:"text-lg font-medium text-text-primary",children:"排程選項"}),s.jsx("p",{className:"text-sm text-text-secondary mt-1",children:"選擇要對此排程執行的操作"})]}),(0,s.jsxs)("div",{className:"p-6",children:[(0,s.jsxs)("div",{className:"bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6",children:[(0,s.jsxs)("div",{className:"text-sm text-gray-600 mb-2",children:[s.jsx("strong",{children:"日期："})," ",t.service_date]}),(0,s.jsxs)("div",{className:"text-sm text-gray-600 mb-2",children:[s.jsx("strong",{children:"客戶："})," ",t.customer_name]}),(0,s.jsxs)("div",{className:"text-sm text-gray-600 mb-2",children:[s.jsx("strong",{children:"護理人員："})," ",t.care_staff_name]}),(0,s.jsxs)("div",{className:"text-sm text-gray-600 mb-2",children:[s.jsx("strong",{children:"服務類型："})," ",t.service_type]}),(0,s.jsxs)("div",{className:"text-sm text-gray-600",children:[s.jsx("strong",{children:"時間："})," ",t.start_time," - ",t.end_time]})]}),(0,s.jsxs)("div",{className:"space-y-3",children:[s.jsx("button",{onClick:n,className:"w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left",children:(0,s.jsxs)("div",{className:"flex items-center",children:[s.jsx("svg",{className:"w-5 h-5 mr-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"})}),"編輯排程"]})}),s.jsx("button",{onClick:()=>{confirm("確定要刪除這個排程嗎？")&&l()},className:"w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-left",children:(0,s.jsxs)("div",{className:"flex items-center",children:[s.jsx("svg",{className:"w-5 h-5 mr-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"})}),"刪除排程"]})})]})]}),s.jsx("div",{className:"p-6 border-t border-border-light bg-bg-secondary",children:s.jsx("button",{onClick:r,className:"w-full px-4 py-2 text-text-secondary border border-border-light rounded-lg hover:bg-bg-primary transition-all duration-200",children:"取消"})})]})}):null}},5442:(e,t,r)=>{"use strict";r.d(t,{O:()=>s});let s=(0,r(5623).AY)("https://cvkxlvdicympakfecgvv.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjkxODEsImV4cCI6MjA2NzAwNTE4MX0.jp2fPKcBcG4-042UoN3OieR553WAgABhJIujiDJAt-I")},1506:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>i,metadata:()=>n});var s=r(9510),a=r(5384),l=r.n(a);r(7272);let n={title:"明家居家護理服務 - Intranet",description:"明家居家護理服務內部管理系統"};function i({children:e}){return s.jsx("html",{lang:"zh-TW",children:s.jsx("body",{className:l().className,children:e})})}},4539:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>s});let s=(0,r(8570).createProxy)(String.raw`/Users/joecheung/Documents/GitHub/mingcare-intranet/app/services/page.tsx#default`)},4998:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>a});var s=r(6621);let a=e=>[{type:"image/png",sizes:"987x286",url:(0,s.fillMetadataSegment)(".",e.params,"icon.png")+"?ce74063d6acc4f04"}]},7272:()=>{}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[948,892,830],()=>r(9489));module.exports=s})();