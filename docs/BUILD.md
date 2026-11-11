# Windows 개발 빌드

## 준비

- Windows 10/11 x64와 .NET Framework 4.8.
- Microsoft Edge WebView2 Runtime.
- PowerShell 5.1 이상.
- Git 및 Git LFS. 복제 후 `git lfs pull`을 실행합니다.
- Node.js는 파일 검증과 기존 제작 도구에만 필요하며 Windows 호스트 빌드 자체에는 필요하지 않습니다.

## 빌드

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Build.ps1
.\dist\ReturningWaters.exe
```

스크립트는 Microsoft.Web.WebView2 **1.0.3650.58** NuGet 패키지를 `.build/`에 복원하고, Windows에 포함된 .NET Framework C# 컴파일러로 호스트를 빌드합니다. 결과는 `dist/`에 들어갑니다. SDK가 이미 있다면 경로를 지정할 수 있습니다.

```powershell
.\scripts\Build.ps1 -SdkPath 'C:\path\to\unpacked-webview2-sdk'
```

게임의 모든 파일을 `dist/game/`에 복사하며 로컬 전용 플래그를 확인합니다. 전체 복사에 약 700MB 이상의 여유 공간이 필요합니다. 기존 `dist/game/`에 남은 옛 파일은 자동 삭제하지 않으므로 파일을 제거하는 변경을 적용할 때는 새 출력 폴더를 지정하세요.

```powershell
.\scripts\Build.ps1 -OutputPath '.\dist\fresh-build'
```

`dist/`와 `.build/`는 Git에 포함하지 않습니다. 빌드는 기존 계정·세이브나 배포 서명 개인키를 읽지 않습니다. 개발용 공개 검증키는 매번 생성하며 개인키는 디스크에 저장하지 않습니다. 기존 공식 런처 업데이트와 호환되는 배포를 만들려면 원래 배포 관리 절차가 별도로 필요합니다.

## 검사

```powershell
node .\scripts\Validate.mjs
```

검사는 기록된 파일 크기와 SHA-256, 필수 파일, LFS 다운로드 여부를 확인합니다. C# 컴파일 성공과 파일 검사는 실제 게임 플레이·오프닝 재생·전체 캠페인 완료를 보증하지 않습니다.

## 과거 스크립트

`tools/HistoricalBuild.ps1`과 `docs/HISTORICAL-RELEASING.md`는 기존 제작 환경의 참고용 원본입니다. 절대 경로, 옛 배포 채널, 서명키 저장소를 전제로 하므로 현재 빌드에는 `scripts/Build.ps1`를 사용하세요.
