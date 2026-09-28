param([ValidateSet('explore','walkthrough')][string]$Mode='explore',[string]$Api='http://127.0.0.1:8086')
$ErrorActionPreference='Stop'
if(-not $Api.StartsWith('http://127.0.0.1:')) { throw 'This helper only targets a local demo.' }
$body=@{mode=$Mode;confirmation='RESET FICTIONAL KITCHEN'} | ConvertTo-Json
Invoke-RestMethod -Uri ($Api+'/api/prep/demo/reset') -Method Post -ContentType 'application/json' -Body $body
