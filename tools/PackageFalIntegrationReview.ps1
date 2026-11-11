$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$out=Join-Path $PSScriptRoot 'fal-integration-review'
$game=Join-Path $PSScriptRoot 'game'
$report=Get-Content (Join-Path $out 'fal-asset-list.json') -Raw -Encoding UTF8|ConvertFrom-Json
$inventory=Get-Content (Join-Path $PSScriptRoot 'inventory-audit.json') -Raw -Encoding UTF8|ConvertFrom-Json
$lookup=@{}; foreach($item in $inventory){$lookup[$item.id]=$item.icon}
$dir=Join-Path $out 'comparison-sheets'
[void][IO.Directory]::CreateDirectory($dir)
$ink=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(236,225,204))
$muted=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(189,177,157))
$tile=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(65,59,52))
$panel=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(52,49,44))
$title=[Drawing.Font]::new('Malgun Gothic',23,[Drawing.FontStyle]::Bold)
$label=[Drawing.Font]::new('Malgun Gothic',13,[Drawing.FontStyle]::Bold)
$small=[Drawing.Font]::new('Malgun Gothic',9)
$center=[Drawing.StringFormat]::new();$center.Alignment=[Drawing.StringAlignment]::Center;$center.Trimming=[Drawing.StringTrimming]::EllipsisCharacter
function Fit($g,$p,[int]$x,[int]$y,[int]$width,[int]$height){
 if(!$p -or !(Test-Path -LiteralPath $p -PathType Leaf)){return}
 $image=[Drawing.Image]::FromFile($p)
 $scale=[Math]::Min($width/$image.Width,$height/$image.Height)
 $w=[int]($image.Width*$scale);$h=[int]($image.Height*$scale)
 $g.DrawImage($image,[int]($x+($width-$w)/2),[int]($y+($height-$h)/2),$w,$h)
 $image.Dispose()
}
$groups=[ordered]@{reused='이번에 연결한 기존 Fal 소품';weapons='기존 적용 · 무기 변형 54종';ingredients='기존 적용 · 식재료 80종';materials='기존 적용 · 제작 재료 모델 55개'}
foreach($key in $groups.Keys){
 $rows=@($report.rows|Where-Object group -eq $key)
 $cols=if($key -eq 'reused'){2}else{3}
 $width=if($key -eq 'reused'){450}else{374}
 $height=if($key -eq 'reused'){260}else{219}
 $pageSize=if($key -eq 'reused'){4}else{12}
 for($start=0;$start -lt $rows.Count;$start+=$pageSize){
  $current=@($rows|Select-Object -Skip $start -First $pageSize)
  $page=[int]($start/$pageSize)+1
  $sheet=[Drawing.Bitmap]::new($cols*$width,(75+[int][Math]::Ceiling($current.Count/$cols)*$height))
  $g=[Drawing.Graphics]::FromImage($sheet)
  $g.Clear([Drawing.Color]::FromArgb(38,35,31))
  $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint=[Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.DrawString(($groups[$key]+' · '+$page),$title,$ink,18,9)
  $g.DrawString('왼쪽은 적용 전 원화 또는 기존 아이콘 · 오른쪽은 현재 빌드에 포함된 GLB 렌더',$small,$muted,21,49)
  for($i=0;$i -lt $current.Count;$i++){
   $row=$current[$i];$x=($i%$cols)*$width;$y=75+[int][Math]::Floor($i/$cols)*$height
   $g.FillRectangle($panel,$x+4,$y+3,$width-8,$height-6)
   $g.DrawString($row.name,$label,$ink,[Drawing.RectangleF]::new($x+5,$y+8,$width-10,24),$center)
   $half=[int]($width/2);$top=$y+37;$innerH=$height-71
   $g.FillRectangle($tile,$x+12,$top,$half-18,$innerH)
   $g.FillRectangle($tile,$x+$half+6,$top,$half-18,$innerH)
   $before=if($row.before){Join-Path $game $row.before}else{$null}
   if(!$before -or $before -like '*.webp' -or !(Test-Path -LiteralPath $before -PathType Leaf)){
    $before=if($lookup[$row.id]){Join-Path $game $lookup[$row.id]}else{$null}
   }
   Fit $g $before ($x+17) ($top+4) ($half-28) ($innerH-8)
   Fit $g (Join-Path $out $row.preview) ($x+$half+11) ($top+4) ($half-28) ($innerH-8)
   $g.DrawString('기존 원화·아이콘',$small,$muted,[Drawing.RectangleF]::new($x+8,$y+$height-30,$half-14,17),$center)
   $g.DrawString('현재 모델',$small,$ink,[Drawing.RectangleF]::new($x+$half+6,$y+$height-30,$half-14,17),$center)
  }
  $sheet.Save((Join-Path $dir ($key+'-'+$page+'.png')),[Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose();$sheet.Dispose()
 }
}
$center.Dispose();$ink.Dispose();$muted.Dispose();$tile.Dispose();$panel.Dispose();$title.Dispose();$label.Dispose();$small.Dispose()
$env:TEMP=Join-Path $PSScriptRoot 'inventory-headless-temp';$env:TMP=$env:TEMP
$deliver=@('fal-asset-list.json','comparison-sheets','model-renders','headless-runtime.json')|ForEach-Object {Join-Path $out $_}|Where-Object {Test-Path -LiteralPath $_}
Compress-Archive -LiteralPath $deliver -DestinationPath (Join-Path $PSScriptRoot 'mercy-fal-integration-review.zip') -Force
Write-Output ((Get-ChildItem $dir -Filter *.png -File|Measure-Object).Count.ToString()+' comparison sheets')
