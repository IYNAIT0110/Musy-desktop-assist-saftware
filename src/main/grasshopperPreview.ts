import { execFile } from 'child_process'
import { join } from 'path'

let dll = ''
let unavailableUntil = 0

// GH_IO reads the archive dictionary only. It does not load Grasshopper
// definitions, evaluate components, or launch Rhino. Never bundle this DLL.
export async function grasshopperPreview(path: string): Promise<Buffer | null> {
  if (process.platform !== 'win32' || Date.now() < unavailableUntil) return null
  const script = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$dll = $env:MUSY_GH_IO
try {
  if (!$dll -or !(Test-Path -LiteralPath $dll)) {
    $roots = @()
    foreach ($base in @($env:ProgramFiles, [Environment]::GetEnvironmentVariable('ProgramFiles(x86)'))) {
      if ($base -and (Test-Path -LiteralPath $base)) {
        $roots += @(Get-ChildItem -LiteralPath $base -Directory -Filter 'Rhino*' -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
      }
    }
    foreach ($key in @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')) {
      $roots += @(Get-ItemProperty $key -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match '^(Rhino|Rhinoceros)' -and $_.InstallLocation } | ForEach-Object { $_.InstallLocation })
    }
    foreach ($root in $roots) {
      foreach ($relative in @('Plug-ins\\Grasshopper\\GH_IO.dll', 'System\\GH_IO.dll')) {
        $candidate = Join-Path $root $relative
        if (Test-Path -LiteralPath $candidate) { $dll = $candidate; break }
      }
      if ($dll) { break }
    }
  }
  if (!$dll) { Write-Output '{"available":false}'; exit 0 }
  [void][System.Reflection.Assembly]::LoadFrom($dll)
  $archive = New-Object GH_IO.Serialization.GH_Archive
  $image = ''
  if ($archive.ReadFromFile($env:MUSY_THUMBNAIL_PATH)) {
    $xml = $archive.Serialize_Xml()
    $match = [regex]::Match($xml, '<item\\b[^>]*\\bname\\s*=\\s*"Thumbnail"[^>]*>([\\s\\S]*?)</item>', 'IgnoreCase')
    if ($match.Success) {
      $bitmap = [regex]::Match($match.Groups[1].Value, '<bitmap\\b[^>]*>([A-Za-z0-9+/=\\s]+)</bitmap>', 'IgnoreCase')
      if ($bitmap.Success -and $bitmap.Groups[1].Value.Length -lt 4000000) { $image = $bitmap.Groups[1].Value -replace '\\s', '' }
    }
  }
  ConvertTo-Json -InputObject @{ available = $true; dll = $dll; image = $image } -Compress
} catch { Write-Output '{"available":false}' }
`
  return new Promise(resolve => {
    execFile(join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
      { windowsHide: true, timeout: 6000, maxBuffer: 5 * 1024 * 1024, encoding: 'utf8', env: { ...process.env, MUSY_THUMBNAIL_PATH: path, MUSY_GH_IO: dll } }, (error, output) => {
        if (error) { unavailableUntil = Date.now() + 5 * 60 * 1000; resolve(null); return }
        try {
          const result = JSON.parse(output.replace(/^\uFEFF/, ''))
          if (!result.available) { unavailableUntil = Date.now() + 5 * 60 * 1000; resolve(null); return }
          if (typeof result.dll === 'string') dll = result.dll
          const data = typeof result.image === 'string' ? Buffer.from(result.image, 'base64') : Buffer.alloc(0)
          resolve(data.length > 8 && data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ? data : null)
        } catch { resolve(null) }
      })
  })
}
