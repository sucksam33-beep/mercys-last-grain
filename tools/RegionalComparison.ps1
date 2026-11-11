$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$folder=Join-Path $PSScriptRoot 'comparison/regional-graphics'
$regions=@('아사기','브뤼넨','산타 루시아','주니퍼웰','비버턴','생오렐','암바로','카루크')
$routes=@('계곡 연결로','계곡 연결로','협곡 고원길','삼나무 고갯길','빙하 만 제방길','연안 둑길','연안 둑길','빙하 만 제방길')
$files=@('asagi','brunnen','santa-lucia','juniperwell','beaverton','saint-aurel','ambaro','karuk')
$bg=[Drawing.Color]::FromArgb(22,28,26)
$heading=[Drawing.Font]::new('Malgun Gothic',25,[Drawing.FontStyle]::Bold)
$label=[Drawing.Font]::new('Malgun Gothic',16,[Drawing.FontStyle]::Bold)
$small=[Drawing.Font]::new('Malgun Gothic',11)
$white=[Drawing.Brushes]::WhiteSmoke
$gold=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(226,196,133))
function New-RegionalSheet([int[]]$indices,[string]$file,[string]$title){
 $h=140+447*$indices.Length
 $canvas=[Drawing.Bitmap]::new(1360,$h)
 $paint=[Drawing.Graphics]::FromImage($canvas)
 try{
  $paint.Clear($bg)
  $paint.InterpolationMode='HighQualityBicubic'
  $paint.TextRenderingHint='AntiAliasGridFit'
  $paint.DrawString($title,$heading,$white,22,13)
  $paint.DrawString('수정 전',$label,$gold,22,67)
  $paint.DrawString('수정 후',$label,$gold,690,67)
  $paint.DrawString('같은 좌표 · 방향 · 시간대',$small,$gold,1060,73)
  for($i=0;$i -lt $indices.Length;$i++){
   $id=$indices[$i]
   $y=105+$i*447
   $paint.DrawString("$($regions[$id])  ·  $($routes[$id])",$label,$white,22,$y)
   for($side=0;$side -lt 2;$side++){
    $phase=@('before','after')[$side]
    $image=[Drawing.Image]::FromFile((Join-Path $folder "$phase-$id.png"))
    try{
     $paint.DrawImage($image,[Drawing.Rectangle]::new(22+$side*668,$y+36,646,395))
    }finally{$image.Dispose()}
   }
  }
  $canvas.Save((Join-Path $folder $file),[Drawing.Imaging.ImageFormat]::Jpeg)
 }finally{$paint.Dispose();$canvas.Dispose()}
}
try{
 New-RegionalSheet @(0,1,2,3) 'regions-01-04.jpg' '왕이 먹는 흙  |  지역별 그래픽 비교 1'
 New-RegionalSheet @(4,5,6,7) 'regions-05-08.jpg' '왕이 먹는 흙  |  지역별 그래픽 비교 2'
 for($id=0;$id -lt 8;$id++){
  New-RegionalSheet @($id) ($files[$id]+'.jpg') ("왕이 먹는 흙  |  "+$regions[$id])
 }
}finally{$heading.Dispose();$label.Dispose();$small.Dispose();$gold.Dispose()}
