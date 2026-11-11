# 프로그램 구조

## Windows 호스트

`src/GameWindow.cs`는 WinForms 창 안에 WebView2를 띄우고 `https://game.returningwaters.local` 가상 호스트에 게임 디렉터리를 매핑합니다. 제목 화면 `game/desktop.html`과 실제 게임 `game/index.html` 사이를 전환하며 JavaScript 메시지와 네이티브 코드를 연결합니다.

호스트는 로컬 계정, 세션, 게임 시작, 자동·수동 세이브와 복구를 담당합니다. 계정 ID는 영문자·숫자·밑줄 3~24자 형식을 사용합니다. 비밀번호는 솔트와 PBKDF2-SHA256(600,000회)로 해시합니다. 파일 기록은 임시 파일을 사용한 원자적 교체 방식입니다.

## 게임

`game/index.html`과 여러 전역 스크립트·ES 모듈이 게임을 구성합니다. Three.js와 GLTFLoader 등은 `game/vendor/three/`에 포함되어 있습니다. 기존 빌드 산출물 형태의 소스를 보존한 스냅샷이며 TypeScript·React·npm 번들링 프로젝트는 아닙니다.

- 지역·세계: `OpenWorld.js`, `WorldGeography.js`, `AtlasCoordinates.js`, `regional-terrain.js`, `Watershed.js`, `TrailNavigation.js` 등.
- 이야기: `AsagiActOne.js`, `BrunnenActTwo.js`, `KarukActThree.js`, `SoilCampaign.js`, `WinterFinale.js` 등.
- 인물·상태: `VillageCharacter.js`, `ResidentCast.mjs`, `PlayerStatus.js`, `rigged-scene.mjs` 등.
- 아이템·제작·경제: `InventoryData.js`, `InventoryWorld.js`, `Crafting.js`, `CraftingData.js`, `RegionalShops.js`, `TownServices.js`, `Timber.js` 등.
- 건축·자연: `HammerBuild.js`, `HouseInteriors.js`, `BuildingVariation.js`, `Wildlife*.js`, `WhiteHorse.js` 등.

위 목록은 모듈의 역할을 소개하며 각 기능의 완전성이나 테스트 통과를 의미하지 않습니다.

## 업데이트

`ContentUpdates.cs`는 기존 사이트의 콘텐츠 목록과 SHA-256을 검사하고, `LauncherUpdates.cs`는 런처 업데이트 서명을 검사하는 원본입니다. `game/program-only.flag`가 있으면 게임 콘텐츠는 로컬 전용 모드로 동작합니다. 이 스냅샷용 빌드는 별도의 공개 검증키를 생성하며 기존 배포 서명키를 복사하지 않습니다.

`game/updates/`의 기존 매니페스트와 ZIP은 과거 배포 자료입니다. 이후 로컬 수정이 있어 현재 파일 해시와 다를 수 있습니다. 현재 공개 스냅샷의 기준은 `docs/FILE-MANIFEST.json`이며 과거 업데이트 목록을 이 빌드의 최신 상태로 간주하면 안 됩니다. 공개 저장소를 기존 런처의 업데이트 서버로 자동 연결하지 않습니다.

## 원본과 개발 도구

최신 설치 폴더의 게임 소스와 자산을 독립 파일로 복사해 Windows 하드링크·심볼릭 링크에 의존하지 않게 했습니다. 원본의 최상위 제작 스크립트는 `tools/`에, 캠페인 제작 원본은 `tools/campaign/`에 보존했습니다. 과거 설치기 원본은 `src/Setup.cs`에 있습니다. 현재 빌드는 설치기 대신 `dist/` 실행 폴더를 생성합니다.
