import{_ as B,u as G,a as u,o as i,c as l,f as t,g as n,w as d,F as y,k as v,b as F,r as L,h as m,i as s,t as g}from"./index-CVTk_Qop.js";import{a as w}from"./apiServer-CD3olmFD.js";const D={class:"container mt-5"},E={class:"d-flex justify-content-between align-items-center"},M={class:"table"},q={__name:"GeneralView",setup(z){const c=G(),o=u({});async function h(){try{const a=await w.post("/main/searchCustomer",{cus_code:c.company_info.customerId});o.value.customerId=a.data.data[0].cus_code,o.value.customerName=a.data.data[0].company_title,o.value.vat_number=a.data.data[0].vat_number,o.value.company_tel=a.data.data[0].phone,o.value.fax_number=a.data.data[0].fax,o.value.delivery_address=a.data.data[0].mail_address}catch(a){console.error(a)}}i(()=>{h()});function C(a){return{customerId:"客戶代號",customerName:"客戶名稱",vat_number:"統一編號",company_tel:"公司電話",fax_number:"傳真電話",delivery_address:"郵寄地址"}[a]||a}const _=u([]);async function x(){try{const a=await w.post("/main/searchContact",{customerId:c.company_info.customerId});_.value=a.data.data.map(e=>({job_title:e.job_title,name:e.name,mobile:e.mobile,mail:e.mail}))}catch(a){console.error(a)}}i(()=>{x()});const p=u([]);async function I(){try{const a=await F.post("/main/accountGroup",{customerId:c.company_info.customerId});p.value=a.data.data.map(e=>({name:e.acc_name,vat_number:e.use_number}))}catch(a){console.error(a)}}i(()=>{I()});function k(){sessionStorage.clear(),L.push("/login")}return(a,e)=>{const S=m("router-link"),r=m("el-table-column"),b=m("el-table");return s(),l("div",D,[t("div",E,[n(S,{to:"/"},{default:d(()=>e[0]||(e[0]=[t("button",{class:"btn btn-yellow mb-2"},"回首頁",-1)])),_:1}),t("button",{class:"btn btn-yellow",onClick:k},"登出")]),t("table",M,[(s(!0),l(y,null,v([o.value],(j,N)=>(s(),l("tbody",{key:N},[(s(!0),l(y,null,v(j,(V,f)=>(s(),l("tr",{key:f},[t("td",null,g(C(f)),1),t("td",null,[t("span",null,g(V),1)])]))),128))]))),128))]),e[1]||(e[1]=t("hr",null,null,-1)),n(b,{data:_.value},{default:d(()=>[n(r,{align:"center",prop:"job_title",label:"職稱"}),n(r,{align:"center",prop:"name",label:"聯絡人姓名","min-width":"100"}),n(r,{align:"center",prop:"mobile",label:"聯絡人電話","min-width":"120"}),n(r,{align:"center",prop:"mail",label:"聯絡人信箱","min-width":"200"})]),_:1},8,["data"]),e[2]||(e[2]=t("hr",null,null,-1)),n(b,{data:p.value},{default:d(()=>[n(r,{align:"center",prop:"name",label:"分公司名稱","min-width":"140"}),n(r,{align:"center",prop:"vat_number",label:"統一編號"})]),_:1},8,["data"])])}}},J=B(q,[["__scopeId","data-v-4feaad00"]]);export{J as default};
