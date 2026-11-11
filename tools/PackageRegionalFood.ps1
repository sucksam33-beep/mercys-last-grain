$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$out=Join-Path $PSScriptRoot 'regional-food-delivery'
$manifest=Get-Content -Raw -Encoding UTF8 (Join-Path $out 'regional-food-manifest.json') | ConvertFrom-Json
$regions=@('아사기','브뤼넨','산타 루시아','주니퍼웰','비버턴','생오렐','암바로','카루크')
$sheet=[Drawing.Bitmap]::new(1200,998)
$g=[Drawing.Graphics]::FromImage($sheet)
$g.Clear([Drawing.Color]::FromArgb(36,33,29))
$g.TextRenderingHint=[Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$title=[Drawing.Font]::new('Malgun Gothic',27,[Drawing.FontStyle]::Bold)
$small=[Drawing.Font]::new('Malgun Gothic',10)
$medium=[Drawing.Font]::new('Malgun Gothic',12,[Drawing.FontStyle]::Bold)
$align=[Drawing.StringFormat]::new();$align.Alignment=[Drawing.StringAlignment]::Center
$tile=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(63,57,48))
$sub=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(185,167,134))
$g.DrawString(('Mercy'+[char]0x2019+'s Last Grain'),$title,[Drawing.Brushes]::Wheat,24,16)
$g.DrawString('지역 요리 24종과 식재료 3종',$medium,$sub,28,70)
$width=187;$height=165
foreach($i in 0..7){
 $x=22+($i%2)*588;$y=113+[Math]::Floor($i/2)*178
 $g.DrawString($regions[$i],$medium,[Drawing.Brushes]::Wheat,$x,$y)
 for($j=0;$j -lt 3;$j++){
  $entry=$manifest[$i*3+$j]
  $tx=$x+$j*$width;$ty=$y+25
  $g.FillRectangle($tile,$tx,$ty,$width-7,$height-18)
  $png=[Drawing.Image]::FromFile((Join-Path $PSScriptRoot ('game/'+$entry.icon)))
  $g.DrawImage($png,$tx+32,$ty+5,115,115);$png.Dispose()
  $g.DrawString($entry.name,$small,[Drawing.Brushes]::Wheat,[Drawing.RectangleF]::new($tx+3,$ty+118,$width-13,27),$align)
 }
}
$g.DrawString('새 식재료',$medium,[Drawing.Brushes]::Wheat,22,836)
for($j=0;$j -lt 3;$j++){
 $entry=$manifest[24+$j];$x=22+$j*$width;$y=861
 $g.FillRectangle($tile,$x,$y,$width-7,113)
 $png=[Drawing.Image]::FromFile((Join-Path $PSScriptRoot ('game/'+$entry.icon)))
 $g.DrawImage($png,$x+49,$y+2,80,80);$png.Dispose()
 $g.DrawString($entry.name,$small,[Drawing.Brushes]::Wheat,[Drawing.RectangleF]::new($x+3,$y+83,$width-13,27),$align)
}
$sheet.Save((Join-Path $out 'food-contact-sheet.png'),[Drawing.Imaging.ImageFormat]::Png)
$align.Dispose();$small.Dispose();$medium.Dispose();$title.Dispose();$tile.Dispose();$sub.Dispose();$g.Dispose();$sheet.Dispose()
foreach($entry in $manifest){
 $dest=Join-Path $out $entry.icon
 [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest))
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('game/'+$entry.icon)) -Destination $dest -Force
}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath (Join-Path $PSScriptRoot 'mercy-regional-food-icons.zip') -Force
