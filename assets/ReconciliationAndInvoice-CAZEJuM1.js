import{e as r,g as w,i as C,c as l,b as d,w as Y,a as e,d as g,t as E,F as A,f as _,r as f,o as a}from"./index-DRg0NaTr.js";const k={class:"container mt-5"},M={class:"mt-4"},K=["href"],P=["href"],x={__name:"ReconciliationAndInvoice",setup(V){const i=new Date,B=i.getFullYear(),D=String(i.getMonth()+1).padStart(2,"0"),o=r(`${B}-${D}`),s=r(""),m=r([]),c=r([]);function u(){console.log(o.value),v(),m.value=[{name:"對帳單202407-0028日星交通事業有限公司.pdf",url:"https://ct9967.com.tw/oil/tmp_PDF/%E5%B0%8D%E5%B8%B3%E5%96%AE202407-0028%E6%97%A5%E6%98%9F%E4%BA%A4%E9%80%9A%E4%BA%8B%E6%A5%AD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8.pdf"},{name:"對帳單202407-0027日星交通事業有限公司.pdf",url:"https://ct9967.com.tw/oil/tmp_PDF/%E5%B0%8D%E5%B8%B3%E5%96%AE202407-0027%E6%97%A5%E6%98%9F%E4%BA%A4%E9%80%9A%E4%BA%8B%E6%A5%AD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8.pdf"},{name:"對帳單202407-0026日星交通事業有限公司.pdf",url:"https://ct9967.com.tw/oil/tmp_PDF/%E5%B0%8D%E5%B8%B3%E5%96%AE202407-0026%E6%97%A5%E6%98%9F%E4%BA%A4%E9%80%9A%E4%BA%8B%E6%A5%AD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8.pdf"}],c.value=[{name:"11308_DK6162226811308.pdf",url:"https://ct9967.com.tw/oil/tmp_PDF/11308_DK6162226811308.pdf"},{name:"11308_DK6162226911308.pdf",url:"https://ct9967.com.tw/oil/tmp_PDF/11308_DK6162226911308.pdf"},{name:"11308_DK6162226711308.pdf",url:"https://ct9967.com.tw/oil/tmp_PDF/11308_DK6162226711308.pdf"}]}function v(){o.value?s.value=o.value.split("-")[1]:s.value=""}return w(o,()=>{u()}),C(()=>{u()}),(b,t)=>{const h=f("router-link"),F=f("el-date-picker");return a(),l("div",k,[d(h,{to:"/"},{default:Y(()=>t[1]||(t[1]=[e("button",{class:"btn btn-outline-warning mb-2"},"回首頁",-1)])),_:1}),t[2]||(t[2]=e("p",null,"對帳單&發票查詢",-1)),t[3]||(t[3]=g(" 查詢帳戶月份： ")),d(F,{modelValue:o.value,"onUpdate:modelValue":t[0]||(t[0]=n=>o.value=n),type:"month",format:"YYYY-MM","value-format":"YYYY-MM",placeholder:"請選擇查詢帳戶月份",onChange:u},null,8,["modelValue"]),e("p",M,E(s.value)+"月份對帳單&發票檔案列表",1),t[4]||(t[4]=e("p",null,"對帳單：",-1)),e("ul",null,[(a(!0),l(A,null,_(m.value,(n,p)=>(a(),l("li",{key:p},[e("a",{href:n.url},E(n.name),9,K)]))),128))]),t[5]||(t[5]=e("p",null,"發票：",-1)),e("ul",null,[(a(!0),l(A,null,_(c.value,(n,p)=>(a(),l("li",{key:p},[e("a",{href:n.url},E(n.name),9,P)]))),128))])])}}};export{x as default};
