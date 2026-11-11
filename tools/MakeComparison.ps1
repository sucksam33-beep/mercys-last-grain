$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$folder=Join-Path $PSScriptRoot 'comparison'
$names=@('title','map','valley')
$labels=@('01  시작 화면','02  여정 지도','03  아사기–브뤼넨 방향의 계곡')
$canvas=[Drawing.Bitmap]::new(1400,1540)
$graphics=[Drawing.Graphics]::FromImage($canvas)
$graphics.Clear([Drawing.Color]::FromArgb(20,29,27))
$graphics.InterpolationMode='HighQualityBicubic'
$graphics.TextRenderingHint='AntiAliasGridFit'
$title=[Drawing.Font]::new('Malgun Gothic',26,[Drawing.FontStyle]::Bold)
$small=[Drawing.Font]::new('Malgun Gothic',16,[Drawing.FontStyle]::Bold)
$note=[Drawing.Font]::new('Malgun Gothic',11)
$white=[Drawing.Brushes]::WhiteSmoke
$gold=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(236,204,137))
try{
 $graphics.DrawString('왕이 먹는 흙  |  Windows 실행 화면 비교',$title,$white,24,18)
 $graphics.DrawString('적용 전 · 기존 캠페인 빌드',$small,$gold,24,80)
 $graphics.DrawString('적용 후 · 로컬 오픈월드 빌드',$small,$gold,711,80)
 for($i=0;$i -lt $names.Length;$i++){
  $y=130+$i*460
  $graphics.DrawString($labels[$i],$small,$white,24,$y)
  for($side=0;$side -lt 2;$side++){
   $version=@('before','after')[$side]
   $image=[Drawing.Image]::FromFile((Join-Path $folder "$version-$($names[$i]).png"))
   try{$graphics.DrawImage($image,[Drawing.Rectangle]::new(24+$side*687,$y+38,665,416))}
   finally{$image.Dispose()}
  }
 }
 $graphics.DrawString('Windows 게임 창에서 캡처한 동일 종류의 화면 · 여정 지도는 첨부 지도를 적용한 모습',$note,$gold,24,1518)
 $canvas.Save((Join-Path $folder 'Windows-before-after.jpg'),[Drawing.Imaging.ImageFormat]::Jpeg)
}finally{
 $gold.Dispose();$title.Dispose();$small.Dispose();$note.Dispose();$graphics.Dispose();$canvas.Dispose()
}
