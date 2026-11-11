"use strict";
let questSubtitleUntil=0,questStageSeen;
function activeMapQuests(){
 if(s.soilCampaign?.step){const ep=soilEpisode();return ep?[{type:"main",region:ep.region,spot:ep.place,title:"Mercy’s Last Grain",description:ep.title}]:[];}
 const quests=[];
 const winter=winterObjectives();
 for(const [title,description,region,spot] of winter)quests.push({type:"main",region,spot,title,description});
 const act=actObjective();
 if(act&&!winter.length)quests.push({type:"main",region:0,spot:act[2],title:act[0],description:act[1]});
 const [title,description]=story[s.stage];
 const expedition=winter.length?null:expeditionObjective()??expeditionObjective(1)??expeditionObjective(7);
 if(expedition)quests.push({type:"main",region:expedition[2],spot:expedition[3],title:expedition[0],description:expedition[1]});
 const siege=expedition||winter.length?null:brObjective();
 if(siege)quests.push({type:"main",region:1,spot:siege[2],title:siege[0],description:siege[1]});
 if(!expedition&&!winter.length&&s.stage>=6)for(const region of [6,7]){
  quests.push({type:"main",region,title,description});
 }
 if(s.side!==3){
  const needsPart=s.side!==0&&s.stage>=5&&!count("양수기 부품");
  quests.push({type:"side",region:needsPart?1:0,spot:needsPart?"station":"field",
   title:"사에와 양수기",
   description:s.side===0?"아사기 공동 생활터에서 사에의 이야기를 들어 봐.":
    needsPart?"브뤼넨 역 상점에서 양수기 부품을 구해 봐.":
    count("양수기 부품")?"양수기 부품을 가지고 아사기 공동 생활터의 사에를 찾아가.":"브뤼넨으로 가는 길이 열리면 양수기 부품을 구할 수 있어."});
 }
 return quests;
}
function questSubtitle(title,description){
 const caption=$("quest-subtitle");
 if(!caption)return;
 caption.querySelector("strong").textContent=title;
 caption.querySelector("span").textContent=description;
 caption.hidden=false;
 questSubtitleUntil=simulationTime+Math.min(11500,5500+description.length*52);
}
function updateQuestSubtitleTimer(time){
 if(questSubtitleUntil&&time>=questSubtitleUntil){
  questSubtitleUntil=0;
  const caption=$("quest-subtitle");
  if(caption)caption.hidden=true;
 }
}
function syncQuestSubtitle(){
 if(s.region>1&&questStageSeen!==undefined&&questStageSeen!==s.stage)questSubtitle(...story[s.stage]);
 questStageSeen=s.stage;
}
function annotateQuestPin(pin,quests){
 if(!quests.length)return;
 const labels=[...new Set(quests.map(q=>q.type))];
 for(const type of labels){
  const marker=document.createElement("span");
  marker.className="quest-pin "+type;
  marker.textContent=type==="main"?"본편":"곁길";
  pin.append(" ",marker);
 }
}
function questMapLegend(parent){
 const legend=document.createElement("p");
 legend.className="quest-legend";
 for(const [type,label,description] of [["main","본편","이야기를 잇는 임무"],["side","곁길","선택해서 만나는 이야기"]]){
  const item=document.createElement("span"),mark=document.createElement("b");
  mark.className="quest-pin "+type;mark.textContent=label;
  item.append(mark,description);legend.append(item);
 }
 parent.append(legend);
}
function questMapActions(parent,quests){
 for(const quest of quests){
  const kind=quest.type==="main"?"본편":"곁길";
  const control=button(parent,kind+" · "+quest.title,()=>{
   $("dialog").close();
   questSubtitle(kind+" · "+quest.title,quest.description);
  });
  control.classList.add("quest-map-action",quest.type);
 }
}
