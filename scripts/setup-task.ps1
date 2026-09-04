# PowerShell script to register X-29 Advance Automatic Backup in Windows Task Scheduler
$TaskName = "X-29 Advance Automatic Backup"
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c backup-auto.bat" -WorkingDirectory "D:\X-29-ADVANCE\X-29-advance-code"
$Triggers = @(
    (New-ScheduledTaskTrigger -Daily -At "8:00AM"),
    (New-ScheduledTaskTrigger -Daily -At "2:00PM"),
    (New-ScheduledTaskTrigger -Daily -At "8:00PM"),
    (New-ScheduledTaskTrigger -Daily -At "2:00AM")
)
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Triggers -Settings $Settings -User $env:USERNAME -Force
Write-Host "Task '$TaskName' registered with 4 daily triggers (8:00 AM, 2:00 PM, 8:00 PM, 2:00 AM) successfully."

