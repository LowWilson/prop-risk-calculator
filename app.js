const CONTRACTS={MGC:{tick:.1,tickValue:1,point:10,decimals:1,entry:"例 3400.0",sl:"例 3395.0"},MNQ:{tick:.25,tickValue:.5,point:2,decimals:2,entry:"例 23100.00",sl:"例 23050.00"},MYM:{tick:1,tickValue:.5,point:.5,decimals:0,entry:"例 44500",sl:"例 44450"}};
const $=id=>document.getElementById(id);
const entry=$("entryPrice"),sl=$("slPrice"),tp=$("tpPrice"),qty=$("contracts"),rr=$("rrTarget");
let symbol=localStorage.getItem("riskOneSymbol")||"MGC",lastEdited="rr",updating=false;
const num=v=>{const s=String(v).replace(/,/g,"").trim();return s===""?null:Number.isFinite(Number(s))?Number(s):null};
const money=v=>v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const compact=(v,d=2)=>v.toLocaleString("en-US",{maximumFractionDigits:d});
function clearResults(msg="EntryとStop Lossを入力してください"){
 $("riskValue").textContent="—";$("riskOne").textContent="—";$("slDistance").textContent="—";$("ticks").textContent="—";$("rewardValue").textContent="$—";$("rewardOne").textContent="—";$("tpDistance").textContent="—";$("actualRr").textContent="—";$("direction").textContent="—";$("resultHint").textContent=msg;
}
function calculate(){
 if(updating)return;
 const c=CONTRACTS[symbol],e=num(entry.value),s=num(sl.value),q=Math.floor(num(qty.value)??1),r=num(rr.value);let t=num(tp.value);
 if(e===null||s===null){clearResults();return}
 const riskDist=Math.abs(e-s);
 if(e<0||s<0||q<1||riskDist===0){clearResults("価格と枚数を確認してください");return}
 const isLong=s<e,direction=isLong?"LONG":"SHORT",riskOne=riskDist*c.point,totalRisk=riskOne*q;
 if(lastEdited==="rr"&&r!==null&&r>0){t=isLong?e+riskDist*r:e-riskDist*r;updating=true;tp.value=t.toFixed(c.decimals);updating=false}
 $("riskValue").textContent=money(totalRisk);$("riskOne").textContent="$"+money(riskOne);$("slDistance").textContent=compact(riskDist,4)+" pt";$("ticks").textContent=compact(riskDist/c.tick,2);$("direction").textContent=direction;$("resultHint").textContent=q+"枚・"+direction+"想定";
 if(t===null){$("rewardValue").textContent="$—";$("rewardOne").textContent="—";$("tpDistance").textContent="—";$("actualRr").textContent="—";return}
 if((isLong&&t<=e)||(!isLong&&t>=e)){$("resultHint").textContent=direction+"のTP位置を確認してください";$("rewardValue").textContent="$—";$("rewardOne").textContent="—";$("tpDistance").textContent="—";$("actualRr").textContent="—";return}
 const rewardDist=Math.abs(t-e),rewardOne=rewardDist*c.point,totalReward=rewardOne*q,actual=rewardDist/riskDist;
 $("rewardValue").textContent="$"+money(totalReward);$("rewardOne").textContent="$"+money(rewardOne);$("tpDistance").textContent=compact(rewardDist,4)+" pt";$("actualRr").textContent="1:"+compact(actual,2);
 if(lastEdited==="tp"){updating=true;rr.value=compact(actual,2);updating=false}
}
function setSymbol(s){symbol=s;localStorage.setItem("riskOneSymbol",s);const c=CONTRACTS[s];document.querySelectorAll(".symbol").forEach(b=>b.classList.toggle("active",b.dataset.symbol===s));entry.placeholder=c.entry;sl.placeholder=c.sl;$("infoSymbol").textContent=s;$("infoDescription").textContent=`1 point = $${c.point.toFixed(2)} / 1 tick = $${c.tickValue.toFixed(2)}`;calculate()}
document.querySelectorAll(".symbol").forEach(b=>b.onclick=()=>setSymbol(b.dataset.symbol));
[entry,sl,qty].forEach(i=>i.addEventListener("input",calculate));
rr.addEventListener("input",()=>{lastEdited="rr";calculate()});
tp.addEventListener("input",()=>{lastEdited="tp";calculate()});
$("resetButton").onclick=()=>{entry.value="";sl.value="";tp.value="";rr.value="";qty.value="1";lastEdited="rr";calculate();entry.focus()};
function online(){const on=navigator.onLine;$("offlineStatus").classList.toggle("offline",!on);$("statusText").textContent=on?"ONLINE":"OFFLINE"}
addEventListener("online",online);addEventListener("offline",online);setSymbol(symbol);online();
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
