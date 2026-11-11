"use strict";
window.SoilCampaign=(()=>{
 const regions=["아사기","브뤼넨","산타 루시아","주니퍼웰","비버턴","생오렐","암바로","카루크"];
 const places={station:"역",home:"집터",woods:"묘지와 숲길",rocks:"채석장",fish:"물가",field:"공동 생활터",gate:"수문"};
 const state=()=>({
  openingComplete:true,step:"guard",act:1,seedJar:"asagi-granary",
  food:[12,9,8,7,9,10,8,7],seed:[3,0,0,0,0,0,0,0],reserve:Array(8).fill(0),
  trust:Array(8).fill(1),routes:Array(8).fill(false),shelters:Array(8).fill(false),
  troops:8,wounded:0,armyFood:4,cargo:7,enemy:12,siegeDay:0,
  works:[],history:[],assignments:{},losses:[],status:{},squad:[],sortWorkers:0,harvest:0,relief:0,planted:null
 });
 const requireStock=(quantity,used)=>{if(!Number.isInteger(used)||used<0||quantity<used)throw Error("보유량이 부족합니다.");};
 const food=(c,i,n)=>{requireStock(c.food[i],n);c.food[i]-=n;};
 const lose=(c,n)=>{const casualties=Math.min(c.troops,n);c.troops-=casualties;c.wounded+=casualties;};
 const reserve=(c,i,n)=>{food(c,i,n);c.reserve[i]+=n;};
 const drawSupplies=(c,i,n)=>{
  const stored=Math.min(n,c.reserve[i]);c.reserve[i]-=stored;food(c,i,n-stored);c.armyFood+=n;
 };
 const order=(label,trade,apply)=>({label,trade,apply});
 const story=(region,place,title,speaker,line,next,options)=>({region,place,title,speaker,line,next,options});
 const episodes={
  guard:story(0,"field","창고 앞 경계초소로 가기","이레나","등잔을 낮춰요. 씨앗 항아리는 창고 안에 있어요.","raid",[
   order("수문으로 나가 첫 공격을 막는다","군량 1을 쓴다.",c=>{requireStock(c.armyFood,1);c.armyFood--;c.status.이레나="아사기 방어";})]),
  raid:story(0,"gate","제방 초소 방어","겐조","내가 제방을 지키마. 넌 돌아갈 길을 열어 둬.","spring",[
   order("제방에서 퇴로를 확보한다","부상 1명. 수문길을 확보한다.",c=>{lose(c,1);c.routes[0]=true;})]),
  spring:story(0,"field","봄 파종","사에","먹을 곡식과 내년에 남길 씨앗을 따로 적을게요.","summer",[
   order("공동 밭에 씨앗 1개를 심는다","씨앗 −1. 가을 식량 +4.",c=>{requireStock(c.seed[0],1);c.seed[0]--;c.harvest=4;})]),
  summer:story(0,"home","여름 집과 대피로 정비","사에","고친 집에서 가을 식사를 하죠. 뒷길도 같이 살펴요.","hunt",[
   order("집을 수리하고 뒷길에 난간을 세운다","식량 2. 대피소와 우회로 확보. 실제 집을 지었다면 식량 1.",(c,g)=>{food(c,0,g.home?1:2);c.shelters[0]=true;c.works.push(g.home?"플레이어 주택":"공동 가옥 보수");}),
   order("공동 가옥에서 식량을 비축한다","식량 2를 비축고로 옮긴다.",c=>reserve(c,0,2))]),
  hunt:story(0,"woods","겐조와 식량 마련","겐조","바람을 등지면 짐승이 먼저 알아챈다. 흔적을 보고 돌아가자.","meal",[
   order("숲의 흔적을 따라 사냥한다","사냥한 고기를 마을 식량 3으로 보탠다.",c=>{c.food[0]+=3;c.status.겐조="사냥 지도";})]),
  meal:story(0,"home","가을 저녁","아이","내년에 심을 건 어디 있어요?","shortage",[
   order("공동 밭의 수확을 들여온다","봄에 심은 곡식만큼 식량이 늘어난다.",c=>{c.food[0]+=c.harvest;c.harvest=0;})]),
  shortage:story(0,"field","겨울 장부 확인","사에","왼쪽은 겨울 식량, 오른쪽은 봄에 심을 몫이에요.","blizzard",[
   order("씨앗을 잠그고 기존 식량을 나눈다","민간 식량 3 소비. 씨앗 보존.",c=>{food(c,0,3);c.trust[0]++;}),
   order("씨앗 1개를 끓여 배급한다","먹을 수 있는 곡식으로 바꾼 씨앗은 파종할 수 없다.",c=>{requireStock(c.seed[0],1);c.seed[0]--;food(c,0,1);c.trust[0]+=2;})]),
  blizzard:story(0,"field","눈보라 속 창고 방어","이레나","불을 꺼요. 문 앞에 남은 사람을 어디로 들일지 정해야 해요.","prisoner",[
   order("정문을 열고 계단을 지킨다","군량 1. 정면 엄호에 나선 병사 2명이 부상한다.",c=>{requireStock(c.armyFood,1);c.armyFood--;lose(c,2);c.rescued=4;}),
   order("씨앗을 지키며 뒷길로 구조한다","집과 뒷길을 정비했다면 4명 구조, 부상 1명. 미정비 시 2명 구조, 부상 2명.",c=>{c.rescued=c.shelters[0]?4:2;lose(c,c.shelters[0]?1:2);if(!c.shelters[0])c.losses.push("아사기 대피 주민");})]),
  prisoner:story(0,"field","배급 줄 끝의 포로","겐조","저 병사도 손을 녹일 곳이 필요하겠지. 우리 몫이 얼마 남았나?","market",[
   order("포로에게 식사 한 끼를 준다","민간 식량 1. 포로가 증언에 협조한다.",c=>{food(c,0,1);c.status.포로="식사와 증언";c.trust[0]++;}),
   order("남은 배급을 마을에 남긴다","식량 유지. 포로는 구금한다.",c=>{c.status.포로="구금";})]),
  market:story(1,"station","브뤼넨 시장에서 레나트 만나기","레나트","교량 아래 지하 창고는 시장 사람들이 지켜 왔소. 피란민도 그리 데려갈 수 있지.","blockade",[
   order("시장 상인들과 피란 통로를 연다","브뤼넨 식량 1. 시장 대피로와 운송 협약 확보.",c=>{food(c,1,1);c.routes[1]=true;c.trust[1]+=2;c.cargo+=2;reserve(c,1,1);}),
   order("교량에 정찰병을 배치한다","적 준비도 −2. 대피로는 확보되지 않는다.",c=>{c.enemy-=2;})]),
  blockade:story(1,"gate","봉쇄 사흘째의 명단","레나트","이 종이에 어제까지 숨진 사람을 적었소. 이레나, 끝까지 기다릴 건가?","assault",[
   order("열흘까지 봉쇄를 계속한다","군량 1과 민간 식량 4. 적 준비도 −6. 주민 사망 기록.",c=>{requireStock(c.armyFood,1);c.armyFood--;food(c,1,4);c.siegeDay=10;c.enemy-=6;c.losses.push("브뤼넨 봉쇄 희생자");}),
   order("지하 통로로 식량 배급소에 침투한다","민간 식량 1. 대피로가 있으면 주민 5명, 없으면 2명을 구한다. 적 준비도 −2.",c=>{food(c,1,1);c.siegeDay=3;c.enemy-=2;c.evacuated=c.routes[1]?5:2;})]),
  assault:story(1,"field","브뤼넨 배급소 확보","엘리제","옛 수로 장부에 자루 표식이 남아 있어요. 이 선을 지켜야 창고에 닿아요.","sort",[
   order("배급소를 지키고 중앙 창고를 연다","적 준비도와 대피로에 따라 1~3명 부상.",c=>{lose(c,Math.max(1,Math.ceil(c.enemy/4)-(c.routes[1]?1:0)));c.warehouse=10;})]),
  sort:story(1,"field","섞인 곡식 자루 분류","마라","표식이 바뀌면 같은 자루도 다른 사람 몫이 되더군요.","south",[
   order("주민 4명을 고용해 자루를 분류한다","창고 10 중 식량 6, 씨앗 4. 작업자 4명은 분류에 배치.",c=>{c.food[1]+=6;c.seed[1]+=4;c.warehouse=0;c.sortWorkers=4;c.assignments.분류=4;}),
   order("오늘 배급을 위해 빠르게 분류한다","창고 10 중 식량 9, 씨앗 1. 작업자 1명 배치.",c=>{c.food[1]+=9;c.seed[1]++;c.warehouse=0;c.sortWorkers=1;c.assignments.분류=1;})]),
  south:story(2,"field","산타 루시아 내건성 씨앗","저수지 관리인","저수지에서 떨어진 밭에도 버티는 씨앗이에요. 야영지는 한곳에 몰지 맙시다.","patrol",[
   order("씨앗 3개를 받고 분산 야영지를 확보한다","산타 루시아 식량 1. 예비 대피소 확보.",c=>{food(c,2,1);c.seed[2]+=3;c.shelters[2]=true;c.routes[2]=true;})]),
  patrol:story(3,"woods","주니퍼웰 순찰대 합류","제재소 순찰대","카루크로 갈 수 있는 날이 얼마 안 남았습니다. 짧게 세 번 불면 우측 정찰, 좌측 엄호입니다.","smith",[
   order("세 번의 나팔 신호와 엄호 진형을 연습한다","정찰대가 합류한다. 지역 식량 1로 고개 대피소를 연다.",c=>{food(c,3,1);c.squad.push("주니퍼웰 순찰대");c.shelters[3]=true;c.routes[3]=true;c.signal=true;})]),
  smith:story(4,"station","비버턴 수송 계약","철도 기술자","추위에는 짐보다 바퀴가 먼저 멈춰요. 구난 마차를 내어 드리죠.","delta",[
   order("방한 장비와 구난 마차를 받는다","비버턴 식량 2. 적재 한도 +4, 방한 장비 확보.",c=>{food(c,4,2);c.cargo+=4;c.coldGear=true;c.routes[4]=true;})]),
  delta:story(5,"fish","생오렐 수로 복구","그물 수선공","물이 돌면 연못도 살고 배도 돌아옵니다. 제방 안쪽으로 보내죠.","garden",[
   order("수로를 열고 구호선을 연결한다","현지 식량 +4. 물길과 수송선 확보.",c=>{c.food[5]+=4;c.routes[5]=true;c.cargo+=2;reserve(c,5,2);})]),
  garden:story(6,"field","암바로 씨앗 정원","선박 조종사","붉은 매듭 자루는 정원으로 가져오세요. 거기서 다음 철을 준비하죠.","harvest",[
   order("정원 씨앗 4개를 확보하고 교역을 맺는다","암바로 식량 1. 씨앗 대체 공급로 확보.",c=>{food(c,6,1);c.seed[6]+=4;c.routes[6]=true;c.trust[6]+=2;reserve(c,6,1);})]),
  harvest:story(0,"field","시험 재배와 북부 원정","사에","오늘 수확하러 나간 사람은 동시에 북쪽에 보낼 수 없어요.","command",[
   order("지역 비축과 교역으로 원정을 지원한다","군량 +6. 세 지역에서 식량을 각 2씩 모으고 비축고부터 사용한다. 수확 인원 4명 유지.",c=>{for(const i of [1,5,6])drawSupplies(c,i,2);c.assignments.수확=4;c.requisition=false;}),
   order("수확 전에 식량을 징발하고 출발한다","군량 +7. 아사기 식량 4와 브뤼넨 식량 3. 수확 인원 2명.",c=>{food(c,0,4);food(c,1,3);c.armyFood+=7;c.assignments.수확=2;c.requisition=true;c.trust[0]=Math.max(0,c.trust[0]-1);}),
   order("수확을 마친 뒤 작은 부대로 출발한다","수확 인원 5명. 군량 3을 브뤼넨에서 옮긴다. 적 준비도 +3.",c=>{food(c,1,3);c.armyFood+=3;c.assignments.수확=5;c.enemy+=3;lose(c,1);})]),
  command:story(0,"station","북부 원정 지휘권","이레나","사람들이 나팔을 들으면 누구 명령을 따르는지 먼저 정해야 해요.","snow",[
   order("지역 지휘관에게 현장 권한을 준다","현지 지휘관이 카루크에서 대기 명령을 내릴 수 있다.",c=>{c.command="지역 위임";c.trust[7]++;}),
   order("원정대 지휘권을 이레나에게 모은다","현장 병력 +2. 카루크 지역 지휘관의 독자 명령 제한.",c=>{c.command="중앙 지휘";c.troops+=2;})]),
  snow:story(7,"woods","카루크 1일차 · 눈보라 수송","관측소 보급 담당","부상병과 군량을 한 마차에 실을 수는 있어요. 무게를 먼저 봐야 합니다.","mara",[
   order("대피소를 거쳐 두 번 운송한다","군량 2. 대피소와 방한 장비가 있으면 부상병 전원 대피.",c=>{requireStock(c.armyFood,2);c.armyFood-=2;c.evac=c.shelters[3]&&c.coldGear?c.wounded:Math.min(c.wounded,2);}),
   order("부상병과 군량을 한 번에 나눈다","군량 1. 남은 적재 공간만큼 부상병을 대피시킨다.",c=>{requireStock(c.armyFood,1);c.armyFood--;c.evac=Math.min(c.wounded,Math.max(0,c.cargo-c.armyFood));})]),
  mara:story(7,"gate","카루크 2일차 · 마라의 저울","마라","병사와 마을 사람에게 같은 몫을 줘요. 저울은 여기 있어요.","sealed",[
   order("부관의 거래를 거절하고 전초를 확보한다","준비도에 따라 부상 1~3명. 창고 접근권 확보.",c=>{lose(c,Math.max(1,Math.ceil(c.enemy/4)));c.warehouse=12;c.status.마라="무장 해제";}),
   order("군량 2를 내고 부관의 철수에 합의한다","군량 2. 충돌 없이 창고 접근권 확보.",c=>{requireStock(c.armyFood,2);c.armyFood-=2;c.warehouse=12;c.status.마라="지휘권 상실";})]),
  sealed:story(7,"station","카루크 3일차 · 세 번의 나팔","이레나","군량부터 확보해야 이 고개를 넘을 수 있어요. 창고 문을 닫으세요.","distribute",[
   order("지역 지휘관에게 대기 명령을 요청한다","지역 위임과 주니퍼웰 나팔 신호가 필요하다.",c=>{if(c.command!=="지역 위임"||!c.signal)throw Error("현지 대기 명령 권한이 없습니다.");c.status.이레나="지역 지휘관과 교섭";}),
   order("별도 군량 2를 제시해 교섭한다","실제로 보유한 군량 2를 대체 배급으로 쓴다.",c=>{requireStock(c.armyFood,2);c.armyFood-=2;c.status.이레나="대체 배급 수용";}),
   order("엄호선을 돌파한다","정찰 신호와 가용 병력에 따라 부상 1~3명.",c=>{if(!c.troops)throw Error("돌파에 투입할 병력이 없습니다.");lose(c,c.signal?2:3);c.status.이레나="창고 철수";})]),
  distribute:story(7,"station","북부 창고 배급 배분","현지 지휘관","민간 식량, 군량, 내년 씨앗을 따로 적겠습니다.","return",[]),
  return:story(0,"field","늦겨울 아사기 구호","사에","남은 식량과 씨앗을 보고 누가 돌아올 수 있을지 정해요.","grave",[
   order("어장과 비축고를 열어 남은 겨울을 난다","아사기 비축을 식량으로 옮기고, 생오렐 수로와 양식장 상태를 반영한다.",(c,g)=>{c.food[0]+=c.reserve[0]+(c.routes[5]?2:0)+(g.pond?2:0);c.reserve[0]=0;if(c.food[0]<4)c.losses.push("아사기를 떠난 가구");})]),
  grave:story(0,"woods","묘지에 씨앗 항아리 놓기","사에","이 사람이 심어 둔 게 아직 남아 있어요. 어디에 심을까요?","plant",[
   order("심을 수 있는 씨앗을 한 알 챙긴다","보유한 씨앗 1개를 가방에 넣는다. 암바로 교역이 유지되면 대체 씨앗을 가져올 수 있다.",c=>{const src=c.seed[0]>0?0:c.routes[6]&&c.seed[6]>0?6:-1;if(src<0)throw Error("심을 수 있는 씨앗이 없습니다.");c.seed[src]--;c.plantingSeed=1;})]),
  plant:story(0,"field","첫 씨앗을 심을 밭 고르기","사에","물길 옆에 고랑을 냈어요. 기른 첫 곡식이 어디에서 자랄지 직접 골라요.","complete",[
   order("수로 옆 공동 밭에 심는다","가방의 씨앗 1개를 소비한다.",c=>plant(c,"공동 밭")),
   order("마을 쪽 밭 가장자리에 심는다","가방의 씨앗 1개를 소비한다.",c=>plant(c,"마을 쪽 밭"))])
 };
 function plant(c,plot){requireStock(c.plantingSeed,1);c.plantingSeed--;c.planted={plot,crop:"아사기 볍씨"};c.complete=true;}
 function allocation(c,civilian,military,seed,delegate){
  const total=civilian+military+seed;
  requireStock(c.warehouse,total);requireStock(c.cargo,total);
  if(![civilian,military,seed].every(n=>Number.isInteger(n)&&n>=0)||total===0)throw Error("배분할 수량을 정해 주세요.");
  c.warehouse-=total;c.food[0]+=civilian;c.armyFood+=military;c.seed[0]+=seed;c.relief=civilian;
  c.distribution=delegate?"지역 위임":"직접 배분";
  if(delegate)for(let i=1;i<regions.length;i++){const n=c.routes[i]&&c.trust[i]>1?Math.min(c.food[i],1):0;c.food[i]-=n;c.food[0]+=n;}
 }
 function advance(c,option,game={},quantities){
  const ep=episodes[c.step];if(!ep)throw Error("이미 마친 임무입니다.");
  const next=structuredClone(c);
  if(c.step==="distribute")allocation(next,...quantities);
  else ep.options[option].apply(next,game);
  const completed=c.step;
  next.history.push({mission:completed,decision:c.step==="distribute"?next.distribution:ep.options[option].label});
  next.step=ep.next;next.act=({market:2,south:3,snow:4,return:5})[next.step]??c.act;
  if(completed==="command"){
   const localHelpers=Object.values(next.assignments).filter(duty=>duty==="파종과 창고 정리").length;
   next.harvest=next.assignments.수확+Math.min(2,localHelpers);
   next.food[0]+=next.harvest;
   for(const i of [2,6])if(next.seed[i]>1)next.seed[i]--;
   next.troops+=Math.max(0,5-next.assignments.수확);
   next.squad.push("겐조","사에");
  }
  if(completed==="snow"&&next.evac<next.wounded)next.losses.push("카루크 미대피 부상병");
  if(completed==="mara"){
   const frost=Math.min(2,next.harvest);next.frost=frost;next.harvest-=frost;next.food[0]=Math.max(0,next.food[0]-frost);
  }
  return next;
 }
 const jobNames={
  "boat-pilot":"선박 조종사",carpenter:"목수","rice-grower":"벼농사 주민","rail-clerk":"역무원","rail-technician":"철도 기술자","mine-surveyor":"광산 측량사","wharf-forewoman":"부두 반장","lock-keeper":"갑문지기",courier:"배달원",baker:"제빵사",bookbinder:"제본공","boat-hand":"뱃사공",grocer:"식료품 상인",mason:"석공","rail-porter":"철도 짐꾼","retired-boatbuilder":"은퇴한 조선공",seamstress:"재봉사","canal-maintainer":"운하 정비공",inspector:"검사관",boatwright:"선박 제작공",butcher:"정육점 주인",watchman:"경비원",glazier:"유리공",cooper:"통 제작공",apprentice:"견습공",laundress:"세탁공","customs-officer":"세관원",cook:"요리사",ferryman:"나룻배 사공",florist:"꽃집 주인","quay-clerk":"부두 사무원","market-grocer":"시장 상인",lamplighter:"가로등지기",cobbler:"구두 수선공","canal-resident":"운하 주민",constable:"순경",printmaker:"인쇄공","sawmill-worker":"제재소 노동자","timber-grader":"목재 검사원","weather-observer":"기상 관측원","supply-keeper":"보급 담당","boat-repairer":"선박 수리공","net-mender":"그물 수선공","adobe-mason":"흙벽돌 석공","reservoir-keeper":"저수지 관리인"
 };
 const duties=["파종과 창고 정리","시장 피란과 곡물 분류","씨앗 보존과 야영지 정비","순찰과 대피소 정비","방한 장비와 화물 수송","수로 복구와 구호 수송","씨앗 정원과 연안 교역","창고와 부상병 구호"];
 function residentNames(roster,i){
  const key=["asagi","brunnen","santa-lucia","juniperwell","beaverton","saint-aurel","ambaro","karuk"][i];
  const locals=roster.filter(p=>p.region===key).map(p=>({id:p.label,name:jobNames[p.label.replace(/^.+?-\d+-/,"")]??"주민"}));
  const named=({0:[["genzo","겐조"],["sae","사에"],["grandmother","할머니의 기록"],["irena","이레나"]],1:[["elise","엘리제"],["renat","레나트"],["mara","마라"]],7:[["irena","이레나"],["mara","마라"]]})[i]??[];
  return locals.concat(named.map(([id,name])=>({id,name})));
 }
 return {regions,places,duties,state,episodes,advance,residentNames};
})();
