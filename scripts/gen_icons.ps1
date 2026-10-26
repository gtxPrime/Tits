Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot "..\icon.png"
$iconsDir = Join-Path $PSScriptRoot "..\extension\icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$sizes = @(16, 48, 128)
$orig = [System.Drawing.Image]::FromFile($src)

foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $g.DrawImage($orig, 0, 0, $sz, $sz)
    $outPath = Join-Path $iconsDir "icon$sz.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
}

$orig.Dispose()
Write-Output "Successfully updated extension icons from icon.png!"
