param([string]$Root=$PSScriptRoot)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$game=Join-Path $Root 'game'
$out=Join-Path $Root 'item-art-delivery'
[void][IO.Directory]::CreateDirectory($out)
$groups=@(
 @{Key='timber'; Title='목재 4등급'; Columns=4},
 @{Key='weapon'; Title='무기 54종'; Columns=6}
)
$manifest=@()
foreach($group in $groups){
 $items=[IO.File]::ReadAllText((Join-Path $game ('assets/item-icons/'+$group.Key+'-manifest.json'))) | ConvertFrom-Json
 $manifest+=@($items)
 $columns=$group.Columns
 $width=184
 $height=158
 $rows=[int][Math]::Ceiling($items.Count/$columns)
 $sheet=[Drawing.Bitmap]::new($width*$columns,64+$height*$rows)
 $draw=[Drawing.Graphics]::FromImage($sheet)
 $draw.Clear([Drawing.Color]::FromArgb(31,30,27))
 $draw.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
 $draw.TextRenderingHint=[Drawing.Text.TextRenderingHint]::AntiAliasGridFit
 $titleFont=[Drawing.Font]::new('Malgun Gothic',22,[Drawing.FontStyle]::Bold)
 $labelFont=[Drawing.Font]::new('Malgun Gothic',10)
 $ink=[Drawing.Brushes]::Wheat
 $tile=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(47,43,37))
 $format=[Drawing.StringFormat]::new()
 $format.Alignment=[Drawing.StringAlignment]::Center
 $draw.DrawString($group.Title,$titleFont,$ink,20,13)
 for($i=0;$i -lt $items.Count;$i++){
  $x=($i%$columns)*$width
  $y=64+[Math]::Floor($i/$columns)*$height
  $draw.FillRectangle($tile,$x+4,$y+4,$width-8,$height-8)
  $image=[Drawing.Image]::FromFile((Join-Path $game $items[$i].icon))
  $draw.DrawImage($image,$x+30,$y+6,124,124)
  $image.Dispose()
  $label=[Drawing.RectangleF]::new($x+4,$y+129,$width-8,26)
  $draw.DrawString($items[$i].name,$labelFont,$ink,$label,$format)
 }
 $sheet.Save((Join-Path $out ($group.Key+'-contact-sheet.png')),[Drawing.Imaging.ImageFormat]::Png)
 $format.Dispose();$tile.Dispose();$labelFont.Dispose();$titleFont.Dispose();$draw.Dispose();$sheet.Dispose()
}
$hashes=@{}
foreach($item in $manifest){
 $file=Join-Path $game $item.icon
 $hash=(Get-FileHash -LiteralPath $file).Hash
 if($hashes.ContainsKey($hash)){throw ('Duplicate icon: '+$item.id)}
 $hashes[$hash]=$true
 $dest=Join-Path $out $item.icon
 [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest))
 Copy-Item -LiteralPath $file -Destination $dest -Force
}
[IO.File]::WriteAllText((Join-Path $out 'item-icon-manifest.json'),(ConvertTo-Json -Depth 5 -InputObject $manifest),[Text.UTF8Encoding]::new($false))
Compress-Archive -Path (Join-Path $out '*') -DestinationPath (Join-Path $Root 'returning-waters-58-item-icons.zip') -Force
Write-Output ('Verified distinct icons: '+$hashes.Count)
