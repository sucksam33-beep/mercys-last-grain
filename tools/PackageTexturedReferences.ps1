$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$out=Join-Path $PSScriptRoot 'mercy-185-textured-references'
$itemsDir=Join-Path $out 'items'
$sheetsDir=Join-Path $out 'sheets'
foreach($dir in @($out,$itemsDir,$sheetsDir)){[void][IO.Directory]::CreateDirectory($dir)}
$spec=Get-Content (Join-Path $out 'production-map.json') -Raw -Encoding UTF8|ConvertFrom-Json
$manifest=@()
function Find-Gutter($bmp,[bool]$vertical,[int]$ordinal){
 $length=if($vertical){$bmp.Width}else{$bmp.Height}
 $cross=if($vertical){$bmp.Height}else{$bmp.Width}
 $center=[int][Math]::Round($length*$ordinal/3)
 $left=[int]($center-$length*.055);$right=[int]($center+$length*.055)
 $candidates=@()
 for($i=$left;$i -le $right;$i++){
  $bright=0;$total=0
  for($j=15;$j -lt $cross-15;$j+=8){
   $pixel=if($vertical){$bmp.GetPixel($i,$j)}else{$bmp.GetPixel($j,$i)}
   if($pixel.R -ge 234 -and $pixel.G -ge 234 -and $pixel.B -ge 234){$bright++}
   $total++
  }
  if($bright -ge $total*.90){$candidates+=$i}
 }
 if(!$candidates.Count){return $center}
 return [int][Math]::Round(($candidates|Measure-Object -Average).Average)
}
foreach($board in $spec){
 $photo=[Drawing.Bitmap]::new($board.source)
 $xs=@(0,(Find-Gutter $photo $true 1),(Find-Gutter $photo $true 2),$photo.Width)
 $ys=@(0,(Find-Gutter $photo $false 1),(Find-Gutter $photo $false 2),$photo.Height)
 for($i=0;$i -lt $board.entries.Count;$i++){
  $col=$i%3;$row=[int][Math]::Floor($i/3)
  $x=$xs[$col]+4;$y=$ys[$row]+4;$w=$xs[$col+1]-$x-4;$h=$ys[$row+1]-$y-4
  $entry=$board.entries[$i]
  $file=('items/{0:D3}-{1}.png' -f [int]$entry.number,$entry.slug)
  $tile=$photo.Clone([Drawing.Rectangle]::new($x,$y,$w,$h),[Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $tile.Save((Join-Path $out $file),[Drawing.Imaging.ImageFormat]::Png);$tile.Dispose()
  $manifest+=@{number=$entry.number;id=$entry.id;name=$entry.name;category=$entry.category;group=$board.id;png=$file;width=$w;height=$h}
 }
 $photo.Dispose()
}
$manifest=@($manifest|Sort-Object number)
if($manifest.Count -ne 185 -or @($manifest.id|Sort-Object -Unique).Count -ne 185){throw 'Expected 185 distinct item IDs'}
$hashes=@{}
foreach($row in $manifest){
 $hash=(Get-FileHash (Join-Path $out $row.png)).Hash
 if($hashes.ContainsKey($hash)){throw ('Duplicate image: '+$row.name)}
 $hashes[$hash]=$true
}
[IO.File]::WriteAllText((Join-Path $out 'manifest.json'),(ConvertTo-Json -InputObject $manifest -Depth 5),[Text.UTF8Encoding]::new($false))
$ink=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(39,36,32))
$card=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(242,238,232))
$header=[Drawing.Font]::new('Malgun Gothic',29,[Drawing.FontStyle]::Bold)
$label=[Drawing.Font]::new('Malgun Gothic',11)
$format=[Drawing.StringFormat]::new()
$format.Alignment=[Drawing.StringAlignment]::Center;$format.LineAlignment=[Drawing.StringAlignment]::Center
$format.Trimming=[Drawing.StringTrimming]::EllipsisCharacter
function Sheet($rows,[string]$title,[string]$path,[int]$cols,[int]$width,[int]$height){
 $b=[Drawing.Bitmap]::new($cols*$width,(74+[int][Math]::Ceiling($rows.Count/$cols)*$height))
 $g=[Drawing.Graphics]::FromImage($b)
 $g.Clear([Drawing.Color]::FromArgb(224,218,207))
 $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
 $g.TextRenderingHint=[Drawing.Text.TextRenderingHint]::AntiAliasGridFit
 $g.DrawString($title,$header,$ink,19,10)
 for($i=0;$i -lt $rows.Count;$i++){
  $r=$rows[$i];$x=($i%$cols)*$width;$y=74+[Math]::Floor($i/$cols)*$height
  $g.FillRectangle($card,$x+3,$y+2,$width-6,$height-5)
  $p=[Drawing.Image]::FromFile((Join-Path $out $r.png))
  $areaH=$height-38;$areaW=$width-10
  $fit=[Math]::Min($areaH/$p.Height,$areaW/$p.Width)
  $w=[int]($p.Width*$fit);$h=[int]($p.Height*$fit)
  $g.DrawImage($p,[int]($x+($width-$w)/2),[int]($y+3+($areaH-$h)/2),$w,$h);$p.Dispose()
  $g.DrawString(('{0:D3}  {1}' -f [int]$r.number,$r.name),$label,$ink,[Drawing.RectangleF]::new($x+4,$y+$areaH+3,$width-8,31),$format)
 }
 $b.Save($path,[Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose();$b.Dispose()
}
Sheet $manifest '3D 제작 참조 · 전체 185개' (Join-Path $out 'all-185-contact-sheet.png') 10 210 182
foreach($g in @('fish','hide','object')){
 $rows=@($manifest|Where-Object group -like ($g+'-*'))
 $title=switch($g){fish{'물고기와 치어'}hide{'가죽·모피·깃털과 안감'}object{'도구·의상·재료와 기타 아이템'}}
 for($i=0;$i -lt $rows.Count;$i+=24){
  $p=1+[int]($i/24);$chunk=@($rows|Select-Object -Skip $i -First 24)
  Sheet $chunk ($title+' · '+$p) (Join-Path $sheetsDir ($g+'-'+$p+'.png')) 6 235 209
 }
}
$format.Dispose();$header.Dispose();$label.Dispose();$ink.Dispose();$card.Dispose()
$env:TEMP=Join-Path $PSScriptRoot 'inventory-headless-temp';$env:TMP=$env:TEMP
$bundle=@('items','sheets','manifest.json','all-185-contact-sheet.png')|ForEach-Object {Join-Path $out $_}
Compress-Archive -LiteralPath $bundle -DestinationPath (Join-Path $PSScriptRoot 'mercy-185-textured-references.zip') -Force
Write-Output ($manifest.Count.ToString()+' unique images')
