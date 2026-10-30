const CONTRACTS={MGC:{tick:.1,tickValue:1,point:10,decimals:1},MNQ:{tick:.25,tickValue:.5,point:2,decimals:2},MYM:{tick:1,tickValue:.5,point:.5,decimals:0}};
const $=id=>document.getElementById(id);
const entry=$("entryPrice"),sl=$("slPrice"),tp=$("tpPrice"),qty=$("contracts"),rr=$("rrTarget");
const STORAGE_KEY="riskOneInputsBySymbol";
let symbol=localStorage.getItem("riskOneSymbol")||"MGC",lastEdited="rr",updating=false;
let inputMode=localStorage.getItem("riskOneInputMode")==="points"?"points":"price";
const inputKey=()=>inputMode==="price"?symbol:symbol+":points";
function savedInputs(){
 try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));return saved&&typeof saved==="object"?saved:{}}
 catch{localStorage.removeItem(STORAGE_KEY);return{}}
}
function saveInputs(){const saved=savedInputs();saved[inputKey()]={entry:entry.value,sl:sl.value,tp:tp.value,qty:qty.value,rr:rr.value,lastEdited};localStorage.setItem(STORAGE_KEY,JSON.stringify(saved))}
function restoreInputs(){
 const saved=savedInputs()[inputKey()]||{};
 entry.value=typeof saved.entry==="string"?saved.entry:"";
 sl.value=typeof saved.sl==="string"?saved.sl:"";
 tp.value=typeof saved.tp==="string"?saved.tp:"";
 qty.value=typeof saved.qty==="string"?saved.qty:"1";
 rr.value=typeof saved.rr==="string"?saved.rr:"";
 lastEdited=saved.lastEdited==="tp"?"tp":"rr";
}
const MARKET_KEY="riskOneVisibleMarkets";
function loadVisibleMarkets(){
 try{
  const saved=JSON.parse(localStorage.getItem(MARKET_KEY));
  const valid=Array.isArray(saved)?Object.keys(CONTRACTS).filter(s=>saved.includes(s)):[];
  return valid.length?valid:Object.keys(CONTRACTS);
 }catch{return Object.keys(CONTRACTS)}
}
let visibleMarkets=loadVisibleMarkets();
if(!visibleMarkets.includes(symbol))symbol=visibleMarkets[0];
function renderMarkets(){
 document.querySelectorAll(".symbol").forEach(b=>{b.hidden=!visibleMarkets.includes(b.dataset.symbol)});
 document.querySelectorAll("[data-market]").forEach(input=>{input.checked=visibleMarkets.includes(input.dataset.market)});
}
document.querySelectorAll("[data-market]").forEach(input=>input.addEventListener("change",()=>{
 const next=Array.from(document.querySelectorAll("[data-market]")).filter(i=>i.checked).map(i=>i.dataset.market);
 if(!next.length){input.checked=true;$("marketHint").textContent="最低1銘柄は表示してください。";return}
 visibleMarkets=next;
 localStorage.setItem(MARKET_KEY,JSON.stringify(visibleMarkets));
 if(!visibleMarkets.includes(symbol))setSymbol(visibleMarkets[0]);
 renderMarkets();
 $("marketHint").textContent="表示銘柄を保存しました。";
}));
renderMarkets();
const num=v=>{
 const s=String(v)
  .replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0))
  .replace(/[．。]/g,".")
  .replace(/[，、,]/g,"")
  .replace(/[－−ー]/g,"-")
  .trim();
 return s===""?null:Number.isFinite(Number(s))?Number(s):null;
};
const money=v=>v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const compact=(v,d=2)=>v.toLocaleString("en-US",{maximumFractionDigits:d});
function clearResults(msg="EntryとStop Lossを入力してください"){
 $("riskValue").textContent="—";$("riskOne").textContent="—";$("slDistance").textContent="—";$("ticks").textContent="—";$("rewardValue").textContent="$—";$("rewardOne").textContent="—";$("tpDistance").textContent="—";$("actualRr").textContent="—";$("direction").textContent="—";$("resultHint").textContent=msg;
}
function renderMode(){
 const points=inputMode==="points",c=CONTRACTS[symbol];
 $("entryField").hidden=points;
 $("slLabel").textContent=points?"損切り幅（pt）":"Stop Loss価格";
 $("tpLabel").textContent=points?"利確幅（pt）":"Take Profit価格";
 document.querySelectorAll('[name="inputMode"]').forEach(i=>{i.checked=i.value===inputMode});
}
document.querySelectorAll('[name="inputMode"]').forEach(i=>i.addEventListener("change",()=>{
 if(!i.checked||i.value===inputMode)return;
 saveInputs();inputMode=i.value;localStorage.setItem("riskOneInputMode",inputMode);
 restoreInputs();renderMode();calculate();
}));
function calculatePoints(){
 const c=CONTRACTS[symbol],distance=num(sl.value),q=Math.floor(num(qty.value)??1),r=num(rr.value);
 let target=num(tp.value);
 clearResults("損切り幅または利確幅（pt）を入力してください");
 if(q<1){$("resultHint").textContent="枚数は1以上を入力してください";return}
 const hasRisk=distance!==null&&distance>0;
 if(lastEdited==="rr"){
  target=hasRisk&&r!==null&&r>0?Number((distance*r).toFixed(8)):null;
  tp.value=target===null?"":String(target);
 }
 const hasReward=target!==null&&target>0;
 if(hasRisk){
  $("riskValue").textContent=money(distance*c.point*q);
  $("riskOne").textContent="$"+money(distance*c.point);
  $("slDistance").textContent=compact(distance,4)+" pt";
  $("ticks").textContent=compact(distance/c.tick,2);
 }
 if(hasReward){
  $("rewardValue").textContent="$"+money(target*c.point*q);
  $("rewardOne").textContent="$"+money(target*c.point);
  $("tpDistance").textContent=compact(target,4)+" pt";
 }
 if(hasRisk&&hasReward){
  $("actualRr").textContent="1:"+compact(target/distance,2);
  if(lastEdited==="tp")rr.value=compact(target/distance,2);
 }else if(lastEdited==="tp")rr.value="";
 if(hasRisk||hasReward)$("resultHint").textContent=q+"枚・ポイント幅で計算";
 if(distance!==null&&!hasRisk)$("resultHint").textContent="損切り幅は0より大きい値を入力してください";
 if(target!==null&&!hasReward)$("resultHint").textContent="利確幅は0より大きい値を入力してください";
}

