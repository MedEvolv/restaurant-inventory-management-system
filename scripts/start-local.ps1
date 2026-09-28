param([switch]$InstallDependencies)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$runtime=Join-Path $taskRoot '.runtime'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$portableJava=Get-ChildItem -LiteralPath (Join-Path $taskRoot '.tools') -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue | Select-Object -First 1
if($portableJava) { $env:JAVA_HOME=$portableJava.FullName }
if(-not $env:JAVA_HOME) { throw 'Set JAVA_HOME to a Java 21 JDK.' }
$java=Join-Path $env:JAVA_HOME 'bin/java.exe'
$version=& $java -version 2>&1 | Out-String
if($version -notmatch 'version "21\.') { throw 'Java 21 is required.' }
$env:PATH=(Join-Path $env:JAVA_HOME 'bin')+';'+$env:PATH
$node=(Get-Command node).Source
if((& $node --version) -notmatch '^v(2[4-9]|[3-9]\d)\.') { throw 'Use Node 24 or newer for this locked frontend.' }
foreach($port in @(8086,3016)) { if(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "Port $port is already in use. Open the existing demo or stop its own processes first." } }
# Use an already initialized portable MySQL only when it belongs to this checkout.
if(-not (Test-NetConnection 127.0.0.1 -Port 3316 -InformationLevel Quiet)) {
  $mysql=Join-Path $taskRoot '.tools/mysql-8.4.11-winx64/bin/mysqld.exe'
  $data=Join-Path $runtime 'mysql-data'
  if((Test-Path -LiteralPath $mysql) -and (Test-Path -LiteralPath (Join-Path $data 'auto.cnf'))) {
    Start-Process -FilePath $mysql -ArgumentList @('--bind-address=127.0.0.1','--port=3316','--mysqlx=OFF',('--datadir="'+$data+'"'),('--log-error="'+(Join-Path $runtime 'mysql.log')+'"')) -WindowStyle Hidden | Out-Null
    for($attempt=0;$attempt -lt 15;$attempt++) { if(Test-NetConnection 127.0.0.1 -Port 3316 -InformationLevel Quiet){break};Start-Sleep -Seconds 1 }
  } else { throw 'Start MySQL on port 3316 and run scripts/init-demo.sql, or run docker compose up -d db. See README.md.' }
}
Push-Location (Join-Path $taskRoot 'backend')
try { & .\mvnw.cmd -q -DskipTests package; if($LASTEXITCODE -ne 0){throw 'Backend package failed.'} } finally { Pop-Location }
Push-Location (Join-Path $taskRoot 'frontend')
try { if($InstallDependencies -or -not (Test-Path 'node_modules')){npm ci;if($LASTEXITCODE -ne 0){throw 'npm ci failed.'}} } finally { Pop-Location }
$jar=Join-Path $taskRoot 'backend/target/inventory-0.0.1-SNAPSHOT.jar'
$server=Start-Process -FilePath $java -ArgumentList @('-jar',('"'+$jar+'"'),'--spring.profiles.active=local') -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'backend.log') -RedirectStandardError (Join-Path $runtime 'backend-error.log') -PassThru
$vite=Join-Path $taskRoot 'frontend/node_modules/vite/bin/vite.js'
$client=Start-Process -FilePath $node -ArgumentList @(('"'+$vite+'"'),'--host','127.0.0.1') -WorkingDirectory (Join-Path $taskRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'frontend.log') -RedirectStandardError (Join-Path $runtime 'frontend-error.log') -PassThru
@{root=$taskRoot;backend=$server.Id;frontend=$client.Id} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtime 'app-processes.json')
for($attempt=0;$attempt -lt 40;$attempt++) { try { Invoke-RestMethod 'http://127.0.0.1:8086/api/prep/demo' | Out-Null; Write-Output 'Ready: http://127.0.0.1:3016';exit 0 } catch { Start-Sleep -Seconds 1 } }
throw 'Backend did not become ready. Inspect .runtime/backend.log.'
