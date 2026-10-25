$ErrorActionPreference = 'Stop'
$version = (Get-Content -LiteralPath package.json -Raw | ConvertFrom-Json).version
$stage = Join-Path ([IO.Path]::GetTempPath()) ('MusyDocs-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $stage | Out-Null
foreach ($item in @('README.md','CHANGELOG.md','LICENSE','THIRD_PARTY_NOTICES.md','docs','examples','licenses')) {
  Copy-Item -LiteralPath $item -Destination $stage -Recurse
}
$iconDir = Join-Path $stage 'build'
$imageDir = Join-Path $stage 'src/renderer/src/assets/examples'
New-Item -ItemType Directory -Path $iconDir,$imageDir -Force | Out-Null
Copy-Item -LiteralPath build/icon.png -Destination $iconDir
Get-ChildItem -LiteralPath src/renderer/src/assets/examples -File | Copy-Item -Destination $imageDir
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath "dist/Musy-v$version-docs.zip"
