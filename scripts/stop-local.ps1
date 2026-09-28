$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$statePath=Join-Path $taskRoot '.runtime/app-processes.json'
if(-not (Test-Path -LiteralPath $statePath)) { throw 'No process record. This script stops only processes launched by start-local.ps1.' }
$state=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
if($state.root -ne $taskRoot){throw 'Process record belongs to a different checkout.'}
foreach($taskPid in @($state.backend,$state.frontend)) {
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$taskPid"
  if($process -and $process.CommandLine.Contains($taskRoot)){Stop-Process -Id $taskPid}
  elseif($process){throw "Process $taskPid does not match this checkout; it was not stopped."}
}
Write-Output 'Demo app stopped. MySQL and its stored data remain available.'
