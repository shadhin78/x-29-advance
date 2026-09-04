# PowerShell script to register X-29 Advance Automatic Backup in Windows Task Scheduler
$TaskName = "X-29 Advance Automatic Backup"
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c backup-auto.bat" -WorkingDirectory "D:\X-29-ADVANCE\X-29-advance-code"
$Triggers = @(
    (New-ScheduledTaskTrigger -Daily -At "11:00AM"),
    (New-ScheduledTaskTrigger -Daily -At "02:30PM"),
    (New-ScheduledTaskTrigger -Daily -At "07:30PM"),
    (New-ScheduledTaskTrigger -Daily -At "11:00PM")
)
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Triggers -Settings $Settings -User $env:USERNAME -Force
Write-Host "Task '$TaskName' registered with 4 daily triggers (11:00 AM, 02:30 PM, 07:30 PM, 11:00 PM) successfully."

