# Windows 게임 업데이트 배포

웹 게임 배포 직전에 Sites 체크아웃에서 `scripts/MakeWindowsRelease.cjs`를 실행한다. 게임 파일과 생성된 `dist/updates/windows.json`을 같은 Sites 버전으로 배포한다.

```powershell
node scripts/MakeWindowsRelease.cjs dist "플레이어에게 표시할 변경 내용"
```

게임 파일이 바뀌면 목록의 버전과 파일 해시가 바뀐다. Windows 런처는 이 목록을 시작 화면에서 확인한다. 목록을 생성한 뒤 게임 파일을 수정했다면 목록을 다시 생성하고 패키징한다.

런처 실행 파일이나 타이틀 화면을 바꿀 때는 이전보다 큰 런처 버전 번호로 빌드한다.

```powershell
./windows-game/Build.ps1 -UsePublishedGame -LauncherRevision 3 -PublishLauncher
```

게임 파일과 함께 생성된 `dist/updates/launcher.json`과 `dist/updates/launcher-3.zip`을 배포한다. 이미 게시한 런처 번호는 재사용하지 않는다. `.signing`의 서명 키는 설치 파일과 Sites 소스에서 제외하고 기존 Windows 계정으로 보관한다.

자동 갱신을 지원하는 설치 파일을 이미 설치한 사용자는 시작 화면에서 새 런처를 받을 수 있다. 런처는 설치된 실행 파일 옆에 덮어쓰는 대신 사용자 데이터에 검증된 버전을 따로 준비하고, 새 창이 시작된 뒤 해당 버전을 활성화한다.
