$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$out=Join-Path $PSScriptRoot 'model-reference-audit'
$targets=@('generated-boards','generated-tiles','inventory-source-art')
foreach($dir in $targets){[void][IO.Directory]::CreateDirectory((Join-Path $out $dir))}
$rows=Get-Content -Raw -Encoding UTF8 (Join-Path $out 'item-model-audit.json')|ConvertFrom-Json
$food=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'regional-food-delivery/regional-food-manifest.json')|ConvertFrom-Json
$boards=Get-Content -Raw -Encoding UTF8 (Join-Path $out 'board-sources.json')|ConvertFrom-Json
$names=@{
 rural=@('벌목 오두막과 작업터','채석장 작업소','공동 생활터 헛간과 텃밭','낚시 데크와 양식 가두리')
 market=@('도구점 카운터','식료품점 가판대','정육점과 생선대','공동 화덕과 건조대')
 infrastructure=@('수문과 조작 장치','수차와 정밀 수문틀','창고 앞 경계초소','역 승강장과 적재 시설')
 nature=@('계단식 논과 관개 도랑','갈대와 자갈 하안','붉은 협곡 절개면','빙하 만 눈 덮인 해안')
 interiors=@('부엌 조리대','침실과 침대','화장실 칸막이와 세면대','저장고 선반')
 waterfront=@('나무다리','물가 돌계단과 배수','생오렐 선착장','암바로 선착장')
 workshops=@('목공 작업대','바느질·무두질 작업대','가마·화덕','공동 식탁')
}
$tiles=@()
foreach($board in $boards){
 $id=$board.id
 $boardRelative='generated-boards/'+$id+'.png'
 $dest=Join-Path $out $boardRelative
 Copy-Item -LiteralPath $board.source -Destination $dest -Force
 $image=[Drawing.Bitmap]::new($dest)
 $colCount=2;$group=$names[$id]
 if($id -match '^food-([1-4])$'){
  $colCount=3;$group=@($food|Select-Object -Skip (([int]$Matches[1]-1)*6) -First 6)
 }
 for($i=0;$i -lt $group.Count;$i++){
  $col=$i%$colCount;$row=[Math]::Floor($i/$colCount)
  $x=[int][Math]::Floor($image.Width*$col/$colCount)
  $x2=[int][Math]::Floor($image.Width*($col+1)/$colCount)
  $y=[int][Math]::Floor($image.Height*$row/2)
  $y2=[int][Math]::Floor($image.Height*($row+1)/2)
  $box=[Drawing.Rectangle]::new($x,$y,$x2-$x,$y2-$y)
  $tile=$image.Clone($box,[Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $assetId=if($colCount -eq 3){$group[$i].id}else{$id+'-'+($i+1)}
  $assetName=if($colCount -eq 3){$group[$i].name}else{$group[$i]}
  $relative='generated-tiles/'+$assetId+'.png'
  $tile.Save((Join-Path $out $relative),[Drawing.Imaging.ImageFormat]::Png)
  $tile.Dispose()
  $tiles+=@{id=$assetId;name=$assetName;reference=$relative;board=$boardRelative}
 }
 $image.Dispose()
}
foreach($row in ($rows|Where-Object status -eq 'no_model_match_in_audited_sources')){
 $file=Split-Path $row.icon -Leaf
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('game/'+$row.icon)) -Destination (Join-Path $out ('inventory-source-art/'+$file)) -Force
}
[IO.File]::WriteAllText((Join-Path $out 'generated-reference-manifest.json'),(ConvertTo-Json -InputObject $tiles -Depth 4),[Text.UTF8Encoding]::new($false))
$env:TEMP=Join-Path $PSScriptRoot 'inventory-headless-temp';$env:TMP=$env:TEMP
$paths=Get-ChildItem -LiteralPath $out | Where-Object Name -ne 'board-sources.json' | ForEach-Object FullName
Compress-Archive -LiteralPath $paths -DestinationPath (Join-Path $PSScriptRoot 'mercy-model-reference-pack.zip') -Force
Write-Output ($tiles.Count.ToString()+' generated references')
