import{_ as x,r as d,c as t,d as e,e as w,w as I,F as r,i as c,h as S,f as B,o as s,t as a,j as f,n as M}from"./index-CMPut0DN.js";const N={class:"container mt-5"},V={class:"d-flex justify-content-between align-items-center"},C={class:"table"},j={key:0},A={key:1},G={key:0},L={key:1},E={id:"vehicle-status",class:"mt-5"},F={class:"d-flex gap-5 justify-content-center align-items-center flex-wrap"},z=["src"],D={__name:"GeneralView",setup(T){const v=d([{customerId:"G2200756",customerName:"捷乘交通有限公司",vat_number:"75939529",company_tel:"02-12345678",fax_number:"02-12341234",contact_name:"陳經理",contact_tel:"0909-123456",auditor_name:"林經理",auditor_phone:"02-11112222",email:"test@gmail.com",delivery_address:"900屏東縣屏東市迪化街29號",Insufficient_Balance_SMS:!1,subsidiary:[{vat_number:"11111111",name:"測試子公司一"},{vat_number:"22222222",name:"測試子公司二"}]}]);function b(u){return{customerId:"客戶編號",customerName:"客戶名稱",vat_number:"統一編號",company_tel:"公司電話",fax_number:"傳真電話",contact_name:"承辦窗口",contact_tel:"承辦電話",auditor_name:"帳務窗口",auditor_phone:"帳務電話",email:"E-MAIL",delivery_address:"郵寄地址",Insufficient_Balance_SMS:"餘額不足通知",subsidiary:"分公司使用單位/統編"}[u]||u}const m=d([{status_des:"申請中油車隊卡",icon_path:"./vehicle_status/1.png"},{status_des:"送出申請中油車隊卡",icon_path:"./vehicle_status/2.png"},{status_des:"中油車隊卡製卡中",icon_path:"./vehicle_status/3.png"},{status_des:"中油清點中油車隊卡",icon_path:"./vehicle_status/4.png"},{status_des:"鉅泰寄出中油車隊卡",icon_path:"./vehicle_status/5.png"},{status_des:"掛號單號查詢",icon_path:"./vehicle_status/6.png"}]),p=d(Math.floor(Math.random()*m.value.length));function g(){sessionStorage.removeItem("token"),S.push("/login")}return(u,n)=>{const y=B("router-link");return s(),t("div",N,[e("div",V,[w(y,{to:"/"},{default:I(()=>n[0]||(n[0]=[e("button",{class:"btn btn-outline-warning mb-2"},"回首頁",-1)])),_:1}),e("button",{class:"btn btn-outline-warning",onClick:g},"登出")]),e("table",C,[(s(!0),t(r,null,c(v.value,(l,o)=>(s(),t("tbody",{key:o},[(s(!0),t(r,null,c(l,(i,_)=>(s(),t("tr",{key:_},[e("td",null,a(b(_)),1),e("td",null,[Array.isArray(i)?(s(),t("span",j,[e("ul",null,[(s(!0),t(r,null,c(i,(h,k)=>(s(),t("li",{key:k},[f(" 統編："+a(h.vat_number)+" ",1),n[1]||(n[1]=e("br",null,null,-1)),f(" "+a(h.name),1)]))),128))])])):(s(),t("span",A,[_==="Insufficient_Balance_SMS"?(s(),t("span",G,a(i?"是":"否"),1)):(s(),t("span",L,a(i),1))]))])]))),128))]))),128))]),n[2]||(n[2]=e("h2",null,"車籍異動狀態",-1)),e("div",E,[e("ul",F,[(s(!0),t(r,null,c(m.value,(l,o)=>(s(),t("li",{key:o,class:M([{"opacity-100":o===p.value,"opacity-50":o!==p.value},"d-flex flex-column align-items-center position-relative"])},[e("img",{class:"vehicle-status-img",src:l.icon_path,alt:"vehicle-status"},null,8,z),e("p",null,a(l.status_des),1)],2))),128))])])])}}},H=x(D,[["__scopeId","data-v-1568be62"]]);export{H as default};
