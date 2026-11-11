let soilRoster=[];
fetch("assets/residents/index.json").then(response=>response.json()).then(roster=>{soilRoster=roster;}).catch(console.error);
const soilSeed="심을 수 있는 아사기 볍씨";
function soilEpisode(){return SoilCampaign.episodes[s.soilCampaign?.step];}
function soilObjective(){
 const episode=soilEpisode();
 if(!episode)return s.soilCampaign?.complete?"첫 볍씨가 자라는 밭 돌보기":null;
 return (s.region===episode.region?"":SoilCampaign.regions[episode.region]+" · ")+episode.title;
}
function soilParagraph(parent,text){
 const p=document.createElement("p");p.textContent=text;parent.append(p);return p;
}
function soilLedger(){
 const c=s.soilCampaign;if(!c?.step)return;
 const body=modal("왕이 먹는 흙","보급 장부");
 for(const [i,name] of SoilCampaign.regions.entries())soilParagraph(body,name+" · 식량 "+c.food[i]+" / 씨앗 "+c.seed[i]+" / 비축 "+c.reserve[i]+" / 신뢰 "+c.trust[i]);
 soilParagraph(body,"가용 병력 "+c.troops+" · 부상 "+c.wounded+" · 군량 "+c.armyFood+" · 적재 "+c.cargo);
 if(c.warehouse)soilParagraph(body,"창고 재고 "+c.warehouse+" · 최대 운송 "+Math.min(c.cargo,c.warehouse));
 if(c.frost!==undefined)soilParagraph(body,"아사기 서리 피해 "+c.frost);
 if(c.losses.length)soilParagraph(body,"기록된 피해 · "+c.losses.join(", "));
 if(c.planted)soilParagraph(body,c.planted.plot+" · "+c.planted.crop);
}
function soilResidents(){
 const c=s.soilCampaign,i=s.region;
 if(!c?.step)return;
 const body=modal(SoilCampaign.regions[i],"주민과 현장 업무");
 for(const person of SoilCampaign.residentNames(soilRoster,i)){
  const duty=c.assignments[person.id];
  row(body,person.name,duty?"맡은 일 보기":"이야기",()=>{
   const conversation=modal(SoilCampaign.regions[i],person.name);
   const reflection={
    genzo:"땅부터 살펴. 걸어서 돌아올 길이 있으면 한 번 더 나갈 수 있다.",
    sae:"이름을 적어야 누가 밭에 나갈 수 있고 누가 쉬어야 하는지 보여요.",
    grandmother:"씨앗은 남겨 두어야 한다. 다음 봄에는 네가 고랑을 내라.",
    irena:"사람과 보급을 같은 장부에 적어도, 사람을 짐으로 볼 수는 없어요.",
    elise:"운하 창고의 표식을 확인했어요. 원래 어떤 집에 가던 자루인지도 남아 있어요.",
    renat:"시장 사람들은 장부에만 있는 게 아니오. 골목부터 같이 돌아봅시다.",
    mara:"저울의 추는 한 개인데, 어느 편이 서느냐에 따라 답이 달라지더군요."
   };
   soilParagraph(conversation,reflection[person.id]??(SoilCampaign.duties[i]+"은 제게 맡기세요. "+person.name+"으로 일하면서 이곳 사정을 배웠어요."));
   if(duty){soilParagraph(conversation,"현재 배정 · "+duty);return;}
   if(person.id==="grandmother"||c.complete||c.act>3)return;
   button(conversation,SoilCampaign.duties[i]+" 맡기기",()=>{
    if(c!==s.soilCampaign||c.assignments[person.id])return;
    const next=structuredClone(c);next.assignments[person.id]=SoilCampaign.duties[i];
    next.trust[i]++;s.soilCampaign=next;
    log(person.name+" · "+SoilCampaign.duties[i]+" 배정. 지역 신뢰 +1.");
    render();soilResidents();
   });
  });
 }
}
function soilMission(){
 const c=s.soilCampaign, episode=soilEpisode();
 if(!episode||episode.region!==s.region)return;
 const body=modal(c.act<=4?c.act+"막":"늦겨울",episode.title);
 soilParagraph(body,episode.speaker+" · “"+episode.line+"”");
 soilParagraph(body,"민간 식량 "+c.food[s.region]+" · 씨앗 "+c.seed[s.region]+" · 군량 "+c.armyFood+" · 병력 "+c.troops+" · 부상 "+c.wounded);
 if(c.step==="blockade")soilParagraph(body,"봉쇄 3일차 · 적 준비도 "+c.enemy+" · 시장 피란로 "+(c.routes[1]?"확보":"미확보"));
 if(c.step==="snow")soilParagraph(body,"적재 공간 "+c.cargo+" · 주니퍼웰 대피소 "+(c.shelters[3]?"준비됨":"미준비"));
 if(c.step==="sealed")soilParagraph(body,"서리 피해 "+c.frost+" · 지휘권 "+c.command+" · "+c.squad.join(", "));
 if(c.step==="grave"&&c.losses.length)soilParagraph(body,"묘지 기록 · "+c.losses.join(", "));
 const game={home:Boolean(house()),pond:Boolean(s.ponds[0])};
 function commit(option,quantities){
  if(c!==s.soilCampaign||s.region!==episode.region)return;
  if(c.step==="plant"&&count(soilSeed)<1){soilParagraph(body,"가방에 심을 수 있는 볍씨가 없습니다.");return;}
  let next;
  try{next=SoilCampaign.advance(c,option,game,quantities);}catch(error){soilParagraph(body,error.message);return;}
  const completed=c.step;
  s.soilCampaign=next;
  if(completed==="grave")give(soilSeed);
  if(completed==="plant"){give(soilSeed,-1);loadedScene="";next.planted.day=s.day;}
  if(["meal","blockade","snow","mara","sealed"].includes(completed))advanceWorldTime(completed==="blockade"?next.siegeDay*24:24);
  if(completed==="raid")loadedScene="";
  if(completed==="guard")s.asagiFirstWalk=false;
  $("dialog").close();
  const report="식량 "+next.food[s.region]+" · 씨앗 "+next.seed[s.region]+" · 병력 "+next.troops+" · 부상 "+next.wounded;
  log((next.complete?"첫 볍씨를 심었다. ":episode.title+" 완료. ")+report);
  render();
  if(soilObjective())questSubtitle("왕이 먹는 흙",soilObjective());
 }
 if(c.step==="distribute"){
  soilParagraph(body,"창고 "+c.warehouse+" · 적재 한도 "+c.cargo);
  const inputs=["아사기 민간 구호","군량","아사기 봄 씨앗"].map(label=>{
   const row=document.createElement("label");row.className="item";row.textContent=label;
   const input=document.createElement("input");input.type="number";input.min="0";input.max=String(Math.min(c.warehouse,c.cargo));input.value="0";input.style.width="4em";row.append(input);body.append(row);return input;
  });
  const values=delegate=>[...inputs.map(input=>input.valueAsNumber),delegate];
  button(body,"직접 배분 확정",()=>commit(0,values(false)));
  button(body,"지역 위임 배분 확정",()=>commit(0,values(true)));
  return;
 }
 for(const [i,choice] of episode.options.entries())row(body,choice.trade,choice.label,()=>commit(i));
}

