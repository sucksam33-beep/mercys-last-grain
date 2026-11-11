$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$game=Join-Path $PSScriptRoot 'game'
$out=Join-Path $PSScriptRoot 'inventory-delivery'
$source=Join-Path $game 'assets/item-icons/manifest.json'
$entries=[IO.File]::ReadAllText($source) | ConvertFrom-Json
$dirs=@($out,(Join-Path $out 'contact-sheets'),(Join-Path $out 'assets/item-icons'),(Join-Path $out 'captures'))
foreach($dir in $dirs){[void][IO.Directory]::CreateDirectory($dir)}
$groups=[ordered]@{
 timber=@{Title='목재 4등급'; Items=@($entries | Where-Object {$_.id -like 'timber_*'})}
 weapons=@{Title='Fal 무기 54종'; Items=@($entries | Where-Object {$_.art -eq 'previous-render' -and $_.id -notlike 'timber_*'})}
}
$labels=@('재료','가공품','기본 무기·화살','의상','갑옷·방패','물고기','식물','고기·요리','교역·상점·캠페인')
for($i=0;$i -lt $labels.Count;$i++){$groups["category-$i"]=@{Title=$labels[$i];Items=@($entries | Where-Object {$_.category -eq $i -and $_.art -ne 'previous-render'})}}
foreach($entry in $groups.GetEnumerator()){
 $items=$entry.Value.Items
 $pageSize=35;$columns=7;$cellWidth=174;$cellHeight=143
 for($start=0;$start -lt $items.Count;$start+=$pageSize){
  $end=[Math]::Min($start+$pageSize,$items.Count)
  $rows=[int][Math]::Ceiling(($end-$start)/$columns)
  $sheet=[Drawing.Bitmap]::new($cellWidth*$columns,59+$cellHeight*$rows)
  $g=[Drawing.Graphics]::FromImage($sheet)
  $g.Clear([Drawing.Color]::FromArgb(34,32,29))
  $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint=[Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $tile=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(63,59,52))
  $heading=[Drawing.Font]::new('Malgun Gothic',21,[Drawing.FontStyle]::Bold)
  $label=[Drawing.Font]::new('Malgun Gothic',10)
  $align=[Drawing.StringFormat]::new()
  $align.Alignment=[Drawing.StringAlignment]::Center
  $page=1+[int]($start/$pageSize)
  $g.DrawString(($entry.Value.Title+'   '+$page+'/'+[Math]::Ceiling($items.Count/$pageSize)),$heading,[Drawing.Brushes]::Wheat,20,10)
  for($i=$start;$i -lt $end;$i++){
   $offset=$i-$start
   $x=($offset%$columns)*$cellWidth
   $y=59+[Math]::Floor($offset/$columns)*$cellHeight
   $g.FillRectangle($tile,$x+4,$y+4,$cellWidth-8,$cellHeight-8)
   $image=[Drawing.Image]::FromFile((Join-Path $game $items[$i].icon))
   $g.DrawImage($image,$x+31,$y+6,112,112)
   $image.Dispose()
   $labelBox=[Drawing.RectangleF]::new($x+4,$y+117,$cellWidth-8,25)
   $g.DrawString($items[$i].name,$label,[Drawing.Brushes]::Wheat,$labelBox,$align)
  }
  $sheet.Save((Join-Path $out ('contact-sheets/'+$entry.Key+'-'+$page+'.png')),[Drawing.Imaging.ImageFormat]::Png)
  $align.Dispose();$label.Dispose();$heading.Dispose();$tile.Dispose();$g.Dispose();$sheet.Dispose()
 }
}
$hashes=@{}
foreach($item in $entries){
 $src=Join-Path $game $item.icon
 $hash=(Get-FileHash -LiteralPath $src).Hash
 if($hashes.ContainsKey($hash)){throw ('Duplicate '+$item.id)}
 $hashes[$hash]=$true
 Copy-Item -LiteralPath $src -Destination (Join-Path $out $item.icon) -Force
}
Copy-Item -LiteralPath $source -Destination (Join-Path $out 'item-icon-manifest.json') -Force
foreach($image in @('inventory-in-game.png','codex-in-game.png','comparison-in-game.png','placement-in-game.png')){
 $src=Join-Path $PSScriptRoot ('item-art-delivery/'+$image)
 if(Test-Path -LiteralPath $src){Copy-Item -LiteralPath $src -Destination (Join-Path $out 'captures') -Force}
}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath (Join-Path $PSScriptRoot 'returning-waters-371-item-icons.zip') -Force
Write-Output ('Verified '+$hashes.Count+' separate PNGs and '+(Get-ChildItem (Join-Path $out 'contact-sheets') -File).Count+' contact sheets')