function calculate(){
 if(updating)return;
 if(inputMode==="points"){calculatePoints();return;}
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
function setSymbol(s){if(s!==symbol)saveInputs();symbol=s;localStorage.setItem("riskOneSymbol",s);restoreInputs();const c=CONTRACTS[s];document.querySelectorAll(".symbol").forEach(b=>b.classList.toggle("active",b.dataset.symbol===s));renderMode();$("infoSymbol").textContent=s;$("infoDescription").textContent=`1 point = $${c.point.toFixed(2)} / 1 tick = $${c.tickValue.toFixed(2)}`;calculate()}
document.querySelectorAll(".symbol").forEach(b=>b.onclick=()=>setSymbol(b.dataset.symbol));
[entry,sl,qty].forEach(i=>i.addEventListener("input",()=>{calculate();saveInputs()}));
rr.addEventListener("input",()=>{lastEdited="rr";calculate();saveInputs()});
tp.addEventListener("input",()=>{lastEdited="tp";calculate();saveInputs()});
$("resetButton").onclick=()=>{entry.value="";sl.value="";tp.value="";rr.value="";qty.value="1";lastEdited="rr";calculate();saveInputs();(inputMode==="points"?sl:entry).focus()};
function online(){const on=navigator.onLine;$("offlineStatus").classList.toggle("offline",!on);$("statusText").textContent=on?"ONLINE":"OFFLINE"}
addEventListener("online",online);addEventListener("offline",online);setSymbol(symbol);online();
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));

// Fit the complete calculator inside the viewport without scrolling.
{
 const shell=document.querySelector('.shell');
 const mobile=matchMedia('(max-width:640px)');
 let frame=0;
 function fitMobile(){
  frame=0;
  const availableHeight=window.visualViewport?window.visualViewport.height:window.innerHeight;
  const naturalHeight=Math.max(shell.offsetHeight,shell.scrollHeight);
  const availableWidth=window.visualViewport?window.visualViewport.width:window.innerWidth;
  const scale=Math.min(1,Math.max(0,availableHeight-2)/Math.max(1,naturalHeight),availableWidth/Math.max(1,shell.scrollWidth));
  shell.style.transform=`scale(${scale})`;
 }
 function scheduleFit(){if(!frame)frame=requestAnimationFrame(fitMobile)}
 new ResizeObserver(scheduleFit).observe(shell);
 addEventListener('resize',scheduleFit);
 mobile.addEventListener('change',scheduleFit);
 if(window.visualViewport)window.visualViewport.addEventListener('resize',scheduleFit);
 if(document.fonts)document.fonts.ready.then(scheduleFit);
 scheduleFit();
}
