$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$out=Join-Path $PSScriptRoot 'model-reference-audit'
$rows=Get-Content -Raw -Encoding UTF8 (Join-Path $out 'item-model-audit.json')|ConvertFrom-Json
$work=@($rows|Where-Object status -eq 'no_model_match_in_audited_sources')
$categories=@('재료','가공품','무기와 화살','의상','갑옷과 방패','물고기','식물과 식재료','고기와 요리','교역·장비·캠페인')
$sheetDir=Join-Path $out 'item-reference-sheets'
[void][IO.Directory]::CreateDirectory($sheetDir)
$ink=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(45,39,30))
$tile=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(224,216,198))
$title=[Drawing.Font]::new('Malgun Gothic',22,[Drawing.FontStyle]::Bold)
$label=[Drawing.Font]::new('Malgun Gothic',10)
$align=[Drawing.StringFormat]::new();$align.Alignment=[Drawing.StringAlignment]::Center
for($group=0;$group -lt $categories.Count;$group++){
 $items=@($work|Where-Object category -eq $group)
 $cols=6;$capacity=24;$w=187;$h=145
 for($start=0;$start -lt $items.Count;$start+=$capacity){
  $end=[Math]::Min($start+$capacity,$items.Count)
  $num=1+[int]($start/$capacity)
  $bitmap=[Drawing.Bitmap]::new($w*$cols,72+$h*[int][Math]::Ceiling(($end-$start)/$cols))
  $g=[Drawing.Graphics]::FromImage($bitmap)
  $g.Clear([Drawing.Color]::FromArgb(239,233,219))
  $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint=[Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.DrawString(($categories[$group]+' · 게임 원화 참조 · '+$num),$title,$ink,18,11)
  for($j=$start;$j -lt $end;$j++){
   $cell=$j-$start;$x=($cell%$cols)*$w;$y=70+[Math]::Floor($cell/$cols)*$h
   $g.FillRectangle($tile,$x+3,$y+3,$w-6,$h-6)
   $img=[Drawing.Image]::FromFile((Join-Path $PSScriptRoot ('game/'+$items[$j].icon)))
   $g.DrawImage($img,$x+36,$y+3,115,115);$img.Dispose()
   $g.DrawString($items[$j].name,$label,$ink,[Drawing.RectangleF]::new($x+4,$y+116,$w-8,25),$align)
  }
  $bitmap.Save((Join-Path $sheetDir ('category-'+$group+'-'+$num+'.png')),[Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose();$bitmap.Dispose()
 }
}
$align.Dispose();$title.Dispose();$label.Dispose();$ink.Dispose();$tile.Dispose()
Write-Output ($work.Count.ToString()+' items, '+(@(Get-ChildItem -LiteralPath $sheetDir -Filter '*.png').Count)+' sheets')
