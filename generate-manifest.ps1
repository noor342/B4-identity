# ─────────────────────────────────────────────
# generate-manifest.ps1
# Scans ./assets for media files and writes
# assets/manifest.json.
# Usage:  .\generate-manifest.ps1
# ─────────────────────────────────────────────

$ErrorActionPreference = 'Stop'

$assetsDir    = Join-Path $PSScriptRoot 'assets'
$manifestPath = Join-Path $assetsDir    'manifest.json'

$imageExts = @('.jpg', '.jpeg', '.png', '.webp', '.avif')
$gifExts   = @('.gif')
$videoExts = @('.mp4', '.webm', '.mov')
$allExts   = $imageExts + $gifExts + $videoExts

# Ensure assets/ exists
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir | Out-Null
    Write-Host '  Created assets/ directory.'
}

# Scan and sort
$files = Get-ChildItem -Path $assetsDir -File |
    Where-Object {
        $allExts -contains $_.Extension.ToLower() -and
        $_.Name -ne 'manifest.json' -and
        -not $_.Name.StartsWith('.')
    } |
    Sort-Object { [regex]::Replace($_.Name, '\d+', { param($m) $m.Value.PadLeft(20, '0') }) }

# Build manifest array
$manifest = @()
foreach ($f in $files) {
    $ext  = $f.Extension.ToLower()
    $type = if ($videoExts -contains $ext) { 'video' } else { 'image' }
    $manifest += [pscustomobject]@{ file = $f.Name; type = $type }
}

# Write JSON (UTF-8, no BOM)
$json = $manifest | ConvertTo-Json -Depth 3 -Compress:$false

# Handle single-item array (PowerShell unwraps it)
if ($manifest.Count -le 1) {
    $json = "[$json]"
}

[System.IO.File]::WriteAllText($manifestPath, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host ''
Write-Host "  ✓  manifest.json generated  —  $($manifest.Count) item(s)"
Write-Host ''

if ($manifest.Count -eq 0) {
    Write-Host '  ⚠  The assets/ folder is empty.'
    Write-Host '     Drop your media files there, then run this script again.'
} else {
    $i = 1
    foreach ($item in $manifest) {
        Write-Host ("     {0,3}. [{1}]  {2}" -f $i, $item.type, $item.file)
        $i++
    }
}
Write-Host ''
