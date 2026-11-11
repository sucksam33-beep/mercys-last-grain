const regionalTemperatures=[
 // Typical daily mean and day/night amplitude in Celsius, in region order.
 [16,6],[19,5],[30,11],[13,8],[7,7],[24,5],[27,4],[-8,6]
];
const statusLandmarks=["산개울","운하","저수지","협곡 물가","고산 호수","하구 수로","바다","빙하 만"];

function regionalAirTemperature(region,hour,weather,severe){
 const [mean,amplitude]=regionalTemperatures[region];
 const daylight=Math.cos((hour-15)*Math.PI/12);
 return mean+amplitude*daylight*(1-weather.cover*.32)
  -2*weather.rain-3*severe.storm-5*severe.snow-severe.dust;
}

function temperatureBand(degrees){
 return degrees<12?"cold":degrees>=28?"hot":"mild";
}

function playerReputation(){
 const campaign=s.soilCampaign;
 if(campaign?.complete)return 1000;
 const completed=campaign?.history?.length??s.stage;
 const total=campaign?.step?Object.keys(SoilCampaign.episodes).length:story.length-1;
 const visited=regions.filter((_,index)=>(s.exploredRegions??1)&(1<<index)).length;
 return Math.min(999,1+Math.floor(894*completed/total)+15*Math.max(0,visited-1));
}

function playerLocality(){
 const {x,y:z}=player;
 const waterway=riverDist(x,z)<channelWidth(z)+8;
 const onCoastalWater=[5,6,7].includes(s.region)&&terrainSurface(x,z)<2.15;
 if(waterway||onCoastalWater)return statusLandmarks[s.region];
 let nearest=null,range=27;
 for(const place of actStops()){
  const distance=Math.hypot(x-place.x,z-place.y);
  if(distance<range){nearest=place;range=distance;}
 }
 return nearest?.name??r().area;
}

const coinIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5"/><circle cx="12" cy="12" r="8"/><path d="M12 18V6m0 8c-3 0-4-2-4-3 2 0 4 1 4 3Zm0-3c3 0 4-2 4-3-2 0-4 1-4 3Z"/></svg>`;
const coinFormatter=new Intl.NumberFormat('ko-KR');
function coinAmount(value,label="",compact=false){
 const amount=document.createElement("span");
 amount.className=compact?"status-purse coin-compact":"status-purse";
 amount.innerHTML=coinIcon;
 const number=document.createElement("span");number.className="coin-number";
 amount.append(number);
 updateCoinAmount(amount,value,label);
 return amount;
}
function updateCoinAmount(amount,value,label=""){
 const number=amount.querySelector(".coin-number"),text=coinFormatter.format(value);
 if(number.textContent===text)return;
 number.textContent=text;
 if(label){amount.setAttribute("role","img");amount.setAttribute("aria-label",label+" "+text);}
}

let playerStatus, playerLocation, statusOpen=false, statusSample=-Infinity;
function mountPlayerStatus(){
 playerStatus=document.createElement("aside");
 playerStatus.className="player-status";
 playerStatus.setAttribute("aria-label","플레이어 상태");
 playerStatus.innerHTML=`<div class="player-temperature" data-band="mild">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14.7V5a3 3 0 0 1 6 0v9.7a5 5 0 1 1-6 0Z"/><path d="M12 9v9"/><circle cx="12" cy="18" r="1.4"/></svg>
  <span data-status-temperature></span>
 </div>
 <div class="player-status-panel" hidden>
  <div class="player-status-heading" aria-hidden="true">상태</div>
  <dl>
  <div><dt>현재 시간</dt><dd data-status-time></dd></div>
  <div><dd data-status-purse></dd></div></dl>
  <div class="player-reputation" role="meter" aria-label="명성" aria-valuemin="1" aria-valuemax="1000">
   <svg viewBox="0 0 44 106" aria-hidden="true">
    <path class="reputation-frame" d="M22 2l12 10v78l-12 14-12-14V12Z"/>
    <path class="reputation-inlay" d="M22 5l9 8v75l-9 12-9-12V13Z M18 12l4-4 4 4m-8 81 4 4 4-4"/>
    <path class="reputation-ticks" d="M14 17h4m8 0h4M14 35h4m8 0h4M14 53h4m8 0h4M14 71h4m8 0h4M14 89h4m8 0h4"/>
    <path class="reputation-track" d="M22 17v72"/>
    <path class="reputation-fill" d="M22 89V17" pathLength="100"/>
    <path class="reputation-marker" d="M22 11l5 6-5 6-5-6Z"/>
   </svg>
   <span>명성</span><strong data-status-reputation></strong>
  </div>
 </div>`;
 playerLocation=document.createElement("aside");
 playerLocation.className="player-location";
 playerLocation.hidden=true;
 playerLocation.setAttribute("aria-label","현재 지역");
 playerLocation.innerHTML=`<span class="player-location-crest" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M10 1l9 9-9 9-9-9Z M5 12l3-4 2 2 2-3 3 5"/></svg></span>
  <strong data-status-region></strong><small data-status-locality></small>`;
 playerStatus.querySelector("[data-status-purse]").append(coinAmount(s.coins,"소지금"));
 scene.append(playerStatus,playerLocation);
}

function togglePlayerStatus(){
 statusOpen=!statusOpen;
 refreshPlayerStatus(true);
}

function refreshPlayerStatus(force=false){
 if(!playerStatus||!force&&simulationTime-statusSample<200)return;
 statusSample=simulationTime;
 s.exploredRegions=(s.exploredRegions??1)|(1<<s.region);
 if(opening.open||s.introPending)return;
 const weather=localWeather(s.region,simulationTime,s.day,s.hour);
 const severe=severeWeather(s.region,simulationTime,s.day,s.hour,playerSupport());
 const degrees=Math.round(regionalAirTemperature(s.region,s.hour,weather,severe));
 const band=temperatureBand(degrees);
 const temperature=playerStatus.querySelector(".player-temperature");
 temperature.dataset.band=band;
 const set=(field,value,container=playerStatus)=>{
  const node=container.querySelector(`[data-status-${field}]`);
  const text=displayText(value);
  if(node.textContent!==text)node.textContent=text;
 };
 set("temperature","기온 : "+{cold:"추움",hot:"더움",mild:"적당함"}[band]+" · "+degrees+"°C");
 playerStatus.querySelector(".player-status-panel").hidden=!statusOpen;
 playerLocation.hidden=!statusOpen;
 if(!statusOpen)return;
 set("region",r().name,playerLocation);
 set("locality",playerLocality(),playerLocation);
 set("time",worldTimeLabel());
 updateCoinAmount(playerStatus.querySelector("[data-status-purse] .status-purse"),s.coins,"소지금");
 const reputation=playerReputation();
 set("reputation",reputation.toLocaleString("ko-KR")+" / 1,000");
 const meter=playerStatus.querySelector(".player-reputation");
 meter.setAttribute("aria-valuenow",reputation);
 const fraction=(reputation-1)/999;
 meter.querySelector(".reputation-fill").setAttribute("stroke-dasharray",(fraction*100)+" 100");
 meter.querySelector(".reputation-marker").setAttribute("transform",`translate(0 ${72*(1-fraction)})`);
}
