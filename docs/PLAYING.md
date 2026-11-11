# 실행과 플레이

1. `scripts/Build.ps1`로 빌드합니다.
2. `dist/ReturningWaters.exe`를 실행합니다. EXE만 다른 폴더로 옮기지 마세요.
3. 제목 화면에서 로컬 계정을 만들고 로그인합니다.
4. 게임을 시작하고 화면의 이야기와 상호작용 안내를 따릅니다.

## 저장

기본 데이터 폴더는 `%LOCALAPPDATA%\ReturningWaters`입니다. 계정 목록, 세션 정보, 자동·수동 세이브, WebView2 프로필 등이 이 폴더에 저장됩니다. 저장 폴더는 공개 저장소에 포함하지 않습니다.

테스트용으로 저장 폴더를 분리하려면 실행 전에 환경 변수를 지정합니다.

```powershell
$env:RETURNING_WATERS_DATA = Join-Path $env:TEMP 'MercysLastGrain-Dev'
.\dist\ReturningWaters.exe
```

계정은 로컬 계정입니다. 다른 컴퓨터와 자동 동기화되지 않습니다. 백업하려면 게임을 종료한 뒤 데이터 폴더를 개인 저장소에 복사하세요. 비밀번호는 해시로 저장되지만 이 폴더 전체는 개인 정보로 취급해야 합니다.

## 조작

WASD/방향키 이동, 마우스 시점, 휠 거리 조절, E 상호작용, Shift 회피·질주, Space 점프, Tab 가방, I 플레이어, J 퀘스트, M 지도, V 말 호출, R 승하차, Q 대상 고정, F 전기, Esc 일시정지, Enter 메뉴 확인입니다. 진행 상황에 따라 일부 동작은 사용할 수 없습니다.

게임패드·상세 배치는 게임 안의 조작 안내와 `game/ControlDiagrams.js`, `game/CombatControls.js`를 참고하세요.

## 문제 해결

- 창이 뜨지 않으면 WebView2 Runtime과 .NET Framework 4.8 설치 여부를 확인합니다.
- 영상이나 모델을 읽지 못하면 `git lfs pull`을 실행하고 `scripts/Validate.mjs`로 누락 파일을 검사합니다.
- `desktop.html`은 C# 호스트와 메시지를 주고받습니다. 파일을 더블 클릭하는 방식은 Windows 앱 실행을 대체하지 않습니다.
- 이 스냅샷은 기존 배포 프로그램의 사용자 데이터 형식과 같은 이름을 사용합니다. 개발 빌드에서는 위 환경 변수로 테스트 데이터를 분리하는 것을 권장합니다.
