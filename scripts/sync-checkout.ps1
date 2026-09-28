param([string]$Checkout = 'C:\ArchLife-Systems\group1-prep-purchase')
$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $Checkout 'LICENSE'))) { throw 'Expected upstream checkout not found.' }
# Copy authored files only. Preserve runtime dependencies, build products, and Git history.
Get-ChildItem -LiteralPath $sourceRoot -File -Recurse -Force | Where-Object {
  $_.FullName -notmatch '\\(node_modules|target|dist|\.git|\.tools|\.runtime)\\'
} | ForEach-Object {
  $relativePath = $_.FullName.Substring($sourceRoot.Length + 1)
  $destinationPath = Join-Path $Checkout $relativePath
  New-Item -ItemType Directory -Path (Split-Path -Parent $destinationPath) -Force | Out-Null
  Copy-Item -LiteralPath $_.FullName -Destination $destinationPath -Force
}
Write-Output "Source synchronized to $Checkout"