function soilNamedRoutes(){
 const episode=soilEpisode();
 if(!episode||episode.region!==s.region)return namedResidentRoutes;
 const label=({겐조:"genzo",이레나:"irena",레나트:"renat",마라:"mara",사에:"sae",엘리제:"elise"})[episode.speaker];
 if(!label)return namedResidentRoutes;
 const p=here(episode.place),z=p.y+11,x=p.x+3;
 const a=[x,terrainSurface(x,z),z],b=[x+.6,terrainSurface(x+.6,z+.2),z+.2];
 return {...namedResidentRoutes,[label]:{points:[a,b],speed:.00011,phase:.2}};
}
const soilHandoff={x:309,y:348.4};
function soilGranaryFloor(x,z){
 const footprint=buildingFootprints.find(p=>Math.abs(p.x-x)<.05&&Math.abs(p.z-z)<.05&&p.insideW);
 return footprint?footprint.ceiling-footprint.wallHeight+.27:foundationGrade(x,z,7.1,4.9).top+.27;
}
function soilShotResidents(shot){
 return Object.fromEntries(Object.entries(shot.named).map(([label,[x,y,z]])=>[
  label,{points:[[x,y,z],[x+.023,y,z+.01]],speed:.00003,phase:.23,yaw:label==="irena"&&shot.irenaPose?Math.PI:label==="child"?1.12:undefined,arms:label==="irena"&&shot.irenaPose?[.58,.58]:label==="child"&&shot.lanternInHand?[0,.45]:undefined}
 ]));
}

function soilDryPaddies(){return s.region===0&&(s.introPending||["guard","raid"].includes(s.soilCampaign?.step));}
