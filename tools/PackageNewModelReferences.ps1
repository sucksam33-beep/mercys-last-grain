$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$out=Join-Path $PSScriptRoot 'mercy-new-model-references'
$items=@(Get-Content (Join-Path $out 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json)
if($items.Count -ne 185){throw 'Expected 185 items'}
$sheetDir=Join-Path $out 'sheets'
[void][IO.Directory]::CreateDirectory($sheetDir)
$ink=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(48,42,34))
$muted=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(100,86,70))
$paper=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(243,238,227))
$main=[Drawing.Font]::new('Malgun Gothic',26,[Drawing.FontStyle]::Bold)
$label=[Drawing.Font]::new('Malgun Gothic',11)
$small=[Drawing.Font]::new('Malgun Gothic',10)
$center=[Drawing.StringFormat]::new()
$center.Alignment=[Drawing.StringAlignment]::Center
$center.LineAlignment=[Drawing.StringAlignment]::Center
$center.Trimming=[Drawing.StringTrimming]::EllipsisCharacter
$caption=@('재료','가공품','무기와 화살','의상','갑옷과 방패','물고기','식재료','기본 식사','교역·장비·캠페인')
$index=@{}; for($i=0;$i -lt $items.Count;$i++){$index[$items[$i].id]=$i+1}
function Sheet($rows,[string]$heading,[string]$file,[int]$cols,[int]$cellW,[int]$cellH){
 $height=88+[int][Math]::Ceiling($rows.Count/$cols)*$cellH
 $bitmap=[Drawing.Bitmap]::new($cellW*$cols,$height)
 $g=[Drawing.Graphics]::FromImage($bitmap)
 $g.Clear([Drawing.Color]::FromArgb(226,218,202))
 $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
 $g.TextRenderingHint=[Drawing.Text.TextRenderingHint]::AntiAliasGridFit
 $g.DrawString($heading,$main,$ink,17,11)
 $g.DrawString('Mercy'+[char]0x2019+'s Last Grain · 3D 제작용 새 렌더 · 기본 각도',$small,$muted,20,57)
 for($j=0;$j -lt $rows.Count;$j++){
  $row=$rows[$j];$x=($j%$cols)*$cellW;$y=88+[Math]::Floor($j/$cols)*$cellH
  $g.FillRectangle($paper,$x+3,$y+2,$cellW-6,$cellH-6)
  $photo=Join-Path $out $row.reference
  $img=[Drawing.Image]::FromFile($photo)
  $size=$cellH-44
  $g.DrawImage($img,[int]($x+($cellW-$size)/2),$y+3,$size,$size)
  $img.Dispose()
  $num=('{0:D3}' -f $index[$row.id])
  $g.DrawString(($num+'  '+$row.name),$label,$ink,[Drawing.RectangleF]::new($x+4,$y+$size+4,$cellW-8,33),$center)
 }
 $bitmap.Save($file,[Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose();$bitmap.Dispose()
}
Sheet $items '새 3D 제작 참조 · 전체 185개' (Join-Path $out 'all-185-contact-sheet.png') 10 206 184
for($group=0;$group -lt $caption.Count;$group++){
 $rows=@($items|Where-Object category -eq $group)
 for($start=0;$start -lt $rows.Count;$start+=24){
  $page=1+[int]($start/24)
  $chunk=@($rows|Select-Object -Skip $start -First 24)
  Sheet $chunk ($caption[$group]+' · '+$page) (Join-Path $sheetDir ('category-'+$group+'-'+$page+'.png')) 6 214 190
 }
}
$ink.Dispose();$muted.Dispose();$paper.Dispose();$main.Dispose();$label.Dispose();$small.Dispose();$center.Dispose()
$env:TEMP=Join-Path $PSScriptRoot 'inventory-headless-temp';$env:TMP=$env:TEMP
Compress-Archive -Path (Join-Path $out '*') -DestinationPath (Join-Path $PSScriptRoot 'mercy-185-new-model-references.zip') -Force
$files=@(Get-ChildItem (Join-Path $out 'items') -Filter '*.png' -File)
if($files.Count -ne 370){throw 'Expected 370 PNGs'}
Write-Output ($items.Count.ToString()+' items, '+$files.Count+' views, '+@(Get-ChildItem $sheetDir -Filter '*.png' -File).Count+' category sheets')
