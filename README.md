# Mercy’s Last Grain

한국어 3D 오픈월드 게임의 Windows 소스와 게임 자산입니다. 프로젝트 내부의 기존 이름은 **Returning Waters**이며 실행 파일과 저장 폴더에도 이 이름을 사용합니다.

주인공 머시의 이야기를 따라 지역과 마을을 탐험하고, 주민과 대화하고, 재료를 수집하고, 제작·건축·지역 상점을 이용합니다. 현재 소스에는 아사기·브뤼넨·산타 루시아·주니퍼웰·비버턴·생오렐·암바로·카루크, 지형과 수로, 야생동물, 장비와 의상, 백마 호출 및 승마 관련 모듈이 포함되어 있습니다.

이 저장소는 2026-11-12에 준비한 `ReturningWaters-OpenWorld` 설치 폴더의 개발 스냅샷입니다. 완성판 배포나 모든 기능의 정상 동작을 보증하는 릴리스는 아닙니다. 소스와 자산을 내려받아 Windows 실행 파일을 빌드할 수 있습니다.

## 내려받기

게임 자산 약 700MB는 Git LFS로 관리합니다. 일반 ZIP 다운로드 대신 Git LFS를 설치하고 복제하세요.

```powershell
git lfs install
git clone https://github.com/sucksam33-beep/mercys-last-grain.git
cd mercys-last-grain
git lfs pull
```

## Windows 빌드와 실행

필요 환경: Windows 10/11 x64, .NET Framework 4.8, Microsoft Edge WebView2 Runtime, PowerShell. WebView2 SDK 1.0.3650.58은 빌드 스크립트가 NuGet에서 내려받습니다. 게임 런타임 JavaScript는 별도 npm 설치 없이 포함된 Three.js를 사용합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Build.ps1
.\dist\ReturningWaters.exe
```

`dist` 폴더 전체가 실행에 필요합니다. 첫 실행 시 로컬 계정을 만든 다음 게임을 시작합니다. 계정과 저장은 이 PC에 저장되며 온라인 회원 서비스와 연결되지 않습니다. WebView2 Runtime이 없다면 Microsoft의 공식 설치 프로그램으로 먼저 설치하세요: [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/).

자세한 준비·빌드·문제 해결은 [빌드 안내](docs/BUILD.md), 저장 위치와 조작은 [플레이 안내](docs/PLAYING.md)를 참고하세요.

## 주요 조작

| 키 | 동작 |
| --- | --- |
| WASD / 방향키 | 이동 |
| 마우스 / 휠 | 시점 / 거리 |
| E | 상호작용 |
| Shift / Space | 회피·질주 / 점프 |
| Tab / I / J / M | 가방 / 플레이어 / 퀘스트 / 지도 |
| V / R | 말 호출 / 승하차 |
| Q / F | 대상 고정 / 전기 |
| Esc / Enter | 일시정지 / 메뉴 확인 |

실제 사용 가능한 동작은 진행 상황과 화면에 따라 달라집니다. 게임 안의 조작 안내도 확인하세요.

## 구성

| 경로 | 내용 |
| --- | --- |
| `game/` | HTML·CSS·JavaScript·모듈과 실행에 필요한 자산 |
| `game/assets/` | 모델·텍스처·이미지·음악·영상 |
| `game/vendor/three/` | 포함된 Three.js 런타임 및 라이선스 |
| `src/` | C# WinForms/WebView2 창, 로컬 계정·저장, 업데이트, 설치 프로그램 원본 |
| `scripts/` | 이 스냅샷을 빌드하고 검사하는 도구 |
| `tools/` | 기존 제작·패치·검증 도구와 캠페인 제작 소스 |
| `branding/` | 게임 아이콘과 브랜딩 이미지 |
| `docs/` | 실행·구조·공개 범위·파일 해시 기록 |
| `licenses/` | 포함된 외부 구성 요소의 고지 |

`tools/`의 과거 도구는 당시의 절대 경로나 설치 환경을 참조할 수 있습니다. 현재 게임을 빌드할 때 실행할 필요는 없습니다.

## 업데이트와 저장

이 스냅샷에는 `game/program-only.flag`가 포함되어 있어 번들 게임을 실행합니다. 빌드는 기존 배포자의 서명 키나 계정 데이터를 사용하지 않습니다. 기존 `game/updates/` 파일은 과거 배포 자료이며 이 스냅샷의 새 배포 채널이 아닙니다. 자세한 구조는 [ARCHITECTURE.md](docs/ARCHITECTURE.md)에 정리했습니다.

## 자산과 이용 조건

소스와 자산의 공개는 포괄적인 재배포·상업 이용 허가를 뜻하지 않습니다. 이 스냅샷은 프로젝트 전체에 대한 새 라이선스를 부여하지 않습니다. Three.js 및 WebView2 등 외부 구성 요소는 각자의 라이선스를 따릅니다. 기존 자산 크레딧은 [credits.txt](game/assets/credits.txt), 출처와 공개 범위는 [ASSETS.md](docs/ASSETS.md), 외부 고지는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)를 확인하세요.

개인 계정·세이브·브라우저 프로필·서명 개인키·캐시·중간 백업·옛 설치 프로그램은 포함하지 않았습니다.
