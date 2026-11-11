"use strict";
const priorityItemModels=Object.freeze({
 "손도끼": {
  "model": "assets/priority-models/098.glb",
  "icon": "assets/priority-icons/098.png"
 },
 "낚싯대": {
  "model": "assets/priority-models/100.glb",
  "icon": "assets/priority-icons/100.png"
 },
 "곡괭이": {
  "model": "assets/priority-models/099.glb",
  "icon": "assets/priority-icons/099.png"
 },
 "채집가위": {
  "model": "assets/priority-models/103.glb",
  "icon": "assets/priority-icons/103.png"
 },
 "손괭이": {
  "model": "assets/priority-models/104.glb",
  "icon": "assets/priority-icons/104.png"
 },
 "벌목 도끼": {
  "model": "assets/priority-models/175.glb",
  "icon": "assets/priority-icons/175.png"
 },
 "강화 벌목 도끼": {
  "model": "assets/priority-models/176.glb",
  "icon": "assets/priority-icons/176.png"
 },
 "민물 채비": {
  "model": "assets/priority-models/101.glb",
  "icon": "assets/priority-icons/101.png"
 },
 "바다 채비": {
  "model": "assets/priority-models/102.glb",
  "icon": "assets/priority-icons/102.png"
 },
 "뜰채": {
  "model": "assets/priority-models/105.glb",
  "icon": "assets/priority-icons/105.png"
 },
 "사냥 활": {
  "model": "assets/priority-models/106.glb",
  "icon": "assets/priority-icons/106.png"
 },
 "여행자의 검": {
  "model": "assets/priority-models/107.glb",
  "icon": "assets/priority-icons/107.png"
 },
 "짧은 검": {
  "model": "assets/priority-models/108.glb",
  "icon": "assets/priority-icons/108.png"
 },
 "나무 방패": {
  "model": "assets/priority-models/109.glb",
  "icon": "assets/priority-icons/109.png"
 },
 "목동 지팡이": {
  "model": "assets/priority-models/110.glb",
  "icon": "assets/priority-icons/110.png"
 },
 "여행솥": {
  "model": "assets/priority-models/111.glb",
  "icon": "assets/priority-icons/111.png"
 },
 "아사기 편백 지팡이": {
  "model": "assets/priority-models/131.glb",
  "icon": "assets/priority-icons/131.png"
 },
 "조릿대 투창": {
  "model": "assets/priority-models/132.glb",
  "icon": "assets/priority-icons/132.png"
 },
 "편백 사냥활": {
  "model": "assets/priority-models/133.glb",
  "icon": "assets/priority-icons/133.png"
 },
 "운하 갈고리창": {
  "model": "assets/priority-models/134.glb",
  "icon": "assets/priority-icons/134.png"
 },
 "협곡 구리 단검": {
  "model": "assets/priority-models/135.glb",
  "icon": "assets/priority-icons/135.png"
 },
 "주니퍼웰 고원 장궁": {
  "model": "assets/priority-models/136.glb",
  "icon": "assets/priority-icons/136.png"
 },
 "비버턴 철도 도끼": {
  "model": "assets/priority-models/137.glb",
  "icon": "assets/priority-icons/137.png"
 },
 "생오렐 제방 장창": {
  "model": "assets/priority-models/138.glb",
  "icon": "assets/priority-icons/138.png"
 },
 "암바로 철촉 작살": {
  "model": "assets/priority-models/139.glb",
  "icon": "assets/priority-icons/139.png"
 },
 "카루크 방한 사냥창": {
  "model": "assets/priority-models/140.glb",
  "icon": "assets/priority-icons/140.png"
 },
 "연습용 나무 화살": {
  "model": "assets/priority-models/141.glb",
  "icon": "assets/priority-icons/141.png"
 },
 "꿩 깃털 사냥 화살": {
  "model": "assets/priority-models/142.glb",
  "icon": "assets/priority-icons/142.png"
 },
 "철촉 화살": {
  "model": "assets/priority-models/143.glb",
  "icon": "assets/priority-icons/143.png"
 },
 "양수기 부품": {
  "model": "assets/priority-models/023.glb",
  "icon": "assets/priority-icons/023.png"
 },
 "구리 배관": {
  "model": "assets/priority-models/037.glb",
  "icon": "assets/priority-icons/037.png"
 },
 "방수 널판": {
  "model": "assets/priority-models/069.glb",
  "icon": "assets/priority-icons/069.png"
 },
 "timber_log": {
  "model": "assets/priority-models/161.glb",
  "icon": "assets/priority-icons/161.png"
 },
 "timber_quality": {
  "model": "assets/priority-models/162.glb",
  "icon": "assets/priority-icons/162.png"
 },
 "timber_premium": {
  "model": "assets/priority-models/163.glb",
  "icon": "assets/priority-icons/163.png"
 },
 "목재 보강편": {
  "model": "assets/priority-models/165.glb",
  "icon": "assets/priority-icons/165.png"
 },
 "기본 작업대": {
  "model": "assets/priority-models/167.glb",
  "icon": "assets/priority-icons/167.png"
 },
 "널판": {
  "model": "assets/priority-models/168.glb",
  "icon": "assets/priority-icons/168.png"
 },
 "기본 들보": {
  "model": "assets/priority-models/169.glb",
  "icon": "assets/priority-icons/169.png"
 },
 "카수아리나 적층재": {
  "model": "assets/priority-models/170.glb",
  "icon": "assets/priority-icons/170.png"
 },
 "수차 목재 부품": {
  "model": "assets/priority-models/171.glb",
  "icon": "assets/priority-icons/171.png"
 },
 "정밀 수문틀": {
  "model": "assets/priority-models/173.glb",
  "icon": "assets/priority-icons/173.png"
 },
 "대형 선박 용골": {
  "model": "assets/priority-models/174.glb",
  "icon": "assets/priority-icons/174.png"
 },
 "낙우송 부표": {
  "model": "assets/priority-models/179.glb",
  "icon": "assets/priority-icons/179.png"
 },
 "단조 철재": {
  "model": "assets/priority-models/181.glb",
  "icon": "assets/priority-icons/181.png"
 },
 "방수 갈대 끈": {
  "model": "assets/priority-models/182.glb",
  "icon": "assets/priority-icons/182.png"
 },
 "복합 시위": {
  "model": "assets/priority-models/183.glb",
  "icon": "assets/priority-icons/183.png"
 },
 "정밀 연결부": {
  "model": "assets/priority-models/185.glb",
  "icon": "assets/priority-icons/185.png"
 },
 "주먹밥": {
  "model": "assets/priority-models/112.glb",
  "icon": "assets/priority-icons/112.png"
 },
 "씨앗": {
  "model": "assets/priority-models/113.glb",
  "icon": "assets/priority-icons/113.png"
 },
 "따뜻한 식사": {
  "model": "assets/priority-models/115.glb",
  "icon": "assets/priority-icons/115.png"
 },
 "따뜻한 차": {
  "model": "assets/priority-models/116.glb",
  "icon": "assets/priority-icons/116.png"
 },
 "손질한 곡물": {
  "model": "assets/priority-models/117.glb",
  "icon": "assets/priority-icons/117.png"
 },
 "곡물죽": {
  "model": "assets/priority-models/118.glb",
  "icon": "assets/priority-icons/118.png"
 },
 "마지막 씨앗 항아리": {
  "model": "assets/priority-models/119.glb",
  "icon": "assets/priority-icons/119.png"
 },
 "심을 수 있는 아사기 볍씨": {
  "model": "assets/priority-models/120.glb",
  "icon": "assets/priority-icons/120.png"
 },
 "피라미": {
  "model": "assets/priority-models/001.glb",
  "icon": "assets/priority-icons/001.png"
 },
 "미꾸라지": {
  "model": "assets/priority-models/004.glb",
  "icon": "assets/priority-icons/004.png"
 },
 "붕어": {
  "model": "assets/priority-models/005.glb",
  "icon": "assets/priority-icons/005.png"
 },
 "산천어": {
  "model": "assets/priority-models/006.glb",
  "icon": "assets/priority-icons/006.png"
 },
 "잉어": {
  "model": "assets/priority-models/008.glb",
  "icon": "assets/priority-icons/008.png"
 },
 "메기": {
  "model": "assets/priority-models/009.glb",
  "icon": "assets/priority-icons/009.png"
 },
 "로치": {
  "model": "assets/priority-models/012.glb",
  "icon": "assets/priority-icons/012.png"
 },
 "유럽농어": {
  "model": "assets/priority-models/014.glb",
  "icon": "assets/priority-icons/014.png"
 },
 "파이크": {
  "model": "assets/priority-models/018.glb",
  "icon": "assets/priority-icons/018.png"
 },
 "그린선피시": {
  "model": "assets/priority-models/027.glb",
  "icon": "assets/priority-icons/027.png"
 },
 "블루길": {
  "model": "assets/priority-models/028.glb",
  "icon": "assets/priority-icons/028.png"
 },
 "큰입배스": {
  "model": "assets/priority-models/031.glb",
  "icon": "assets/priority-icons/031.png"
 },
 "채널메기": {
  "model": "assets/priority-models/032.glb",
  "icon": "assets/priority-icons/032.png"
 },
 "황농어": {
  "model": "assets/priority-models/041.glb",
  "icon": "assets/priority-icons/041.png"
 },
 "무지개송어": {
  "model": "assets/priority-models/045.glb",
  "icon": "assets/priority-icons/045.png"
 },
 "코카니연어": {
  "model": "assets/priority-models/053.glb",
  "icon": "assets/priority-icons/053.png"
 },
 "블루메기": {
  "model": "assets/priority-models/064.glb",
  "icon": "assets/priority-icons/064.png"
 },
 "붉은민어": {
  "model": "assets/priority-models/065.glb",
  "icon": "assets/priority-icons/065.png"
 },
 "정어리": {
  "model": "assets/priority-models/070.glb",
  "icon": "assets/priority-icons/070.png"
 },
 "붉은퉁돔": {
  "model": "assets/priority-models/074.glb",
  "icon": "assets/priority-icons/074.png"
 },
 "청어": {
  "model": "assets/priority-models/084.glb",
  "icon": "assets/priority-icons/084.png"
 },
 "빙어": {
  "model": "assets/priority-models/085.glb",
  "icon": "assets/priority-icons/085.png"
 },
 "아사기 논둑 작업복": {
  "model": "assets/priority-models/144.glb",
  "icon": "assets/priority-icons/144.png"
 },
 "브뤼넨 운하 장화": {
  "model": "assets/priority-models/145.glb",
  "icon": "assets/priority-icons/145.png"
 },
 "산타 루시아 모래바람 두건": {
  "model": "assets/priority-models/146.glb",
  "icon": "assets/priority-icons/146.png"
 },
 "주니퍼웰 숲길 외투": {
  "model": "assets/priority-models/147.glb",
  "icon": "assets/priority-icons/147.png"
 },
 "비버턴 철도 작업 조끼": {
  "model": "assets/priority-models/148.glb",
  "icon": "assets/priority-icons/148.png"
 },
 "생오렐 나룻배 망토": {
  "model": "assets/priority-models/149.glb",
  "icon": "assets/priority-icons/149.png"
 },
 "암바로 썰물 모자": {
  "model": "assets/priority-models/150.glb",
  "icon": "assets/priority-icons/150.png"
 },
 "카루크 눈길 외투": {
  "model": "assets/priority-models/151.glb",
  "icon": "assets/priority-icons/151.png"
 }
});
function priorityItemModel(id){return Object.hasOwn(priorityItemModels,id)?priorityItemModels[id]:undefined;}
