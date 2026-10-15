# Render every slide of a .pptx to PNG via PowerPoint COM (read-only, no window).
param([string]$Deck, [string]$OutDir, [int]$Width = 1600)
$Deck = (Resolve-Path $Deck).Path
New-Item -ItemType Directory -Force $OutDir | Out-Null
$OutDir = (Resolve-Path $OutDir).Path
Get-ChildItem $OutDir -Filter *.png -ErrorAction SilentlyContinue | Remove-Item -Force
$app = New-Object -ComObject PowerPoint.Application
try {
  # Open(FileName, ReadOnly, Untitled, WithWindow)
  $pres = $app.Presentations.Open($Deck, -1, 0, 0)
  $h = [int]($Width * $pres.PageSetup.SlideHeight / $pres.PageSetup.SlideWidth)
  foreach ($s in $pres.Slides) {
    $s.Export((Join-Path $OutDir ("slide-{0:D2}.png" -f $s.SlideIndex)), "PNG", $Width, $h)
  }
  "{0} slides, {1}x{2}pt" -f $pres.Slides.Count, $pres.PageSetup.SlideWidth, $pres.PageSetup.SlideHeight
  $pres.Close()
} finally {
  $app.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
